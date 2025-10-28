-- +migrate Up
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS mfa_secret TEXT NULL;

-- +migrate Down  
ALTER TABLE users
  DROP COLUMN IF EXISTS mfa_secret,
  DROP COLUMN IF EXISTS mfa_enabled;

