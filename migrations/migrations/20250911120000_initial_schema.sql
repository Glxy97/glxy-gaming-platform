-- +migrate Up

-- Create enum types
CREATE TYPE user_account_type AS ENUM ('oauth', 'credentials');

-- Users table
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    -- Profile fields
    avatar TEXT,
    bio TEXT,
    level INTEGER DEFAULT 1 NOT NULL,
    global_xp INTEGER DEFAULT 0 NOT NULL,
    coins INTEGER DEFAULT 100 NOT NULL,
    
    -- Security fields
    login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    last_login TIMESTAMP WITH TIME ZONE
);

-- Create indexes for users table
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_level_globalxp ON users(level, global_xp);
CREATE INDEX idx_users_last_login ON users(last_login);
CREATE INDEX idx_users_locked_until ON users(locked_until);

-- Accounts table (NextAuth)
CREATE TABLE accounts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    provider TEXT NOT NULL,
    provider_account_id TEXT NOT NULL,
    refresh_token TEXT,
    access_token TEXT,
    expires_at INTEGER,
    token_type TEXT,
    scope TEXT,
    id_token TEXT,
    session_state TEXT,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create unique constraint and indexes for accounts
ALTER TABLE accounts ADD CONSTRAINT accounts_provider_provider_account_id_key UNIQUE (provider, provider_account_id);
CREATE INDEX idx_accounts_user_id ON accounts(user_id);

-- Sessions table (NextAuth)
CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    session_token TEXT UNIQUE NOT NULL,
    user_id TEXT NOT NULL,
    expires TIMESTAMP WITH TIME ZONE NOT NULL,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for sessions
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires ON sessions(expires);

-- Verification tokens table (NextAuth)
CREATE TABLE verificationtokens (
    identifier TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create unique constraint and index for verification tokens
ALTER TABLE verificationtokens ADD CONSTRAINT verificationtokens_identifier_token_key UNIQUE (identifier, token);
CREATE INDEX idx_verificationtokens_expires ON verificationtokens(expires);

-- Game stats table
CREATE TABLE game_stats (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    game_type TEXT NOT NULL,
    xp INTEGER DEFAULT 0 NOT NULL,
    level INTEGER DEFAULT 1 NOT NULL,
    wins INTEGER DEFAULT 0 NOT NULL,
    losses INTEGER DEFAULT 0 NOT NULL,
    draws INTEGER DEFAULT 0 NOT NULL,
    stats JSONB DEFAULT '{}' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create unique constraint and indexes for game stats
ALTER TABLE game_stats ADD CONSTRAINT game_stats_user_id_game_type_key UNIQUE (user_id, game_type);
CREATE INDEX idx_game_stats_user_id ON game_stats(user_id);
CREATE INDEX idx_game_stats_game_type ON game_stats(game_type);
CREATE INDEX idx_game_stats_game_type_level ON game_stats(game_type, level);
CREATE INDEX idx_game_stats_game_type_wins ON game_stats(game_type, wins);
CREATE INDEX idx_game_stats_game_type_xp ON game_stats(game_type, xp);

-- Achievements table
CREATE TABLE achievements (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    xp_reward INTEGER NOT NULL,
    game_type TEXT,
    conditions JSONB DEFAULT '{}' NOT NULL
);

-- Create indexes for achievements
CREATE INDEX idx_achievements_game_type ON achievements(game_type);
CREATE INDEX idx_achievements_xp_reward ON achievements(xp_reward);

-- User achievements table
CREATE TABLE user_achievements (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    achievement_id TEXT NOT NULL,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE
);

-- Create unique constraint and indexes for user achievements
ALTER TABLE user_achievements ADD CONSTRAINT user_achievements_user_id_achievement_id_key UNIQUE (user_id, achievement_id);
CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_achievement_id ON user_achievements(achievement_id);
CREATE INDEX idx_user_achievements_unlocked_at ON user_achievements(unlocked_at);

-- Game rooms table
CREATE TABLE game_rooms (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    game_type TEXT NOT NULL,
    status TEXT DEFAULT 'waiting' NOT NULL,
    max_players INTEGER DEFAULT 2 NOT NULL,
    is_public BOOLEAN DEFAULT true NOT NULL,
    settings JSONB DEFAULT '{}' NOT NULL,
    game_data JSONB DEFAULT '{}' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    host_id TEXT NOT NULL,
    
    FOREIGN KEY (host_id) REFERENCES users(id)
);

-- Create indexes for game rooms
CREATE INDEX idx_game_rooms_game_type ON game_rooms(game_type);
CREATE INDEX idx_game_rooms_status ON game_rooms(status);
CREATE INDEX idx_game_rooms_game_type_status ON game_rooms(game_type, status);
CREATE INDEX idx_game_rooms_game_type_status_public ON game_rooms(game_type, status, is_public);
CREATE INDEX idx_game_rooms_host_id ON game_rooms(host_id);
CREATE INDEX idx_game_rooms_created_at ON game_rooms(created_at);
CREATE INDEX idx_game_rooms_updated_at ON game_rooms(updated_at);

-- Players in rooms table
CREATE TABLE players_in_rooms (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    room_id TEXT NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    is_ready BOOLEAN DEFAULT false NOT NULL,
    position INTEGER,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES game_rooms(id) ON DELETE CASCADE
);

-- Create unique constraint and indexes for players in rooms
ALTER TABLE players_in_rooms ADD CONSTRAINT players_in_rooms_user_id_room_id_key UNIQUE (user_id, room_id);
CREATE INDEX idx_players_in_rooms_user_id ON players_in_rooms(user_id);
CREATE INDEX idx_players_in_rooms_room_id ON players_in_rooms(room_id);
CREATE INDEX idx_players_in_rooms_joined_at ON players_in_rooms(joined_at);
CREATE INDEX idx_players_in_rooms_is_ready ON players_in_rooms(is_ready);

-- Chat messages table
CREATE TABLE chat_messages (
    id TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    user_id TEXT NOT NULL,
    room_id TEXT,
    type TEXT DEFAULT 'room' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES game_rooms(id) ON DELETE CASCADE
);

-- Create indexes for chat messages
CREATE INDEX idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX idx_chat_messages_room_id ON chat_messages(room_id);
CREATE INDEX idx_chat_messages_type ON chat_messages(type);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX idx_chat_messages_room_id_created_at ON chat_messages(room_id, created_at);
CREATE INDEX idx_chat_messages_type_created_at ON chat_messages(type, created_at);

-- +migrate Down

-- Drop tables in reverse order (respecting foreign key constraints)
DROP TABLE IF EXISTS chat_messages;
DROP TABLE IF EXISTS players_in_rooms;
DROP TABLE IF EXISTS game_rooms;
DROP TABLE IF EXISTS user_achievements;
DROP TABLE IF EXISTS achievements;
DROP TABLE IF EXISTS game_stats;
DROP TABLE IF EXISTS verificationtokens;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS accounts;
DROP TABLE IF EXISTS users;

-- Drop enum types
DROP TYPE IF EXISTS user_account_type;