-- Migration: Make username optional for OAuth users
-- Date: 2025-09-20

-- Allow username to be nullable for OAuth users
ALTER TABLE users ALTER COLUMN username DROP NOT NULL;

-- Allow password to be empty for OAuth users (set default)
ALTER TABLE users ALTER COLUMN password SET DEFAULT '';