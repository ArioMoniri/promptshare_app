import { sql } from "drizzle-orm";

export async function up() {
  return sql`
    ALTER TABLE prompts ADD COLUMN IF NOT EXISTS category text;
    ALTER TABLE prompts ADD COLUMN IF NOT EXISTS version text DEFAULT '1.0.0';
    
    UPDATE prompts SET category = 'Other' WHERE category IS NULL;
    UPDATE prompts SET version = '1.0.0' WHERE version IS NULL;
  `;
}

export async function down() {
  return sql`
    ALTER TABLE prompts DROP COLUMN IF EXISTS category;
    ALTER TABLE prompts DROP COLUMN IF EXISTS version;
  `;
}
