-- ============================================
-- = GLXY Gaming Platform - Database Optimization (Simple)
-- ============================================
-- Version ohne CONCURRENTLY für Prisma Execute

-- === 1. COMPOSITE INDEXES für häufige Queries ===

-- User-Login Performance
CREATE INDEX IF NOT EXISTS idx_users_email_password_verified
ON users(email, email_verified)
WHERE email_verified IS NOT NULL;

-- Leaderboard Queries
CREATE INDEX IF NOT EXISTS idx_game_scores_leaderboard
ON game_scores(game, "gameMode", score DESC, "createdAt" DESC);

-- Active Games Query
CREATE INDEX IF NOT EXISTS idx_game_rooms_active
ON game_rooms(status, is_public, created_at DESC)
WHERE status IN ('waiting', 'playing');

-- User Activity Tracking
CREATE INDEX IF NOT EXISTS idx_users_activity
ON users(last_login DESC NULLS LAST, total_games_played DESC);

-- === 2. PARTIAL INDEXES für spezifische Queries ===

-- Unverified Users
CREATE INDEX IF NOT EXISTS idx_users_unverified
ON users(created_at, email)
WHERE email_verified IS NULL;

-- Locked Accounts
CREATE INDEX IF NOT EXISTS idx_users_locked
ON users(locked_until, email)
WHERE locked_until IS NOT NULL;

-- MFA Users
CREATE INDEX IF NOT EXISTS idx_users_mfa
ON users(email, mfa_enabled)
WHERE mfa_enabled = true;

-- High Security Events
CREATE INDEX IF NOT EXISTS idx_security_events_critical
ON security_events(created_at DESC, type, ip)
WHERE severity IN ('high', 'critical');

-- === 3. ANALYZE nach Index-Erstellung ===
ANALYZE users;
ANALYZE game_scores;
ANALYZE game_rooms;
ANALYZE game_stats;
ANALYZE chat_messages;
ANALYZE security_events;