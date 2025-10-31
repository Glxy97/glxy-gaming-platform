# Project Architecture - GLXY Gaming Platform

## High-Level Architecture

### System Overview
GLXY Gaming Platform is a modern full-stack web application using the Next.js 15 App Router with React 19, TypeScript, and real-time multiplayer capabilities via Socket.IO.

### Technology Stack Layers

#### Frontend Layer
- **Framework**: Next.js 15.5.3 (App Router)
- **UI Library**: React 19.0.0 with Server Components
- **Styling**: Tailwind CSS 3.4.17 + Radix UI components
- **Animations**: Framer Motion 11.11.17
- **State Management**: Zustand 5.0.8 + React Context
- **Real-time Client**: Socket.IO Client 4.8.0

#### Backend Layer
- **Server**: Custom Express.js server with Next.js integration
- **API**: Next.js API routes (App Router)
- **Real-time Server**: Socket.IO Server 4.8.0 with Redis adapter
- **Authentication**: NextAuth.js 5.0.0-beta.25
- **Data Validation**: Zod 3.23.8

#### Data Layer
- **Database**: PostgreSQL with Prisma ORM 6.16.2
- **Caching**: Redis (ioredis 5.4.1) for sessions and game state
- **File Storage**: Local storage (development), Cloud storage (production)

#### Security Layer
- **Authentication**: OAuth + Credentials with MFA
- **Authorization**: Role-based access control
- **Rate Limiting**: Redis-based implementation
- **Encryption**: bcryptjs + AES encryption
- **Security Headers**: CSP, CSRF protection

## Directory Structure Deep Dive

### Frontend Architecture (`app/`)
```
app/
├── (auth)/                  # Authentication routes group
│   ├── signin/             # Login page
│   ├── signup/             # Registration page
│   └── layout.tsx          # Auth layout
├── games/                  # Game-specific pages
│   ├── chess/              # Chess game implementation
│   ├── fps/                # First-person shooter
│   ├── tetris/             # Tetris game
│   ├── connect4/           # Connect Four game
│   ├── tictactoe/          # Tic-Tac-Toe game
│   ├── racing/             # Racing game
│   └── uno/                # UNO card game
├── api/                    # API routes
│   ├── auth/               # Authentication endpoints
│   ├── games/              # Game management APIs
│   ├── users/              # User management
│   └── webhooks/           # External service webhooks
├── dashboard/              # User dashboard
├── leaderboards/           # Global leaderboards
├── profile/                # User profile management
├── web-adobe/              # PDF editing features
└── layout.tsx              # Root layout
```

### Component Architecture (`components/`)
```
components/
├── ui/                     # Reusable UI components (Radix-based)
│   ├── button.tsx
│   ├── input.tsx
│   ├── dialog.tsx
│   └── ...
├── games/                  # Game-specific components
│   ├── chess/              # Chess board, pieces, logic
│   ├── fps/                # 3D FPS components (Three.js)
│   ├── tetris/             # Tetris game board
│   └── shared/             # Shared game components
├── forms/                  # Form components with validation
├── layout/                 # Layout components
├── providers/              # React context providers
└── features/               # Business logic components
```

### Service Architecture (`services/`)
```
services/
├── auth.service.ts         # Authentication business logic
├── game.service.ts         # Game state management
├── socket.service.ts       # Socket.IO real-time logic
├── pdf.service.ts          # PDF processing services
├── notification.service.ts # User notifications
└── analytics.service.ts    # Usage tracking
```

### Database Architecture (`prisma/`)
```
prisma/
├── schema.prisma           # Database schema definition
├── migrations/             # Database migration files
└── seed.ts                 # Database seeding script
```

## Core Architectural Patterns

### 1. Server Components Architecture
- **Static Content**: Server Components for initial page loads
- **Interactive Elements**: Client Components for user interactions
- **Data Fetching**: Server Components handle data fetching at request time
- **Progressive Enhancement**: Works without JavaScript, enhanced with it

### 2. Real-time Multiplayer Architecture
```
Client (React) ↔ Socket.IO Client ↔ Socket.IO Server ↔ Redis ↔ Database
     ↓                                    ↓
Game State UI               Game State Manager
```

#### Socket.IO Event Patterns
- **Game Events**: `game:join`, `game:move`, `game:state-update`
- **Room Management**: `room:create`, `room:join`, `room:leave`
- **User Presence**: `user:online`, `user:offline`, `user:typing`

### 3. Authentication Flow
```
User → NextAuth.js → Database (Users) → Session (Redis) → Client (Cookie)
```

#### Session Management
- **Sessions**: Stored in Redis for scalability
- **Tokens**: JWT with short expiration + refresh tokens
- **MFA**: TOTP-based two-factor authentication
- **OAuth**: Google and GitHub integration

### 4. Game State Management
```
Game Service (Business Logic)
    ↓
Redis Cache (Real-time State)
    ↓
Database (Persistent State)
    ↓
Socket.IO (Real-time Updates)
    ↓
Client (UI Updates)
```

#### State Synchronization
- **Optimistic Updates**: Client updates immediately, confirmed by server
- **Conflict Resolution**: Server authoritative, client rolls back on conflict
- **Reconnection**: Automatic reconnection with state recovery

## Data Models Architecture

### Core Entities
```typescript
// User Management
User {
  id: string
  email: string
  username: string
  profile: UserProfile
  stats: UserStats
}

// Game Management
Game {
  id: string
  type: GameType
  state: GameState
  players: GamePlayer[]
  settings: GameSettings
}

// Real-time Sessions
GameSession {
  id: string
  game: Game
  players: SessionPlayer[]
  state: LiveGameState
  events: GameEvent[]
}
```

### Relationship Patterns
- **User ↔ Game**: Many-to-many through GamePlayer
- **Game ↔ Session**: One-to-many for multiple game instances
- **User ↔ Stats**: One-to-one for performance tracking

## Security Architecture

### Authentication Layers
1. **NextAuth.js**: Primary authentication handler
2. **Session Management**: Redis-based session storage
3. **MFA Layer**: TOTP verification for sensitive actions
4. **Rate Limiting**: Request throttling per user/IP
5. **CSRF Protection**: Token-based CSRF validation

### Data Protection
- **Encryption**: AES-256 for sensitive data at rest
- **Hashing**: bcryptjs for password storage
- **Validation**: Zod schemas for all input validation
- **Sanitization**: DOMPurify for user-generated content

## Performance Architecture

### Caching Strategy
```
Browser Cache → CDN Cache → Server Cache (Redis) → Database
```

#### Caching Layers
- **Browser Cache**: Static assets with Cache-Control headers
- **Server Cache**: Redis for frequently accessed data
- **Database Cache**: PostgreSQL query result caching
- **API Cache**: Response caching for expensive operations

### Optimization Techniques
- **Code Splitting**: Dynamic imports for large components
- **Image Optimization**: Next.js Image component with WebP
- **Bundle Optimization**: Tree shaking and dead code elimination
- **Database Optimization**: Proper indexing and query optimization

## Scalability Architecture

### Horizontal Scaling
- **Stateless Servers**: Application servers don't store state
- **Load Balancing**: Multiple server instances behind load balancer
- **Database Replication**: Read replicas for scaling read operations
- **Redis Clustering**: Distributed cache for horizontal scaling

### Microservices Readiness
- **Service Separation**: Clear boundaries between game services
- **API Gateway**: Centralized routing and authentication
- **Event-Driven**: Socket.IO events for loose coupling
- **Database per Service**: Separate databases per service domain

## Monitoring & Observability

### Logging Strategy
- **Application Logs**: Structured logging with correlation IDs
- **Error Tracking**: Sentry integration for error monitoring
- **Performance Metrics**: Custom metrics for game performance
- **Security Events**: Authentication and authorization logging

### Health Checks
- **Application Health**: `/api/health` endpoint
- **Database Health**: Connection and query performance
- **Cache Health**: Redis connectivity and performance
- **Socket.IO Health**: Real-time connection monitoring

## Deployment Architecture

### Container Strategy
```dockerfile
# Multi-stage build
Stage 1: Dependencies (Node.js modules)
Stage 2: Build (Next.js compilation)
Stage 3: Runtime (Minimal production image)
```

### Orchestration
- **Development**: Docker Compose for local development
- **Production**: Kubernetes or Docker Swarm for orchestration
- **CI/CD**: GitHub Actions for automated deployment
- **Rolling Updates**: Zero-downtime deployment strategy

## Development Workflow Integration

### Code Architecture Principles
1. **Feature-based Organization**: Code organized by business features
2. **Separation of Concerns**: Clear boundaries between UI, logic, and data
3. **Dependency Injection**: Services injected rather than hard-coded
4. **Error Boundaries**: React error boundaries for graceful degradation

### Testing Architecture
- **Unit Tests**: Vitest for business logic testing
- **Integration Tests**: API endpoint testing
- **E2E Tests**: Playwright for full user journey testing
- **Performance Tests**: Load testing for multiplayer scenarios

This architecture supports the platform's requirements for real-time multiplayer gaming, user management, security, and scalability while maintaining code quality and developer experience.