import { sql } from "drizzle-orm";

export async function up() {
  return sql`
    -- Convert tags to JSONB type
    ALTER TABLE prompts 
    ALTER COLUMN tags TYPE jsonb USING COALESCE(tags::jsonb, '[]'::jsonb);

    -- Update version column to text
    ALTER TABLE prompts 
    ALTER COLUMN version TYPE text USING version::text;

    -- Add updated_at timestamp
    ALTER TABLE prompts 
    ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT CURRENT_TIMESTAMP;

    -- Create indexes for better performance
    CREATE INDEX IF NOT EXISTS idx_prompts_user_id ON prompts(user_id);
    CREATE INDEX IF NOT EXISTS idx_votes_prompt_id ON votes(prompt_id);
    CREATE INDEX IF NOT EXISTS idx_comments_prompt_id ON prompt_comments(prompt_id);
    CREATE INDEX IF NOT EXISTS idx_stars_prompt_id ON prompt_stars(prompt_id);
  `;
}

export async function down() {
  return sql`
    DROP INDEX IF EXISTS idx_prompts_user_id;
    DROP INDEX IF EXISTS idx_votes_prompt_id;
    DROP INDEX IF EXISTS idx_comments_prompt_id;
    DROP INDEX IF EXISTS idx_stars_prompt_id;

    ALTER TABLE prompts 
    ALTER COLUMN tags TYPE text[] USING tags::text[];

    ALTER TABLE prompts 
    ALTER COLUMN version TYPE integer USING version::integer;

    ALTER TABLE prompts 
    DROP COLUMN IF EXISTS updated_at;
  `;
}
