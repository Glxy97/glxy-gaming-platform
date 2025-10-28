#!/bin/bash

# GLXY Gaming Platform - Docker Secrets Setup Script
# This script creates Docker secrets for secure credential management

set -euo pipefail

echo "🔐 Setting up Docker Secrets for GLXY Gaming Platform..."

# Function to generate secure random passwords
generate_password() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-25
}

# Function to create Docker secret
create_secret() {
    local secret_name="$1"
    local secret_value="$2"

    if docker secret ls --format "table {{.Name}}" | grep -q "^${secret_name}$"; then
        echo "⚠️  Secret '${secret_name}' already exists, skipping..."
    else
        echo "${secret_value}" | docker secret create "${secret_name}" -
        echo "✅ Created secret: ${secret_name}"
    fi
}

# Initialize Docker Swarm if not already initialized
if ! docker info --format '{{.Swarm.LocalNodeState}}' | grep -q "active"; then
    echo "🐳 Initializing Docker Swarm..."
    docker swarm init
fi

echo "🔐 Creating database secrets..."
create_secret "db_user" "glxy_admin"
create_secret "db_password" "$(generate_password)"
create_secret "db_name" "glxy_gaming"

echo "🔐 Creating Redis secrets..."
create_secret "redis_password" "$(generate_password)"

echo "🔐 Creating application secrets..."
create_secret "nextauth_secret" "$(generate_password)"
create_secret "jwt_secret" "$(generate_password)"
create_secret "socket_secret" "$(generate_password)"

echo "🔐 Creating encryption secrets..."
create_secret "api_encryption_key" "$(generate_password)"
create_secret "session_encryption_key" "$(generate_password)"
create_secret "csrf_secret" "$(generate_password)"
create_secret "cookie_secret" "$(generate_password)"

echo "🔐 Creating OAuth secrets (placeholder - MUST BE UPDATED)..."
create_secret "google_client_id" "YOUR_GOOGLE_CLIENT_ID_HERE"
create_secret "google_client_secret" "YOUR_GOOGLE_CLIENT_SECRET_HERE"
create_secret "github_client_id" "YOUR_GITHUB_CLIENT_ID_HERE"
create_secret "github_client_secret" "YOUR_GITHUB_CLIENT_SECRET_HERE"

echo "🔐 Creating SMTP secrets (placeholder - MUST BE UPDATED)..."
create_secret "smtp_host" "smtp-relay.brevo.com"
create_secret "smtp_user" "YOUR_SMTP_USER_HERE"
create_secret "smtp_password" "YOUR_SMTP_PASSWORD_HERE"

echo "🔐 Creating Sentry secrets (placeholder - MUST BE UPDATED)..."
create_secret "sentry_dsn" "YOUR_SENTRY_DSN_HERE"
create_secret "sentry_auth_token" "YOUR_SENTRY_AUTH_TOKEN_HERE"

echo "🔐 Creating dev auth secrets..."
create_secret "dev_auth_user" "glxy"
create_secret "dev_auth_pass" "$(generate_password)"

# Generate database URL with new password
DB_PASSWORD=$(docker secret inspect db_password --format '{{.Spec.Data}}' | base64 -d)
create_secret "database_url" "postgresql://glxy_admin:${DB_PASSWORD}@db:5432/glxy_gaming"

# Generate Redis URL with new password
REDIS_PASSWORD=$(docker secret inspect redis_password --format '{{.Spec.Data}}' | base64 -d)
create_secret "redis_url" "redis://default:${REDIS_PASSWORD}@redis:6379"

echo ""
echo "✅ Docker secrets setup completed!"
echo ""
echo "📋 IMPORTANT NEXT STEPS:"
echo "1. Update OAuth credentials:"
echo "   docker secret rm google_client_secret && echo 'REAL_SECRET' | docker secret create google_client_secret -"
echo "   docker secret rm github_client_secret && echo 'REAL_SECRET' | docker secret create github_client_secret -"
echo ""
echo "2. Update SMTP credentials:"
echo "   docker secret rm smtp_password && echo 'REAL_PASSWORD' | docker secret create smtp_password -"
echo ""
echo "3. Update Sentry credentials:"
echo "   docker secret rm sentry_dsn && echo 'REAL_DSN' | docker secret create sentry_dsn -"
echo ""
echo "4. Use docker-compose.secrets.yml instead of docker-compose.yml:"
echo "   docker-compose -f docker-compose.secrets.yml up -d"
echo ""
echo "🔍 To view created secrets (names only):"
echo "   docker secret ls"
echo ""
echo "⚠️  Remember: Never commit real credentials to git!"