import type { Express } from "express";
import { setupAuth } from "./auth";
import { db } from "../db";
import { prompts, users } from "@db/schema";
import { eq } from "drizzle-orm";
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
          likes: prompts.likes,
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
      res.json(allPrompts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch prompts" });
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
}
