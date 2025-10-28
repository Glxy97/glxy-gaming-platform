#!/bin/bash

# GLXY Gaming Platform - Production OAuth Validation Script
# Prüft ob alle OAuth-Credentials für Production korrekt konfiguriert sind

set -e

echo "🔍 GLXY Production OAuth Validation"
echo "===================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Load .env.production
if [ ! -f .env.production ]; then
    echo -e "${RED}❌ .env.production nicht gefunden!${NC}"
    exit 1
fi

source .env.production

echo "📋 Environment Checks"
echo "--------------------"

# Check NEXTAUTH_URL
if [ "$NEXTAUTH_URL" == "https://glxy.at" ]; then
    echo -e "${GREEN}✅ NEXTAUTH_URL: $NEXTAUTH_URL${NC}"
else
    echo -e "${YELLOW}⚠️  NEXTAUTH_URL: $NEXTAUTH_URL (erwartet: https://glxy.at)${NC}"
    ((WARNINGS++))
fi

# Check NEXT_PUBLIC_APP_URL
if [ "$NEXT_PUBLIC_APP_URL" == "https://glxy.at" ]; then
    echo -e "${GREEN}✅ NEXT_PUBLIC_APP_URL: $NEXT_PUBLIC_APP_URL${NC}"
else
    echo -e "${YELLOW}⚠️  NEXT_PUBLIC_APP_URL: $NEXT_PUBLIC_APP_URL (erwartet: https://glxy.at)${NC}"
    ((WARNINGS++))
fi

echo ""
echo "🔐 OAuth Credentials"
echo "--------------------"

# Check Google OAuth
if [ "$GOOGLE_CLIENT_ID" == "YOUR_PRODUCTION_GOOGLE_CLIENT_ID" ] || [ -z "$GOOGLE_CLIENT_ID" ]; then
    echo -e "${RED}❌ GOOGLE_CLIENT_ID nicht konfiguriert!${NC}"
    echo "   → Erstelle OAuth App: https://console.cloud.google.com/"
    echo "   → Callback URL: https://glxy.at/api/auth/callback/google"
    ((ERRORS++))
else
    echo -e "${GREEN}✅ GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID:0:20}...${NC}"
fi

if [ "$GOOGLE_CLIENT_SECRET" == "YOUR_PRODUCTION_GOOGLE_CLIENT_SECRET" ] || [ -z "$GOOGLE_CLIENT_SECRET" ]; then
    echo -e "${RED}❌ GOOGLE_CLIENT_SECRET nicht konfiguriert!${NC}"
    ((ERRORS++))
else
    echo -e "${GREEN}✅ GOOGLE_CLIENT_SECRET: ${GOOGLE_CLIENT_SECRET:0:10}...${NC}"
fi

# Check GitHub OAuth
if [ "$GITHUB_CLIENT_ID" == "YOUR_PRODUCTION_GITHUB_CLIENT_ID" ] || [ -z "$GITHUB_CLIENT_ID" ]; then
    echo -e "${RED}❌ GITHUB_CLIENT_ID nicht konfiguriert!${NC}"
    echo "   → Erstelle OAuth App: https://github.com/settings/developers"
    echo "   → Callback URL: https://glxy.at/api/auth/callback/github"
    ((ERRORS++))
else
    echo -e "${GREEN}✅ GITHUB_CLIENT_ID: $GITHUB_CLIENT_ID${NC}"
fi

if [ "$GITHUB_CLIENT_SECRET" == "YOUR_PRODUCTION_GITHUB_CLIENT_SECRET" ] || [ -z "$GITHUB_CLIENT_SECRET" ]; then
    echo -e "${RED}❌ GITHUB_CLIENT_SECRET nicht konfiguriert!${NC}"
    ((ERRORS++))
else
    echo -e "${GREEN}✅ GITHUB_CLIENT_SECRET: ${GITHUB_CLIENT_SECRET:0:10}...${NC}"
fi

echo ""
echo "🔒 Security Secrets"
echo "-------------------"

# Check NEXTAUTH_SECRET
if [ "$NEXTAUTH_SECRET" == "CHANGE_THIS_IN_PRODUCTION_USE_OPENSSL_RAND" ] || [ -z "$NEXTAUTH_SECRET" ]; then
    echo -e "${RED}❌ NEXTAUTH_SECRET nicht gesetzt!${NC}"
    echo "   → Generiere mit: openssl rand -base64 32"
    ((ERRORS++))
elif [ ${#NEXTAUTH_SECRET} -lt 32 ]; then
    echo -e "${YELLOW}⚠️  NEXTAUTH_SECRET zu kurz (${#NEXTAUTH_SECRET} Zeichen, min. 32)${NC}"
    ((WARNINGS++))
else
    echo -e "${GREEN}✅ NEXTAUTH_SECRET: ${NEXTAUTH_SECRET:0:10}... (${#NEXTAUTH_SECRET} Zeichen)${NC}"
fi

# Check JWT_SECRET
if [ "$JWT_SECRET" == "CHANGE_THIS_IN_PRODUCTION_USE_OPENSSL_RAND" ] || [ -z "$JWT_SECRET" ]; then
    echo -e "${RED}❌ JWT_SECRET nicht gesetzt!${NC}"
    echo "   → Generiere mit: openssl rand -base64 32"
    ((ERRORS++))
elif [ ${#JWT_SECRET} -lt 32 ]; then
    echo -e "${YELLOW}⚠️  JWT_SECRET zu kurz (${#JWT_SECRET} Zeichen, min. 32)${NC}"
    ((WARNINGS++))
else
    echo -e "${GREEN}✅ JWT_SECRET: ${JWT_SECRET:0:10}... (${#JWT_SECRET} Zeichen)${NC}"
fi

# Check SOCKET_IO_SECRET
if [ "$SOCKET_IO_SECRET" == "CHANGE_THIS_IN_PRODUCTION_USE_OPENSSL_RAND" ] || [ -z "$SOCKET_IO_SECRET" ]; then
    echo -e "${RED}❌ SOCKET_IO_SECRET nicht gesetzt!${NC}"
    echo "   → Generiere mit: openssl rand -base64 32"
    ((ERRORS++))
elif [ ${#SOCKET_IO_SECRET} -lt 32 ]; then
    echo -e "${YELLOW}⚠️  SOCKET_IO_SECRET zu kurz (${#SOCKET_IO_SECRET} Zeichen, min. 32)${NC}"
    ((WARNINGS++))
else
    echo -e "${GREEN}✅ SOCKET_IO_SECRET: ${SOCKET_IO_SECRET:0:10}... (${#SOCKET_IO_SECRET} Zeichen)${NC}"
fi

echo ""
echo "📊 Summary"
echo "----------"

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ Alle Checks bestanden! Production ist bereit.${NC}"
    echo ""
    echo "Nächste Schritte:"
    echo "1. docker-compose down"
    echo "2. docker-compose build --no-cache"
    echo "3. docker-compose up -d"
    echo "4. docker-compose exec app npx prisma migrate deploy"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  $WARNINGS Warnung(en) gefunden. Deployment möglich aber nicht optimal.${NC}"
    exit 0
else
    echo -e "${RED}❌ $ERRORS Fehler gefunden! Production ist NICHT bereit.${NC}"
    echo ""
    echo "Bitte behebe die Fehler vor dem Deployment."
    echo "Siehe OAUTH_Funkt.md für detaillierte Anleitung."
    exit 1
fi
