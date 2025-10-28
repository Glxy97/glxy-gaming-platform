# GLXY Gaming Platform - API Documentation

## 🚀 Quick Start

### Accessing the Documentation

- **Interactive Swagger UI**: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)
- **OpenAPI JSON Specification**: [http://localhost:3000/api/docs](http://localhost:3000/api/docs)

### Authentication

The API supports two authentication methods:

#### 1. Session-Based Authentication (Primary)
```javascript
// Authenticate via NextAuth session
// Automatically handled by Next.js middleware
```

#### 2. Bearer Token Authentication
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3000/api/games/tetris
```

## 📚 API Endpoints Overview

### Authentication & Users

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/auth/me` | Get current user session | ✅ |
| `POST` | `/api/auth/signin` | Sign in with credentials | ❌ |
| `POST` | `/api/auth/signout` | Sign out current user | ✅ |
| `POST` | `/api/auth/signup` | Create new user account | ❌ |

### Games

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/games/tetris` | Get Tetris leaderboard | Optional |
| `POST` | `/api/games/tetris` | Submit Tetris score | ✅ |
| `GET` | `/api/games/connect4` | Get Connect4 stats | Optional |
| `POST` | `/api/games/connect4` | Submit Connect4 result | ✅ |
| `GET` | `/api/games/tictactoe` | Get TicTacToe stats | Optional |
| `POST` | `/api/games/tictactoe` | Submit TicTacToe result | ✅ |

### Game Rooms

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/rooms` | List available game rooms | ✅ |
| `POST` | `/api/rooms` | Create new game room | ✅ |
| `GET` | `/api/rooms/[id]` | Get room details | ✅ |
| `POST` | `/api/rooms/[id]/join` | Join a game room | ✅ |
| `POST` | `/api/rooms/[id]/leave` | Leave a game room | ✅ |

### Leaderboard

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/leaderboard` | Get global leaderboard | ❌ |
| `GET` | `/api/leaderboard/[gameType]` | Get game-specific leaderboard | ❌ |
| `GET` | `/api/leaderboard/user/[userId]` | Get user rankings | ❌ |

### PDF Processing (Web-Adobe)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/web-adobe/documents` | List PDF documents | ✅ |
| `POST` | `/api/web-adobe/documents` | Upload PDF document | ✅ |
| `GET` | `/api/web-adobe/documents/[id]` | Get document details | ✅ |
| `DELETE` | `/api/web-adobe/documents/[id]` | Delete document | ✅ |
| `GET` | `/api/web-adobe/documents/[id]/fields` | Get PDF form fields | ✅ |
| `POST` | `/api/web-adobe/documents/[id]/fields` | Update PDF fields | ✅ |

### Admin Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/admin/users` | List all users | 🔐 Admin |
| `POST` | `/api/admin/users` | Admin user actions | 🔐 Admin |
| `GET` | `/api/admin/performance` | Performance metrics | 🔐 Admin |
| `POST` | `/api/admin/performance` | Performance actions | 🔐 Admin |
| `GET` | `/api/admin/audit-logs` | View audit logs | 🔐 Admin |

### Performance Monitoring

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/admin/performance` | Get system performance stats | 🔐 Admin |
| `POST` | `/api/admin/performance` | Trigger maintenance actions | 🔐 Admin |

## 🔐 Authentication

### Sign Up
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "username": "player123",
    "password": "SecurePassword123!"
  }'
```

### Sign In
```bash
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!"
  }'
```

## 🎮 Game API Examples

### Get Tetris Leaderboard
```bash
curl http://localhost:3000/api/games/tetris?limit=10&gameMode=classic
```

**Response:**
```json
{
  "success": true,
  "leaderboard": [
    {
      "id": "score123",
      "score": 25000,
      "level": 8,
      "lines": 120,
      "user": {
        "id": "user456",
        "name": "ProGamer",
        "image": "/avatars/user.png"
      }
    }
  ],
  "personalBest": {
    "score": 15000,
    "level": 5,
    "lines": 50
  },
  "personalStats": {
    "gamesPlayed": 42,
    "averageScore": 8500,
    "totalLines": 500
  }
}
```

### Submit Tetris Score
```bash
curl -X POST http://localhost:3000/api/games/tetris \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION" \
  -d '{
    "score": 15000,
    "level": 5,
    "lines": 50,
    "time": 180000,
    "gameMode": "classic"
  }'
```

**Response:**
```json
{
  "success": true,
  "score": {
    "id": "score789",
    "score": 15000,
    "level": 5,
    "lines": 50
  },
  "isPersonalBest": true,
  "rank": 42
}
```

## 📄 PDF Processing Examples

### Upload PDF Document
```bash
curl -X POST http://localhost:3000/api/web-adobe/documents \
  -H "Cookie: next-auth.session-token=YOUR_SESSION" \
  -F "file=@document.pdf" \
  -F "title=Contract Form"
```

### Get PDF Fields
```bash
curl http://localhost:3000/api/web-adobe/documents/doc123/fields \
  -H "Cookie: next-auth.session-token=YOUR_SESSION"
```

## 🔒 Admin API Examples

### Get Performance Stats
```bash
curl http://localhost:3000/api/admin/performance \
  -H "Cookie: next-auth.session-token=ADMIN_SESSION"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "timestamp": "2025-01-27T10:00:00.000Z",
    "health": {
      "memory": "healthy",
      "performance": "healthy",
      "overall": "healthy"
    },
    "memory": {
      "usage": {
        "heapUsed": 256,
        "heapTotal": 512,
        "external": 32,
        "rss": 400
      },
      "percentages": {
        "heapUsed": 50,
        "external": 6
      }
    },
    "performance": {
      "tetris_move": {
        "count": 1523,
        "average": 12.5,
        "min": 8,
        "max": 45,
        "p95": 25
      }
    }
  }
}
```

### Trigger Garbage Collection
```bash
curl -X POST http://localhost:3000/api/admin/performance \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=ADMIN_SESSION" \
  -d '{
    "action": "force_gc"
  }'
```

## 📊 Response Formats

### Success Response
```json
{
  "success": true,
  "data": { /* response data */ }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

## 🔗 WebSocket API

### Real-Time Game Events

Connect to WebSocket server for real-time game updates:

```javascript
import { io } from 'socket.io-client'

const socket = io('http://localhost:3000', {
  auth: {
    token: 'YOUR_JWT_TOKEN'
  }
})

// Join game room
socket.emit('room:join', { roomId: 'room123' })

// Listen for game updates
socket.on('game:update', (data) => {
  console.log('Game state updated:', data)
})

// Send game move
socket.emit('tetris:move', {
  roomId: 'room123',
  playerId: 'user456',
  move: { /* move data */ }
})
```

### Available Socket Events

#### Tetris Events
- `tetris:move` - Submit move
- `tetris:game_over` - Game over notification
- `tetris:attack` - Attack lines sent

#### Connect4 Events
- `connect4:drop_piece` - Drop piece
- `connect4:move` - Move notification
- `connect4:game_over` - Game over notification

#### General Events
- `room:join` - Join game room
- `room:leave` - Leave game room
- `game:update` - Game state update
- `disconnect` - Connection closed
- `reconnect` - Reconnection attempt

## 🛠 Rate Limiting

API endpoints are rate-limited to ensure fair usage:

- **Public endpoints**: 60 requests/minute
- **Authenticated endpoints**: 120 requests/minute
- **Admin endpoints**: 300 requests/minute

Rate limit headers:
```
X-RateLimit-Limit: 120
X-RateLimit-Remaining: 115
X-RateLimit-Reset: 1706342400
```

## 🐛 Error Codes

| Code | Description |
|------|-------------|
| `AUTH_REQUIRED` | Authentication required |
| `INVALID_CREDENTIALS` | Invalid login credentials |
| `INSUFFICIENT_PERMISSIONS` | User lacks required permissions |
| `VALIDATION_ERROR` | Request validation failed |
| `NOT_FOUND` | Resource not found |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `INTERNAL_ERROR` | Server error |

## 📦 TypeScript Types

Example TypeScript interfaces:

```typescript
interface User {
  id: string
  email: string
  username: string
  role: 'USER' | 'MODERATOR' | 'ADMIN'
  avatar?: string
  bio?: string
  createdAt: Date
  updatedAt: Date
}

interface GameScore {
  id: string
  userId: string
  game: 'TETRIS' | 'CONNECT4' | 'TICTACTOE' | 'CHESS' | 'UNO'
  score: number
  level?: number
  lines?: number
  time: number
  gameMode: string
  createdAt: Date
}

interface GameRoom {
  id: string
  name: string
  gameType: 'TETRIS' | 'CONNECT4' | 'TICTACTOE' | 'CHESS' | 'UNO'
  status: 'WAITING' | 'ACTIVE' | 'FINISHED'
  maxPlayers: number
  currentPlayers: number
  isPrivate: boolean
  createdAt: Date
}
```

## 🧪 Testing

### Using Postman
1. Import the OpenAPI spec from `/api/docs`
2. Configure authentication in Postman environment
3. Run requests from the collection

### Using cURL
See examples throughout this document

### Using the Swagger UI
Visit `/api-docs` for interactive testing

## 📞 Support

- **Documentation**: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)
- **GitHub**: [https://github.com/glxy97/glxy-gaming-platform](https://github.com/glxy97/glxy-gaming-platform)
- **Issues**: Create an issue on GitHub

---

**Version**: 1.0.0  
**Last Updated**: January 2025  
**License**: MIT

