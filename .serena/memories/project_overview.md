# GLXY Gaming Platform - Project Overview

## Purpose
Modern multiplayer gaming platform with 8+ games built on Next.js 15, React 19, TypeScript and PostgreSQL. Features real-time multiplayer, secure authentication, leaderboards, and enterprise-grade security.

## Tech Stack
- **Framework**: Next.js 15.5.3 (App Router, Server Components)
- **UI**: React 19.0.0
- **Language**: TypeScript 5.6.3 (strict mode enabled)
- **Database**: PostgreSQL with Prisma ORM 6.16.2
- **Cache**: Redis (ioredis 5.4.1) for sessions, caching, real-time gaming
- **Real-time**: Socket.IO 4.8.0 with Redis clustering
- **Auth**: NextAuth.js 5.0.0-beta.25 with OAuth + MFA (TOTP)
- **UI Framework**: Tailwind CSS 3.4.17 + Radix UI + Framer Motion 11.11.17
- **Security**: bcryptjs, AES encryption, rate limiting, CSRF protection

## Code Style & Conventions
- **TypeScript**: Strict mode enabled, noImplicitAny: false, path aliases @/*
- **Naming**: camelCase for variables/functions, PascalCase for components/types
- **File Structure**: Next.js App Router with feature-based organization
- **Components**: Radix UI pattern with Tailwind styling
- **Database**: Prisma schema with typed models
- **Testing**: Vitest for unit tests, Playwright for E2E
- **Git**: Feature branches, conventional commits

## Project Structure
```
glxy-gaming-platform/
├── app/                    # Next.js 15 App Router pages
├── components/             # React components
├── contexts/              # React contexts
├── lib/                   # Core libraries and utilities
├── prisma/                # Database schema and migrations
├── services/              # Backend services
├── hooks/                 # Custom React hooks
├── types/                 # TypeScript type definitions
├── tests/                 # All tests (unit, integration)
├── e2e/                   # Playwright E2E tests
├── docs/                  # Documentation
├── scripts/               # Utility scripts
├── monitoring/            # Monitoring and logging
└── security-audit-reports/ # Security reports
```

## Available Games
- ✅ Chess (Multiplayer + AI)
- ✅ Tetris (Multiplayer)
- ✅ Connect4 (Multiplayer + AI) 
- ✅ TicTacToe (Multiplayer + AI)
- 🚧 FPS (Multiplayer, 3D with Three.js)
- 🚧 Racing (Multiplayer)
- 🚧 UNO (Multiplayer)

## Key Features
- Real-time multiplayer gaming with Socket.IO
- Secure authentication with MFA
- Leaderboards and performance tracking
- Enterprise security (rate limiting, CSRF, CSP)
- PDF editing capabilities (Web Adobe integration)
- Admin panel and user management
- Responsive design with modern UI

## Development Environment
- **OS**: Windows 11
- **Node.js**: Current LTS
- **Database**: PostgreSQL (local development)
- **Cache**: Redis (local development)
- **Deployment**: Docker with docker-compose

## Documentation
Comprehensive documentation in `docs/` folder including:
- CLAUDE.md (main documentation)
- GAME_IMPLEMENTATION_STATUS.md
- Security documentation
- Deployment guides
- API documentation