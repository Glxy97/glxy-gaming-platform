# ============================================
# = GLXY Gaming Platform - Optimized Docker Image
# ============================================
# Multi-stage build für minimale Image-Größe

# === Stage 1: Dependencies ===
FROM node:20-alpine AS deps
RUN apk add --no-cache \
    libc6-compat \
    openssl \
    python3 \
    make \
    g++ \
    cairo-dev \
    pango-dev \
    jpeg-dev \
    giflib-dev \
    librsvg-dev \
    pixman-dev
WORKDIR /app

# Kopiere nur package files für besseres Caching
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Installiere Dependencies mit Cache-Mount
RUN --mount=type=cache,target=/root/.npm \
    npm ci --legacy-peer-deps

# === Stage 2: Builder ===
FROM node:20-alpine AS builder
RUN apk add --no-cache \
    libc6-compat \
    openssl \
    cairo \
    pango \
    jpeg \
    giflib \
    librsvg \
    pixman
WORKDIR /app

# Kopiere Dependencies von vorheriger Stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Setze Build-Zeit Environment Variables
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
ENV NEXT_TELEMETRY_DISABLED=1
ENV SKIP_ENV_VALIDATION=1
# Dummy DATABASE_URL für Build (wird zur Runtime überschrieben)
ENV DATABASE_URL="postgresql://user:pass@localhost:5432/db"

# Generiere Prisma Client
RUN npx prisma generate

# Build Next.js mit erhöhtem Memory Limit
RUN --mount=type=cache,target=/app/.next/cache \
    NODE_OPTIONS="--max-old-space-size=4096" \
    npm run build

# === Stage 3: Production Runner ===
FROM node:20-alpine AS production
RUN apk add --no-cache \
    libc6-compat \
    openssl \
    curl \
    cairo \
    pango \
    jpeg \
    giflib \
    librsvg \
    pixman

# Security: Erstelle non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

WORKDIR /app

# Kopiere nur benötigte Files für Production
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
# Kopiere Prisma Client und Binary
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
# Kopiere Canvas Native Addons
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/canvas ./node_modules/canvas
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@napi-rs ./node_modules/@napi-rs

# Kopiere Start-Script
COPY --chown=nextjs:nodejs docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Environment Variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3001
ENV HOSTNAME="0.0.0.0"

# Optimierungen
ENV NODE_OPTIONS="--max-old-space-size=2048 --enable-source-maps"

# Wechsel zu non-root user
USER nextjs

# Health Check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3001/api/health || exit 1

# Ports
EXPOSE 3001

# Start command
ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["node", "server.js"]