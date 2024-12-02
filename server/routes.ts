import type { Express } from "express";
import { setupAuth } from "./auth";
import { db } from "../db";
import { prompts, votes, users, comments, stars, forks, issues } from "@db/schema";
import { eq, sql, desc, and, type SQL } from "drizzle-orm";
import { testPrompt } from "./openai";

// Define types for joined queries
type UserSelect = {
  id: number;
  username: string;
  avatar: string | null;
};

type PromptWithUser = {
  id: number;
  title: string;
  content: string;
  description: string | null;
  tags: string[];
  upvotes: number;
  downvotes: number;
  category: string | null;
  version: string;
  createdAt: Date;
  updatedAt: Date;
  userId: number | null;
  user: {
    id: SQL<number>;
    username: SQL<string>;
    avatar: SQL<string | null>;
  };
};

export function registerRoutes(app: Express) {
  setupAuth(app);

  // Get all prompts with filters and sorting
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
          user: sql<UserSelect>`json_build_object(
            'id', ${users.id},
            'username', ${users.username},
            'avatar', ${users.avatar}
          )`
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

      const allPrompts = await finalQuery;
      res.json(allPrompts);
    } catch (error: any) {
      console.error('Error fetching prompts:', error);
      res.status(500).json({ 
        error: "Failed to fetch prompts",
        details: error.message 
      });
    }
  });

  // Get a single prompt
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
          user: sql<UserSelect>`json_build_object(
            'id', ${users.id},
            'username', ${users.username},
            'avatar', ${users.avatar}
          )`
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

  // Create new prompt
  app.post("/api/prompts", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      // Parse tags properly
      const tags = Array.isArray(req.body.tags) ? req.body.tags : [];
      
      // Log the request body with proper tags
      console.log('Creating prompt with data:', {
        ...req.body,
        content: req.body.content?.substring(0, 50) + '...',
        tags // Show parsed tags
      });

      // Validate required fields
      if (!req.body.title || !req.body.content) {
        return res.status(400).json({ 
          error: "Title and content are required",
          details: {
            title: !req.body.title ? "Title is required" : null,
            content: !req.body.content ? "Content is required" : null
          }
        });
      }

      const [prompt] = await db
        .insert(prompts)
        .values({
          title: req.body.title,
          content: req.body.content,
          description: req.body.description,
          category: req.body.category,
          version: req.body.version || "1.0.0",
          tags: sql`array[${sql.join(tags)}]::text[]`, // Properly format tags as PostgreSQL array
          userId: req.user!.id,
        })
        .returning();

      console.log('Successfully created prompt:', prompt.id);
      res.json(prompt);
    } catch (error: any) {
      console.error('Failed to create prompt:', error);
      res.status(500).json({ 
        error: "Failed to create prompt",
        message: error.message,
        details: error.detail || error.toString()
      });
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
          user: sql<UserSelect>`json_build_object(
            'id', ${users.id},
            'username', ${users.username},
            'avatar', ${users.avatar}
          )`
        })
        .from(comments)
        .leftJoin(users, eq(comments.userId, users.id))
        .where(eq(comments.promptId, promptId))
        .orderBy(desc(comments.createdAt));

      res.json(result);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
      res.status(500).json({ 
        error: "Failed to fetch comments",
        message: error instanceof Error ? error.message : "Unknown error"
      });
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
          user: sql<UserSelect>`json_build_object(
            'id', ${users.id},
            'username', ${users.username},
            'avatar', ${users.avatar}
          )`
        })
        .from(comments)
        .leftJoin(users, eq(comments.userId, users.id))
        .where(eq(comments.id, comment.id));

      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to create comment" });
    }
  });

  // Test prompt endpoint
  app.post("/api/test-prompt", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const { prompt, input } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      const result = await testPrompt(prompt, input || "");

      res.json(result);
    } catch (error: any) {
      console.error('OpenAI API error:', error);
      res.status(500).json({ 
        error: "Failed to test prompt",
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Analyze prompt endpoint
  app.post("/api/analyze-prompt", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const { prompt } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      const response = await openai.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are a prompt engineering expert. Analyze the given prompt and provide feedback on its effectiveness, suggestions for improvement, and tone analysis. Respond with JSON in this format: { 'effectiveness': number from 0 to 1, 'suggestions': array of strings, 'tone': string }"
          },
          {
            role: "user",
            content: prompt
          }
        ],
        model: "gpt-4o",
        response_format: { type: "json_object" }
      });

      const analysis = JSON.parse(response.choices[0].message.content || "{}");
      res.json(analysis);
    } catch (error: any) {
      console.error('OpenAI API error:', error);
      res.status(500).json({ 
        error: "Failed to analyze prompt",
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // User endpoints
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

  // Get user's prompts with proper user data
  app.get("/api/users/:id/prompts", async (req, res) => {
    const userId = parseInt(req.params.id);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    try {
      const [userPrompts, total] = await Promise.all([
        db
          .select({
            id: prompts.id,
            title: prompts.title,
            content: prompts.content,
            description: prompts.description,
            tags: prompts.tags,
            category: prompts.category,
            version: prompts.version,
            createdAt: prompts.createdAt,
            updatedAt: prompts.updatedAt,
            userId: prompts.userId,
            user: sql<UserSelect>`json_build_object(
              'id', ${users.id},
              'username', ${users.username},
              'avatar', ${users.avatar}
            )`
          })
          .from(prompts)
          .leftJoin(users, eq(prompts.userId, users.id))
          .where(eq(prompts.userId, userId))
          .orderBy(desc(prompts.createdAt))
          .limit(limit)
          .offset(offset),
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(prompts)
          .where(eq(prompts.userId, userId))
      ]);

      res.json({
        prompts: userPrompts,
        total: total[0].count,
        page,
        limit
      });
    } catch (error) {
      console.error('Failed to fetch user prompts:', error);
      res.status(500).json({ error: "Failed to fetch user prompts" });
    }
  });

  // Get user's starred prompts
  app.get("/api/users/:id/starred", async (req, res) => {
    const userId = parseInt(req.params.id);
    try {
      const starredPrompts = await db
        .select({
          prompt: {
            id: prompts.id,
            title: prompts.title,
            content: prompts.content,
            description: prompts.description,
            createdAt: prompts.createdAt,
            user: sql<UserSelect>`json_build_object(
              'id', ${users.id},
              'username', ${users.username},
              'avatar', ${users.avatar}
            )`
          }
        })
        .from(stars)
        .where(eq(stars.userId, userId))
        .innerJoin(prompts, eq(stars.promptId, prompts.id))
        .leftJoin(users, eq(prompts.userId, users.id))
        .orderBy(desc(stars.createdAt));
      res.json(starredPrompts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch starred prompts" });
    }
  });

  // Get user's forks
  app.get("/api/users/:id/forks", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      const forkQuery = db
        .select({
          fork: {
            id: prompts.id,
            title: prompts.title,
            content: prompts.content,
            description: prompts.description,
            tags: prompts.tags,
            category: prompts.category,
            version: prompts.version,
            createdAt: prompts.createdAt,
            userId: prompts.userId,
          },
          original: {
            id: prompts.id,
            title: prompts.title,
            user: sql<UserSelect>`json_build_object(
              'id', ${users.id},
              'username', ${users.username},
              'avatar', ${users.avatar}
            )`
          }
        })
        .from(forks)
        .where(eq(forks.userId, userId))
        .leftJoin(prompts, eq(forks.forkedPromptId, prompts.id))
        .leftJoin(prompts as typeof prompts, eq(forks.originalPromptId, prompts.id))
        .leftJoin(users, eq(prompts.userId, users.id));

      const userForks = await forkQuery;
      res.json({ forks: userForks });
    } catch (error) {
      console.error('Failed to fetch user forks:', error);
      res.status(500).json({ error: "Failed to fetch user forks" });
    }
  });

  // Get user's issues
  app.get("/api/users/:id/issues", async (req, res) => {
    const userId = parseInt(req.params.id);
    try {
      const userIssues = await db
        .select({
          issue: {
            id: issues.id,
            title: issues.title,
            description: issues.description,
            status: issues.status,
            createdAt: issues.createdAt
          },
          prompt: {
            id: prompts.id,
            title: prompts.title,
            user: sql<UserSelect>`json_build_object(
              'id', ${users.id},
              'username', ${users.username},
              'avatar', ${users.avatar}
            )`
          }
        })
        .from(issues)
        .where(eq(issues.userId, userId))
        .innerJoin(prompts, eq(issues.promptId, prompts.id))
        .leftJoin(users, eq(prompts.userId, users.id))
        .orderBy(desc(issues.createdAt));
      res.json(userIssues);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user issues" });
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

  // Fork endpoint with proper user association and error handling
  app.post("/api/prompts/:id/fork", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const promptId = parseInt(req.params.id);
      const userId = req.user!.id;

      // Verify prompt exists and fetch it
      const [originalPrompt] = await db
        .select({
          id: prompts.id,
          title: prompts.title,
          content: prompts.content,
          description: prompts.description,
          tags: prompts.tags,
          category: prompts.category,
          version: prompts.version,
        })
        .from(prompts)
        .where(eq(prompts.id, promptId))
        .limit(1);

      if (!originalPrompt) {
        return res.status(404).json({ error: "Original prompt not found" });
      }

      // Create fork within transaction
      const result = await db.transaction(async (tx) => {
        // Create new prompt
        const [forkedPrompt] = await tx
          .insert(prompts)
          .values({
            title: `Fork of ${originalPrompt.title}`,
            content: originalPrompt.content,
            description: originalPrompt.description,
            tags: originalPrompt.tags || [],
            category: originalPrompt.category,
            userId: userId,
            version: originalPrompt.version
          })
          .returning();

        // Create fork relationship
        await tx
          .insert(forks)
          .values({
            originalPromptId: promptId,
            forkedPromptId: forkedPrompt.id,
            userId: userId,
          });

        return forkedPrompt;
      });

      res.json(result);
    } catch (error) {
      console.error('Fork error:', error);
      res.status(500).json({ 
        error: "Failed to fork prompt",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Star endpoints
  app.post("/api/prompts/:id/star", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const promptId = parseInt(req.params.id);
    const userId = req.user!.id;

    try {
      if (isNaN(promptId)) {
        return res.status(400).json({ error: "Invalid prompt ID" });
      }

      // Check if prompt exists
      const [promptExists] = await db
        .select({ id: prompts.id })
        .from(prompts)
        .where(eq(prompts.id, promptId))
        .limit(1);

      if (!promptExists) {
        return res.status(404).json({ error: "Prompt not found" });
      }

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

        // Get updated count
        const [{ count }] = await db
          .select({
            count: sql<number>`count(*)::int`
          })
          .from(stars)
          .where(eq(stars.promptId, promptId));

        return res.json({ starred: false, count: count || 0 });
      }

      // Add star if not already starred
      await db.insert(stars).values({ promptId, userId });
      
      // Get updated count
      const [{ count }] = await db
        .select({
          count: sql<number>`count(*)::int`
        })
        .from(stars)
        .where(eq(stars.promptId, promptId));

      return res.json({ starred: true, count: count || 0 });
    } catch (error: any) {
      console.error('Star error:', error);
      res.status(500).json({ 
        error: "Failed to update star",
        message: error.message
      });
    }
  });

  // Get fork count and user's fork status
  app.get("/api/prompts/:id/forks", async (req, res) => {
    try {
      const promptId = parseInt(req.params.id);
      const userId = req.user?.id;

      if (isNaN(promptId)) {
        return res.status(400).json({ error: "Invalid prompt ID", count: 0, isForked: false });
      }

      // First verify the prompt exists
      const [promptExists] = await db
        .select({ id: prompts.id })
        .from(prompts)
        .where(eq(prompts.id, promptId))
        .limit(1);

      if (!promptExists) {
        return res.status(404).json({ error: "Prompt not found", count: 0, isForked: false });
      }

      const [{ count }] = await db
        .select({
          count: sql<number>`count(*)::int`
        })
        .from(forks)
        .where(eq(forks.originalPromptId, promptId));

      let isForked = false;
      if (userId) {
        const [userFork] = await db
          .select()
          .from(forks)
          .where(
            and(
              eq(forks.originalPromptId, promptId),
              eq(forks.userId, userId)
            )
          )
          .limit(1);
        isForked = !!userFork;
      }

      res.json({ count: count || 0, isForked });
    } catch (error: any) {
      console.error('Get forks error:', error);
      res.status(500).json({ 
        error: "Failed to get fork count",
        message: error.message,
        count: 0,
        isForked: false
      });
    }
  });

  // Get star count and user's star status
  app.get("/api/prompts/:id/stars", async (req, res) => {
    try {
      const promptId = parseInt(req.params.id);
      const userId = req.user?.id;

      if (isNaN(promptId)) {
        return res.status(400).json({ error: "Invalid prompt ID", count: 0, isStarred: false });
      }

      // First verify the prompt exists
      const [promptExists] = await db
        .select({ id: prompts.id })
        .from(prompts)
        .where(eq(prompts.id, promptId))
        .limit(1);

      if (!promptExists) {
        return res.status(404).json({ error: "Prompt not found", count: 0, isStarred: false });
      }

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

      res.json({ count: count || 0, isStarred });
    } catch (error: any) {
      console.error('Get stars error:', error);
      res.status(500).json({ 
        error: "Failed to get star count",
        message: error.message,
        count: 0,
        isStarred: false
      });
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
          user: sql<UserSelect>`json_build_object(
            'id', ${users.id},
            'username', ${users.username},
            'avatar', ${users.avatar}
          )`
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