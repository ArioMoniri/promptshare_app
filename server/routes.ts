import type { Express } from "express";
import { setupAuth } from "./auth";
import { db } from "../db";
import { prompts, votes, users, comments } from "@db/schema";
import { eq, sql } from "drizzle-orm";
import { openai } from "./openai";

export function registerRoutes(app: Express) {
  setupAuth(app);

  app.get("/api/prompts", async (req, res) => {
    try {
      const allPrompts = await db
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
        .leftJoin(users, eq(prompts.userId, users.id));
      
      if (!allPrompts) {
        return res.status(404).json({ error: "No prompts found" });
      }
      
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
          ...req.body,
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
      return res.status(401).send("Not authenticated");
    }

    const promptId = parseInt(req.params.id);
    if (isNaN(promptId)) {
      return res.status(400).send("Invalid prompt ID");
    }

    const value = parseInt(req.body.value); // 1 for promote, -1 for downvote
    if (value !== 1 && value !== -1) {
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
      });

      res.json({ ok: true });
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

    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).send("Prompt is required");
    }

    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, req.user!.id))
        .limit(1);

      if (!user.apiKey) {
        return res.status(400).send("OpenAI API key not set");
      }

      const result = await openai.test(prompt, user.apiKey);
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
}
