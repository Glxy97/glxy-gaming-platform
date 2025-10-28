-- Add email verification to users table
-- Migration: 20250915141405_add_email_verification

ALTER TABLE users 
ADD COLUMN email_verified BOOLEAN DEFAULT false NOT NULL,
ADD COLUMN verification_token TEXT,
ADD COLUMN token_expires TIMESTAMPTZ;

-- Add indexes for performance
CREATE INDEX idx_users_verification_token ON users(verification_token);
CREATE INDEX idx_users_email_verified ON users(email_verified);
