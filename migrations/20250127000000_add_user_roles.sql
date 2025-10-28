-- Migration: Add UserRole enum and role field to User table
-- Created: 2025-01-27

-- Create UserRole enum
CREATE TYPE "UserRole" AS ENUM ('USER', 'MODERATOR', 'ADMIN');

-- Add role column to users table with default value
ALTER TABLE "users" ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'USER';

-- Create index on role column for performance
CREATE INDEX "users_role_idx" ON "users"("role");

-- Update existing users to have USER role (already default, but explicit)
UPDATE "users" SET "role" = 'USER' WHERE "role" IS NULL;


