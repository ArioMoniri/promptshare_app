import { pgTable, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
  email: text("email").unique().notNull(),
  name: text("name").notNull(),
  surname: text("surname").notNull(),
  apiKey: text("api_key"),
  avatar: text("avatar"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const prompts = pgTable("prompts", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  description: text("description"),
  tags: text("tags").array().default([]),
  upvotes: integer("upvotes").default(0),
  downvotes: integer("downvotes").default(0),
  category: text("category"),
  version: text("version").default("1.0.0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const comments = pgTable("comments", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  promptId: integer("prompt_id").references(() => prompts.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const votes = pgTable("votes", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  promptId: integer("prompt_id").references(() => prompts.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  value: integer("value").notNull(), // 1 for promote, -1 for downvote
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const promptVersions = pgTable("prompt_versions", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  promptId: integer("prompt_id").references(() => prompts.id).notNull(),
  version: integer("version").notNull(),
  content: text("content").notNull(),
  changes: text("changes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const promptResults = pgTable("prompt_results", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  promptId: integer("prompt_id").references(() => prompts.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  input: text("input").notNull(),
  output: jsonb("output").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = z.infer<typeof selectUserSchema>;

export const insertPromptSchema = createInsertSchema(prompts);
export const selectPromptSchema = createSelectSchema(prompts);
export type InsertPrompt = z.infer<typeof insertPromptSchema>;
export const selectPromptWithUserSchema = selectPromptSchema.extend({
  user: selectUserSchema.pick({
    id: true,
    username: true,
    avatar: true
  }).nullable(),
});

export type Prompt = z.infer<typeof selectPromptWithUserSchema> & {
  comments?: Array<{
    id: number;
    content: string;
    createdAt: string;
    user: {
      id: number;
      username: string;
      avatar: string | null;
    } | null;
  }>;
};

export const insertCommentSchema = createInsertSchema(comments);
export const selectCommentSchema = createSelectSchema(comments);
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = z.infer<typeof selectCommentSchema>;
