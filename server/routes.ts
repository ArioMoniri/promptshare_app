import type { Express } from "express";
import { setupAuth } from "./auth";
import { db } from "../db";
import { prompts, votes, users, comments, stars, forks } from "@db/schema";
import { eq, sql, desc, and } from "drizzle-orm";
import { testPrompt } from "./openai";

export function registerRoutes(app: Express) {
  setupAuth(app);

  app.get("/api/prompts", async (req, res) => {
    try {
      const { sort = 'recent', search = '' } = req.query;
      
      const baseQuery = db
        .select({
          id: prompts.id,
          title: prompts.title,
          content: prompts.content,
          description: prompts.description,
          tags: prompts.tags,
          upvotes: prompts.upvotes,
          downvotes: prompts.downvotes,
          category: prompts.category,
          version: prompts.version,
          createdAt: prompts.createdAt,
          updatedAt: prompts.updatedAt,
          userId: prompts.userId,
          user: {
            id: users.id,
            username: users.username,
            avatar: users.avatar
          }
        })
        .from(prompts)
        .leftJoin(users, eq(prompts.userId, users.id));

      // Add search filter if provided
      let query = search 
        ? baseQuery.where(
            sql`${prompts.title} ILIKE ${`%${search}%`} OR 
                ${prompts.content} ILIKE ${`%${search}%`} OR 
                ${prompts.tags} ?& ${JSON.stringify([search])}`
          )
        : baseQuery;

      // Add trending calculation
      const trendingScore = sql`(
        (${prompts.upvotes} - ${prompts.downvotes}) / 
        POWER(EXTRACT(EPOCH FROM (NOW() - ${prompts.createdAt})) / 3600 + 2, 1.8)
      )`;

      // Add sorting
      const finalQuery = sort === 'trending'
        ? query.orderBy(desc(trendingScore))
        : sort === 'popular'
        ? query.orderBy(desc(sql`${prompts.upvotes} - ${prompts.downvotes}`))
        : sort === 'controversial'
        ? query.orderBy(desc(sql`(${prompts.upvotes} + ${prompts.downvotes}) * 
            CASE WHEN ${prompts.downvotes} > 0 
            THEN 1.0 * ${prompts.downvotes} / ${prompts.upvotes} 
            ELSE 0 END`))
        : query.orderBy(desc(prompts.createdAt));

      const allPrompts = await query;
      res.json(allPrompts);
    } catch (error: any) {
      console.error('Error fetching prompts:', error);
      res.status(500).json({ 
        error: "Failed to fetch prompts",
        details: error.message 
      });
    }
  });

  app.get("/api/prompts/:id", async (req, res) => {
    try {
      const promptId = parseInt(req.params.id);
      if (isNaN(promptId)) {
        return res.status(400).send("Invalid prompt ID");
      }

      const [prompt] = await db
        .select({
          id: prompts.id,
          title: prompts.title,
          content: prompts.content,
          description: prompts.description,
          tags: prompts.tags,
          upvotes: prompts.upvotes,
          downvotes: prompts.downvotes,
          version: prompts.version,
          createdAt: prompts.createdAt,
          updatedAt: prompts.updatedAt,
          userId: prompts.userId,
          user: {
            id: users.id,
            username: users.username,
            avatar: users.avatar
          }
        })
        .from(prompts)
        .leftJoin(users, eq(prompts.userId, users.id))
        .where(eq(prompts.id, promptId))
        .limit(1);

      if (!prompt) {
        return res.status(404).json({ error: "Prompt not found" });
      }

      res.json(prompt);
    } catch (error) {
      console.error('Error fetching prompt:', error);
      res.status(500).json({ error: "Failed to fetch prompt" });
    }
  });

  app.post("/api/prompts", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const [prompt] = await db
        .insert(prompts)
        .values({
          title: req.body.title,
          content: req.body.content,
          description: req.body.description,
          category: req.body.category,
          version: req.body.version || "1.0.0",
          tags: req.body.tags || [],
          userId: req.user!.id,
        })
        .returning();
      res.json(prompt);
    } catch (error) {
      res.status(500).json({ error: "Failed to create prompt" });
    }
  });

  // Handle promote/downvote
  app.post("/api/prompts/:id/vote", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Unauthorized");
    }

    const promptId = parseInt(req.params.id);
    if (isNaN(promptId)) {
      return res.status(400).send("Invalid prompt ID");
    }

    const value = req.body.value;
    if (value !== -1 && value !== 0 && value !== 1) {
      return res.status(400).send("Invalid vote value");
    }

    try {
      // Verify prompt exists
      const [promptExists] = await db
        .select({ id: prompts.id })
        .from(prompts)
        .where(eq(prompts.id, promptId))
        .limit(1);

      if (!promptExists) {
        return res.status(404).send("Prompt not found");
      }

      await db.transaction(async (tx) => {
        // Check if user has already voted
        const [existingVote] = await tx
          .select()
          .from(votes)
          .where(
            sql`${votes.promptId} = ${promptId} AND ${votes.userId} = ${req.user!.id}`
          )
          .limit(1);

        if (existingVote) {
          if (existingVote.value === value) {
            // Remove vote if same value
            await tx
              .delete(votes)
              .where(eq(votes.id, existingVote.id));
          } else {
            // Update vote if different value
            await tx
              .update(votes)
              .set({ value })
              .where(eq(votes.id, existingVote.id));
          }
        } else {
          // Create new vote
          await tx
            .insert(votes)
            .values({
              promptId,
              userId: req.user!.id,
              value,
            });
        }

        // Update upvotes and downvotes counts
        const [{ upvotes, downvotes }] = await tx
          .select({
            upvotes: sql<number>`COALESCE(SUM(CASE WHEN value = 1 THEN 1 ELSE 0 END), 0)`,
            downvotes: sql<number>`COALESCE(SUM(CASE WHEN value = -1 THEN 1 ELSE 0 END), 0)`
          })
          .from(votes)
          .where(eq(votes.promptId, promptId));

        await tx
          .update(prompts)
          .set({ 
            upvotes,
            downvotes
          })
          .where(eq(prompts.id, promptId));

        // Return updated counts
        res.json({ 
          ok: true,
          upvotes: upvotes,
          downvotes: downvotes
        });
      });
    } catch (error: any) {
      console.error('Vote error:', error);
      res.status(500).json({ 
        error: "Failed to update vote",
        message: error.message 
      });
    }
  });
  // Comments endpoints
  app.get("/api/prompts/:id/comments", async (req, res) => {
    const promptId = parseInt(req.params.id);
    if (isNaN(promptId)) {
      return res.status(400).send("Invalid prompt ID");
    }

    try {
      const result = await db
        .select({
          id: comments.id,
          content: comments.content,
          createdAt: comments.createdAt,
          user: {
            id: users.id,
            username: users.username,
            avatar: users.avatar
          }
        })
        .from(comments)
        .leftJoin(users, eq(comments.userId, users.id))
        .where(eq(comments.promptId, promptId));

      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch comments" });
    }
  });

  app.post("/api/prompts/:id/comments", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    const promptId = parseInt(req.params.id);
    if (isNaN(promptId)) {
      return res.status(400).send("Invalid prompt ID");
    }

    const { content } = req.body;
    if (!content) {
      return res.status(400).send("Comment content is required");
    }

    try {
      const [comment] = await db
        .insert(comments)
        .values({
          promptId,
          userId: req.user!.id,
          content
        })
        .returning();

      // Fetch the complete comment with user data
      const [result] = await db
        .select({
          id: comments.id,
          content: comments.content,
          createdAt: comments.createdAt,
          user: {
            id: users.id,
            username: users.username,
            avatar: users.avatar
          }
        })
        .from(comments)
        .leftJoin(users, eq(comments.userId, users.id))
        .where(eq(comments.id, comment.id));

      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to create comment" });
    }
  });


  app.post("/api/test-prompt", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    if (!req.user.apiKey) {
      return res.status(400).send("Please add your OpenAI API key in your profile settings");
    }

    try {
      const result = await testPrompt(req.body.input, req.user.apiKey);
      res.json(result);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const [user] = await db
        .select({
          id: users.id,
          username: users.username,
          name: users.name,
          surname: users.surname,
          avatar: users.avatar,
          createdAt: users.createdAt,
          // Don't include email for other users' profiles
          email: sql`CASE WHEN ${users.id} = ${req.user?.id} THEN ${users.email} ELSE NULL END`,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user profile" });
    }
  });

  app.get("/api/prompts/:id/vote-state", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    const promptId = parseInt(req.params.id);
    if (isNaN(promptId)) {
      return res.status(400).send("Invalid prompt ID");
    }

    try {
      const [vote] = await db
        .select({ value: votes.value })
        .from(votes)
        .where(
          sql`${votes.promptId} = ${promptId} AND ${votes.userId} = ${req.user!.id}`
        )
        .limit(1);

      res.json({ value: vote?.value || 0 });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch vote state" });
    }
  });
  app.post("/api/prompts/:id/fork", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Unauthorized");
    }

    const promptId = parseInt(req.params.id);
    const userId = req.user!.id;

    try {
      const [originalPrompt] = await db
        .select()
        .from(prompts)
        .where(eq(prompts.id, promptId));

      if (!originalPrompt) {
        return res.status(404).send("Prompt not found");
      }

      // Create new prompt as fork
      const [forkedPrompt] = await db
        .insert(prompts)
        .values({
          title: `Fork of ${originalPrompt.title}`,
          content: originalPrompt.content,
          description: originalPrompt.description,
          tags: originalPrompt.tags,
          category: originalPrompt.category,
          userId: userId,
        })
        .returning();

      // Record fork relationship
      await db
        .insert(forks)
        .values({
          originalPromptId: promptId,
          forkedPromptId: forkedPrompt.id,
          userId: userId,
        });

      res.json(forkedPrompt);
    } catch (error: any) {
      console.error("Fork error:", error);
      res.status(500).send("Failed to fork prompt");
    }
  });
  app.post("/api/prompts/:id/star", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Unauthorized");
    }

    const promptId = parseInt(req.params.id);
    const userId = req.user!.id;

    try {
      // Check if user has already starred
      const [existingStar] = await db
        .select()
        .from(stars)
        .where(
          and(
            eq(stars.promptId, promptId),
            eq(stars.userId, userId)
          )
        )
        .limit(1);

      if (existingStar) {
        // Remove star if already starred
        await db
          .delete(stars)
          .where(
            and(
              eq(stars.promptId, promptId),
              eq(stars.userId, userId)
            )
          );
        return res.json({ starred: false });
      }

      // Add star if not already starred
      await db.insert(stars).values({ promptId, userId });
      
      // Get updated star count
      const [{ count }] = await db
        .select({
          count: sql<number>`count(*)::int`
        })
        .from(stars)
        .where(eq(stars.promptId, promptId));

      return res.json({ starred: true, count });
    } catch (error) {
      console.error('Star error:', error);
      res.status(500).json({ error: "Failed to update star" });
    }
  });

  // Add endpoint to get star count and user's star status
  app.get("/api/prompts/:id/stars", async (req, res) => {
    const promptId = parseInt(req.params.id);
    const userId = req.user?.id;

    try {
      const [{ count }] = await db
        .select({
          count: sql<number>`count(*)::int`
        })
        .from(stars)
        .where(eq(stars.promptId, promptId));

      let isStarred = false;
      if (userId) {
        const [userStar] = await db
          .select()
          .from(stars)
          .where(
            and(
              eq(stars.promptId, promptId),
              eq(stars.userId, userId)
            )
          )
          .limit(1);
        isStarred = !!userStar;
      }

      res.json({ count, isStarred });
    } catch (error) {
      console.error('Get stars error:', error);
      res.status(500).json({ error: "Failed to get stars" });
    }
  });

  // Issues endpoints
  app.post("/api/prompts/:id/issues", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Unauthorized");
    }

    const promptId = parseInt(req.params.id);
    const userId = req.user!.id;
    const { title, description } = req.body;

    try {
      const [issue] = await db
        .insert(issues)
        .values({
          title,
          description,
          promptId,
          userId,
          status: 'open'
        })
        .returning();

      res.json(issue);
    } catch (error) {
      console.error('Create issue error:', error);
      res.status(500).json({ error: "Failed to create issue" });
    }
  });

  app.get("/api/prompts/:id/issues", async (req, res) => {
    const promptId = parseInt(req.params.id);

    try {
      const promptIssues = await db
        .select({
          id: issues.id,
          title: issues.title,
          description: issues.description,
          status: issues.status,
          createdAt: issues.createdAt,
          user: {
            id: users.id,
            username: users.username,
            avatar: users.avatar
          }
        })
        .from(issues)
        .leftJoin(users, eq(issues.userId, users.id))
        .where(eq(issues.promptId, promptId))
        .orderBy(desc(issues.createdAt));

      res.json(promptIssues);
    } catch (error) {
      console.error('Fetch issues error:', error);
      res.status(500).json({ error: "Failed to fetch issues" });
    }
  });
}
