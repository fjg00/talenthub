-- Add views column to jobs table
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS views integer NOT NULL DEFAULT 0;
