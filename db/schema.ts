import { pgTable, text, timestamp, integer, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull(),
  name: text("name"),
  surname: text("surname"),
  avatar: text("avatar"),
  apiKey: text("api_key"),
  createdAt: timestamp("created_at").defaultNow()
});

export const prompts = pgTable("prompts", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  description: text("description"),
  tags: jsonb("tags").$type<string[]>().default([]),
  category: text("category"),
  version: text("version").default("1.0.0"),
  upvotes: integer("upvotes").default(0),
  downvotes: integer("downvotes").default(0),
  userId: integer("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const votes = pgTable("votes", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").references(() => users.id),
  promptId: integer("prompt_id").references(() => prompts.id),
  value: integer("value").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});

export const comments = pgTable("prompt_comments", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  content: text("content").notNull(),
  userId: integer("user_id").references(() => users.id),
  promptId: integer("prompt_id").references(() => prompts.id),
  createdAt: timestamp("created_at").defaultNow()
});

export const issues = pgTable("prompt_issues", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").default("open"),
  userId: integer("user_id").references(() => users.id),
  promptId: integer("prompt_id").references(() => prompts.id),
  createdAt: timestamp("created_at").defaultNow()
});

export const stars = pgTable("prompt_stars", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").references(() => users.id),
  promptId: integer("prompt_id").references(() => prompts.id),
  createdAt: timestamp("created_at").defaultNow()
});

export const forks = pgTable("prompt_forks", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  originalPromptId: integer("original_prompt_id").references(() => prompts.id),
  forkedPromptId: integer("forked_prompt_id").references(() => prompts.id),
  userId: integer("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow()
});

export const promptVersions = pgTable("prompt_versions", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  promptId: integer("prompt_id").references(() => prompts.id),
  version: text("version").notNull(),
  content: text("content").notNull(),
  description: text("description"),
  changes: text("changes"),
  userId: integer("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow()
});

export const pullRequests = pgTable("prompt_pull_requests", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").default("open"),
  sourcePromptId: integer("source_prompt_id").references(() => prompts.id),
  targetPromptId: integer("target_prompt_id").references(() => prompts.id),
  userId: integer("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow()
});

// Zod schemas for input validation
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export type User = z.infer<typeof selectUserSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;

export const insertPromptSchema = createInsertSchema(prompts);
export const selectPromptSchema = createSelectSchema(prompts);
export type Prompt = z.infer<typeof selectPromptSchema>;
export type InsertPrompt = z.infer<typeof insertPromptSchema>;

export const insertCommentSchema = createInsertSchema(comments);
export const selectCommentSchema = createSelectSchema(comments);
export type Comment = z.infer<typeof selectCommentSchema>;
export type InsertComment = z.infer<typeof insertCommentSchema>;

export const insertIssueSchema = createInsertSchema(issues);
export const selectIssueSchema = createSelectSchema(issues);
export type Issue = z.infer<typeof selectIssueSchema>;
export type InsertIssue = z.infer<typeof insertIssueSchema>;