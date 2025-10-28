# 🎮 GLXY Gaming Platform

**Modern multiplayer gaming platform** mit Next.js 15, React 19, TypeScript und PostgreSQL.

[![Next.js](https://img.shields.io/badge/Next.js-15.5.3-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0.0-blue)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6.3-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

---

## 🚀 Features

- 🎮 **8 Multiplayer Games**: Chess, Tetris, Connect4, TicTacToe, FPS, Racing, UNO
- 🔐 **Secure Authentication**: NextAuth.js mit OAuth (Google, GitHub) + MFA
- 🌐 **Real-time Multiplayer**: Socket.IO mit Redis Clustering
- 🎨 **Modern UI**: Tailwind CSS + Radix UI + Framer Motion
- 📊 **Leaderboards & Stats**: User Rankings & Performance Tracking
- 🛡️ **Enterprise Security**: Rate Limiting, CSRF Protection, Encryption

---

## 📁 Project Structure

```
glxy-gaming/
├── 📱 app/              # Next.js 15 App Router
├── 🧩 components/       # React Components
├── 📚 lib/              # Core Libraries
├── 🗄️  prisma/          # Database
├── 📖 docs/             # Documentation (organized!)
├── 🧪 tests/            # All Tests
└── 📊 logs/             # Logs
```

**Siehe**: [docs/README.md](./docs/README.md) für Dokumentations-Übersicht

---

## 🛠️ Quick Start

### Development Setup

```bash
# 1. Clone Repository
git clone https://github.com/Glxy97/glxy_website.git
cd glxy_website

# 2. Install Dependencies
npm install

# 3. Setup Environment
cp .env.example .env.local
# Fülle .env.local mit deinen Credentials aus

# 4. Setup Database
npm run db:migrate
npm run db:seed

# 5. Start Development Server
npm run dev
```

**Server läuft auf**: http://localhost:3000

### Production Deployment

```bash
# Siehe docs/deployment/DEPLOY_TO_PRODUCTION.md
```

---

## 📚 Documentation

Alle Dokumentationen sind professionell in `docs/` organisiert:

```
docs/
├── CLAUDE.md                  # 📖 Haupt-Dokumentation
├── GAME_IMPLEMENTATION_STATUS.md  # 🎮 Game Features
├── security/                  # 🔒 Security Docs (SENSIBEL)
├── deployment/                # 🚀 Deployment Guides (SENSIBEL)
├── internal/                  # 🔧 Internal Docs (INTERN)
└── guides/                    # 📖 User Guides
```

**Quick Links**:
- [📖 Projekt-Übersicht](./docs/CLAUDE.md)
- [🎮 Game Status](./docs/GAME_IMPLEMENTATION_STATUS.md)
- [📚 Docs Overview](./docs/README.md)

---

## 🎮 Available Games

| Game | Status | Multiplayer | AI |
|------|--------|-------------|-----|
| ♟️ Chess | ✅ | ✅ | ✅ |
| 🟦 Tetris | ✅ | ✅ | ❌ |
| 🔴 Connect4 | ✅ | ✅ | ✅ |
| ⭕ TicTacToe | ✅ | ✅ | ✅ |
| 🔫 FPS | 🚧 | ✅ | ❌ |
| 🏎️ Racing | 🚧 | ✅ | ❌ |
| 🎴 UNO | 🚧 | ✅ | ❌ |

---

## 🔧 Tech Stack

### Core
- **Framework**: Next.js 15.5.3 (App Router, Server Components)
- **UI**: React 19.0.0
- **Language**: TypeScript 5.6.3

### Backend
- **Database**: PostgreSQL + Prisma ORM 6.16.2
- **Cache**: Redis (ioredis 5.4.1)
- **Real-time**: Socket.IO 4.8.0

### Auth & Security
- **Authentication**: NextAuth.js 5.0.0-beta.25
- **MFA**: TOTP (otplib)
- **Encryption**: bcryptjs + AES
- **Rate Limiting**: Redis-based

### UI & Styling
- **CSS**: Tailwind CSS 3.4.17
- **Components**: Radix UI
- **Animations**: Framer Motion 11.11.17
- **Icons**: Lucide React 0.453.0

---

## 🧪 Testing

```bash
npm run test           # Unit Tests
npm run test:watch     # Watch Mode
npm run test:coverage  # Coverage Report
npm run e2e            # E2E Tests (Playwright)
```

---

## 🚀 Available Scripts

```bash
npm run dev            # Development Server
npm run build          # Production Build
npm run start          # Start Production
npm run lint           # ESLint
npm run typecheck      # TypeScript Check
npm run db:migrate     # Database Migration
npm run db:seed        # Seed Database
```

---

## 🔒 Security

- ✅ NextAuth.js mit OAuth (Google, GitHub)
- ✅ Multi-Factor Authentication (TOTP)
- ✅ Rate Limiting (Redis-based)
- ✅ CSRF Protection
- ✅ Content Security Policy (CSP)
- ✅ bcrypt Password Hashing
- ✅ AES Encryption

---

## 📊 Performance

- ⚡ Server Components (React 19)
- ⚡ Redis Caching
- ⚡ Database Query Optimization
- ⚡ Image Optimization (Next.js)
- ⚡ Code Splitting
- ⚡ CDN Ready

---

## 🌐 Deployment

### Docker Deployment

```bash
docker-compose up -d
```

### Manual Deployment

```bash
npm run build
npm run start
```

---

## 📝 License

This project is licensed under the MIT License - see [LICENSE](./LICENSE) file for details.

---

## 👥 Team

- **Lead Developer**: [Glxy97](https://github.com/Glxy97)

---

## 📞 Support

- **Documentation**: [docs/](./docs/)
- **Issues**: [GitHub Issues](https://github.com/Glxy97/glxy_website/issues)
- **Email**: gusgleixi@gmail.com

---

**Made with ❤️ by the GLXY Team**

**Version**: 2.1
**Last Updated**: 04.10.2025
