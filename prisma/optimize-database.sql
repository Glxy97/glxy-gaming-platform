-- ============================================
-- = GLXY Gaming Platform - Database Optimization
-- ============================================
-- Dieses Script optimiert die PostgreSQL-Datenbank für beste Performance
-- Führe es nach der Migration aus: npx prisma db execute --file ./prisma/optimize-database.sql

-- === 1. COMPOSITE INDEXES für häufige Queries ===

-- User-Login Performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_password_verified
ON users(email, email_verified)
WHERE email_verified IS NOT NULL;

-- Leaderboard Queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_game_scores_leaderboard
ON game_scores(game, game_mode, score DESC, created_at DESC);

-- Active Games Query
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_game_rooms_active
ON game_rooms(status, is_public, created_at DESC)
WHERE status IN ('waiting', 'playing');

-- User Activity Tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_activity
ON users(last_login DESC NULLS LAST, total_games_played DESC);

-- === 2. PARTIAL INDEXES für spezifische Queries ===

-- Unverified Users (für Email-Reminder)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_unverified
ON users(created_at, email)
WHERE email_verified IS NULL;

-- Locked Accounts (für Admin-Dashboard)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_locked
ON users(locked_until, email)
WHERE locked_until IS NOT NULL AND locked_until > NOW();

-- Active MFA Users
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_mfa
ON users(email, mfa_enabled)
WHERE mfa_enabled = true;

-- High Security Events
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_security_events_critical
ON security_events(created_at DESC, type, ip)
WHERE severity IN ('high', 'critical');

-- === 3. FOREIGN KEY PERFORMANCE ===

-- Optimiere Foreign Key Lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_accounts_provider_lookup
ON accounts(provider, provider_account_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_token_lookup
ON sessions(session_token, expires)
WHERE expires > NOW();

-- === 4. TEXT SEARCH INDEXES ===

-- Für Benutzersuche
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_search
ON users USING gin(to_tsvector('english', COALESCE(username, '') || ' ' || COALESCE(name, '')));

-- Für Chat-Message Suche
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_search
ON chat_messages USING gin(to_tsvector('english', content));

-- === 5. STATISTIK-TABELLEN für Performance ===

-- Materialized View für Leaderboards (aktualisiert stündlich)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_leaderboards AS
SELECT
    u.id,
    u.username,
    u.avatar,
    u.level,
    u.global_xp,
    COUNT(DISTINCT gs.game) as games_played,
    SUM(gs.wins) as total_wins,
    MAX(gs.updated_at) as last_active
FROM users u
LEFT JOIN game_stats gs ON u.id = gs.user_id
GROUP BY u.id, u.username, u.avatar, u.level, u.global_xp;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_leaderboards_id ON mv_leaderboards(id);
CREATE INDEX IF NOT EXISTS idx_mv_leaderboards_xp ON mv_leaderboards(global_xp DESC);
CREATE INDEX IF NOT EXISTS idx_mv_leaderboards_wins ON mv_leaderboards(total_wins DESC);

-- === 6. VACUUM & ANALYZE SETTINGS ===

-- Automatische Wartung für häufig geänderte Tabellen
ALTER TABLE game_scores SET (autovacuum_vacuum_scale_factor = 0.1);
ALTER TABLE game_rooms SET (autovacuum_vacuum_scale_factor = 0.1);
ALTER TABLE chat_messages SET (autovacuum_vacuum_scale_factor = 0.1);
ALTER TABLE sessions SET (autovacuum_vacuum_scale_factor = 0.1);

-- === 7. PERFORMANCE TUNING EMPFEHLUNGEN ===

/*
Füge diese Settings in postgresql.conf hinzu:

# Shared Memory (für 4GB RAM Server)
shared_buffers = 1GB
effective_cache_size = 3GB
work_mem = 4MB
maintenance_work_mem = 256MB

# Checkpoint Settings
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100

# Connection Pooling
max_connections = 200

# Query Planner
random_page_cost = 1.1  # Für SSD
effective_io_concurrency = 200  # Für SSD
*/

-- === 8. CLEANUP FUNCTIONS ===

-- Funktion zum Löschen alter Sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM sessions WHERE expires < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Funktion zum Löschen alter Security Events
CREATE OR REPLACE FUNCTION cleanup_old_security_events()
RETURNS void AS $$
BEGIN
    DELETE FROM security_events
    WHERE created_at < NOW() - INTERVAL '30 days'
    AND severity IN ('low', 'medium');

    DELETE FROM security_events
    WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- === 9. SCHEDULED JOBS (mit pg_cron oder manuell) ===

-- Schedule diese Jobs täglich:
-- SELECT cleanup_expired_sessions();
-- SELECT cleanup_old_security_events();
-- REFRESH MATERIALIZED VIEW CONCURRENTLY mv_leaderboards;

-- === 10. ANALYZE nach Index-Erstellung ===
ANALYZE users;
ANALYZE game_scores;
ANALYZE game_rooms;
ANALYZE game_stats;
ANALYZE chat_messages;
ANALYZE security_events;

-- === FERTIG ===
-- Alle Optimierungen wurden angewendet!
-- Überwache die Performance mit: SELECT * FROM pg_stat_user_tables;