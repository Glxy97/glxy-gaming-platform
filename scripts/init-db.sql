
-- ===================================================
-- GLXY Gaming Platform - Database Initialization
-- Initial database setup for PostgreSQL
-- ===================================================

-- Create database if it doesn't exist (handled by Docker)
-- CREATE DATABASE glxy_gaming;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";

-- Performance optimizations
SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

-- Create schema
CREATE SCHEMA IF NOT EXISTS public;

-- Grant permissions
GRANT ALL ON SCHEMA public TO PUBLIC;
GRANT ALL ON SCHEMA public TO glxy_user;

-- Comments
COMMENT ON DATABASE glxy_gaming IS 'GLXY Gaming Platform - Main Database';
COMMENT ON SCHEMA public IS 'Default public schema for GLXY Gaming Platform';

-- Success message
SELECT 'GLXY Gaming Platform database initialized successfully!' AS message;
