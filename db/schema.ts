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
  tags: text("tags").array(),
  likes: integer("likes").default(0),
  version: integer("version").default(1),
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

export const likes = pgTable("likes", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  promptId: integer("prompt_id").references(() => prompts.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
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
export type Prompt = z.infer<typeof selectPromptSchema>;

export const insertCommentSchema = createInsertSchema(comments);
export const selectCommentSchema = createSelectSchema(comments);
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = z.infer<typeof selectCommentSchema>;
