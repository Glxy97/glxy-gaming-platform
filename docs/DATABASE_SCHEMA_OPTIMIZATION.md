# GLXY Gaming Platform - Database Schema Optimization

## Current Schema Analysis

Das aktuelle Prisma-Schema ist eine solide Basis für eine Gaming-Platform, hat aber Optimierungspotential:

### 🟢 Stärken des aktuellen Schemas
- Gute Indexierung für Performance
- Flexible JSON-Felder für game-spezifische Daten
- Comprehensive Gaming-spezifische Modelle
- NextAuth-Integration
- Soft-Delete-unterstützung für User-Management

### 🟡 Verbesserungsmöglichkeiten
- Fehlende Rating/ELO-System für Matchmaking
- Keine Zeitbasierte Partitionierung für große Tabellen
- Fehlende Audit-Trail für kritische Operationen
- Keine explizite Tournament/Competition-Unterstützung
- Begrenzte Social Features (Friends, Notifications)

## Optimierte Schema-Erweiterungen

### 1. Enhanced User Management mit erweiterten Features

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  username  String?  @unique
  password  String   @default("")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Enhanced Profile
  name          String?
  firstName     String?
  lastName      String?
  image         String?
  avatar        String?
  bio           String?
  location      String?
  timezone      String   @default("UTC")
  language      String   @default("en")
  birthDate     DateTime?

  // Gaming Profile
  level        Int      @default(1)
  globalXP     Int      @default(0)
  coins        Int      @default(100)
  playerTitle  String?

  // Enhanced Security
  loginAttempts     Int       @default(0)
  lockedUntil       DateTime?
  lastLogin         DateTime?
  lastLoginIp       String?
  lastLoginDevice   String?
  mfaEnabled        Boolean   @default(false) @map("mfa_enabled")
  mfaSecret         String?   @map("mfa_secret")
  mfaBackupCodes    String[]  @default([])

  // Email verification
  emailVerified     Boolean   @default(false) @map("email_verified")
  verificationToken String?   @map("verification_token")
  tokenExpires      DateTime? @map("token_expires")

  // Privacy & Preferences
  isPrivate         Boolean   @default(false)
  showOnlineStatus  Boolean   @default(true)
  allowFriendRequests Boolean @default(true)
  preferences       Json      @default("{}")

  // Status tracking
  status           UserStatus @default(ACTIVE)
  onlineStatus     OnlineStatus @default(OFFLINE)
  lastActivity     DateTime?
  deletedAt        DateTime?   // Soft delete

  // Relations
  accounts            Account[]
  sessions            Session[]
  gameStats           GameStats[]
  achievements        UserAchievement[]
  chatMessages        ChatMessage[]
  gameRooms           GameRoom[]
  playerInRooms       PlayerInRoom[]

  // Enhanced Relations
  ratings             PlayerRating[]
  tournaments         TournamentParticipant[]
  friendships         Friendship[] @relation("UserFriendships")
  friendRequests      Friendship[] @relation("FriendRequests")
  notifications       Notification[]
  gameHistory         GameHistory[]
  auditLogs           AuditLog[]

  // Enhanced Indexes
  @@index([email])
  @@index([username])
  @@index([level, globalXP])
  @@index([lastLogin])
  @@index([lockedUntil])
  @@index([verificationToken])
  @@index([emailVerified])
  @@index([status])
  @@index([onlineStatus])
  @@index([lastActivity])
  @@index([deletedAt])
  @@index([createdAt])
  @@map("users")
}

enum UserStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
  BANNED
  PENDING_VERIFICATION
}

enum OnlineStatus {
  ONLINE
  AWAY
  BUSY
  INVISIBLE
  OFFLINE
}
```

### 2. Advanced Rating System für Competitive Gaming

```prisma
model PlayerRating {
  id        String   @id @default(cuid())
  userId    String
  gameType  String

  // ELO/Rating System
  rating         Int      @default(1200)
  peakRating     Int      @default(1200)
  volatility     Float    @default(350.0)  // For Glicko-2 system
  ratingDeviation Float   @default(350.0)

  // Seasonal tracking
  season         String?
  seasonRating   Int?
  seasonPeak     Int?

  // Confidence metrics
  gamesPlayed    Int      @default(0)
  confidence     Float    @default(0.0)

  // Performance tracking
  winStreak      Int      @default(0)
  lossStreak     Int      @default(0)
  bestWinStreak  Int      @default(0)

  // Time tracking
  lastGameAt     DateTime?
  lastRatingChange Int     @default(0)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, gameType, season])
  @@index([gameType, rating])
  @@index([gameType, season, rating])
  @@index([userId, gameType])
  @@index([gamesPlayed])
  @@index([lastGameAt])
  @@map("player_ratings")
}
```

### 3. Enhanced Game Statistics mit detailliertem Tracking

```prisma
model GameStats {
  id       String @id @default(cuid())
  userId   String
  gameType String

  // Enhanced XP System
  xp           Int @default(0)
  level        Int @default(1)
  xpToNext     Int @default(0)

  // Comprehensive Stats
  gamesPlayed  Int @default(0)
  gamesWon     Int @default(0)
  gamesLost    Int @default(0)
  gamesDrawn   Int @default(0)

  // Performance Metrics
  averageGameTime   Int?    // in seconds
  totalPlayTime     Int     @default(0) // in seconds
  bestScore         Int?
  averageScore      Float?

  // Streaks and Records
  currentWinStreak  Int     @default(0)
  longestWinStreak  Int     @default(0)
  currentLossStreak Int     @default(0)

  // Advanced Metrics
  ranking           Int?    // Current global ranking
  percentile        Float?  // Performance percentile
  skillLevel        SkillLevel @default(BEGINNER)

  // Time-based stats
  dailyPlayTime     Json    @default("{}")  // JSON with date keys
  weeklyStats       Json    @default("{}")
  monthlyStats      Json    @default("{}")

  // Game-specific stats (flexible JSON)
  gameSpecificStats Json    @default("{}")

  // Tracking
  firstGameAt       DateTime?
  lastGameAt        DateTime?
  lastUpdate        DateTime @updatedAt

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, gameType])
  @@index([userId])
  @@index([gameType])
  @@index([gameType, level])
  @@index([gameType, gamesWon])
  @@index([gameType, xp])
  @@index([gameType, ranking])
  @@index([skillLevel])
  @@index([lastGameAt])
  @@map("game_stats")
}

enum SkillLevel {
  BEGINNER
  NOVICE
  INTERMEDIATE
  ADVANCED
  EXPERT
  MASTER
  GRANDMASTER
}
```

### 4. Tournament System für Competitive Events

```prisma
model Tournament {
  id          String @id @default(cuid())
  name        String
  description String?
  gameType    String

  // Tournament Configuration
  type            TournamentType
  format          TournamentFormat
  maxParticipants Int
  entryFee        Int              @default(0)
  prizePool       Int              @default(0)

  // Status and Timing
  status          TournamentStatus @default(UPCOMING)
  registrationStart DateTime
  registrationEnd   DateTime
  tournamentStart   DateTime
  tournamentEnd     DateTime?

  // Settings
  settings        Json @default("{}")
  rules           String?
  requirements    Json @default("{}")

  // Metadata
  isPublic        Boolean @default(true)
  featuredReward  String?
  bannerImage     String?

  // Relations
  organizerId     String
  organizer       User @relation(fields: [organizerId], references: [id])
  participants    TournamentParticipant[]
  brackets        TournamentBracket[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([gameType])
  @@index([status])
  @@index([type])
  @@index([registrationStart, registrationEnd])
  @@index([tournamentStart])
  @@index([organizerId])
  @@index([isPublic, gameType])
  @@map("tournaments")
}

enum TournamentType {
  SINGLE_ELIMINATION
  DOUBLE_ELIMINATION
  ROUND_ROBIN
  SWISS
  LADDER
}

enum TournamentFormat {
  BEST_OF_ONE
  BEST_OF_THREE
  BEST_OF_FIVE
  FIRST_TO_SCORE
}

enum TournamentStatus {
  UPCOMING
  REGISTRATION_OPEN
  REGISTRATION_CLOSED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

model TournamentParticipant {
  id           String @id @default(cuid())
  tournamentId String
  userId       String

  // Participation info
  registeredAt DateTime @default(now())
  seed         Int?
  status       ParticipantStatus @default(REGISTERED)

  // Performance
  wins         Int @default(0)
  losses       Int @default(0)
  position     Int?
  prizeWon     Int @default(0)

  tournament Tournament @relation(fields: [tournamentId], references: [id], onDelete: Cascade)
  user       User       @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([tournamentId, userId])
  @@index([tournamentId])
  @@index([userId])
  @@index([status])
  @@index([position])
  @@map("tournament_participants")
}

enum ParticipantStatus {
  REGISTERED
  CHECKED_IN
  PLAYING
  ELIMINATED
  WINNER
  DISQUALIFIED
}
```

### 5. Social Features: Friends & Notifications

```prisma
model Friendship {
  id        String @id @default(cuid())
  requesterId String
  addresseeId String
  status     FriendshipStatus @default(PENDING)

  requester User @relation("UserFriendships", fields: [requesterId], references: [id], onDelete: Cascade)
  addressee User @relation("FriendRequests", fields: [addresseeId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([requesterId, addresseeId])
  @@index([requesterId])
  @@index([addresseeId])
  @@index([status])
  @@map("friendships")
}

enum FriendshipStatus {
  PENDING
  ACCEPTED
  BLOCKED
  DECLINED
}

model Notification {
  id       String @id @default(cuid())
  userId   String
  type     NotificationType
  title    String
  message  String

  // Metadata
  data     Json @default("{}")
  read     Boolean @default(false)

  // References
  relatedUserId String?
  relatedItemId String?
  relatedItemType String?

  // Actions
  actionUrl String?
  actionText String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())
  expiresAt DateTime?

  @@index([userId])
  @@index([type])
  @@index([read])
  @@index([createdAt])
  @@index([userId, read, createdAt])
  @@map("notifications")
}

enum NotificationType {
  FRIEND_REQUEST
  FRIEND_ACCEPTED
  GAME_INVITATION
  TOURNAMENT_INVITATION
  ACHIEVEMENT_UNLOCKED
  LEVEL_UP
  SYSTEM_MESSAGE
  TOURNAMENT_START
  GAME_COMPLETED
}
```

### 6. Comprehensive Game History & Match Details

```prisma
model GameHistory {
  id        String @id @default(cuid())
  gameType  String
  roomId    String?

  // Game metadata
  gameMode    String?
  difficulty  String?
  duration    Int?        // in seconds

  // Results
  result      GameResult
  score       Json        @default("{}")

  // Participants
  players     Json        @default("[]")
  winner      String?     // userId

  // Performance tracking
  ratingChange Json       @default("{}")  // Per player rating changes
  xpGained     Json       @default("{}")  // Per player XP gained

  // Game data
  gameData    Json        @default("{}")
  moves       Json?       @default("[]")  // Move history for strategy games

  // Analytics
  statistics  Json        @default("{}")

  // Metadata
  startedAt   DateTime
  endedAt     DateTime    @default(now())
  createdAt   DateTime    @default(now())

  // Relations
  participants GameParticipant[]

  @@index([gameType])
  @@index([result])
  @@index([startedAt])
  @@index([endedAt])
  @@index([winner])
  @@index([gameType, startedAt])
  @@index([roomId])
  @@map("game_history")
}

enum GameResult {
  WIN
  LOSS
  DRAW
  ABANDONED
  TIMEOUT
}

model GameParticipant {
  id          String @id @default(cuid())
  gameId      String
  userId      String

  // Performance
  position    Int?
  score       Int?
  result      GameResult

  // Stats
  moves       Int?
  timeUsed    Int?        // in seconds
  accuracy    Float?

  // Changes
  ratingBefore Int?
  ratingAfter  Int?
  xpGained     Int         @default(0)
  coinsGained  Int         @default(0)

  game GameHistory @relation(fields: [gameId], references: [id], onDelete: Cascade)
  user User        @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([gameId, userId])
  @@index([gameId])
  @@index([userId])
  @@index([result])
  @@index([userId, result])
  @@map("game_participants")
}
```

### 7. Audit Trail für Security & Compliance

```prisma
model AuditLog {
  id        String @id @default(cuid())

  // Actor information
  userId    String?
  userEmail String?
  ipAddress String?
  userAgent String?

  // Action details
  action       AuditAction
  entity       String       // Table/resource name
  entityId     String?      // Record ID

  // Changes
  oldValues    Json?
  newValues    Json?
  changedFields String[]   @default([])

  // Context
  reason       String?
  sessionId    String?
  requestId    String?

  // Metadata
  success      Boolean     @default(true)
  errorMessage String?
  metadata     Json        @default("{}")

  user User? @relation(fields: [userId], references: [id], onDelete: SetNull)

  createdAt DateTime @default(now())

  @@index([userId])
  @@index([action])
  @@index([entity])
  @@index([entityId])
  @@index([createdAt])
  @@index([action, entity])
  @@index([userId, createdAt])
  @@index([ipAddress, createdAt])
  @@map("audit_logs")
}

enum AuditAction {
  CREATE
  UPDATE
  DELETE
  LOGIN
  LOGOUT
  LOGIN_FAILED
  REGISTER
  VERIFY_EMAIL
  RESET_PASSWORD
  CHANGE_PASSWORD
  ENABLE_MFA
  DISABLE_MFA
  JOIN_GAME
  LEAVE_GAME
  TOURNAMENT_JOIN
  TOURNAMENT_LEAVE
  ACHIEVEMENT_UNLOCK
  FRIENDSHIP_REQUEST
  FRIENDSHIP_ACCEPT
  FRIENDSHIP_BLOCK
  ADMIN_ACTION
  SYSTEM_ACTION
}
```

### 8. Performance Optimizations

```prisma
// Indexes für häufige Query-Pattern
// User lookup patterns
@@index([email, deletedAt])
@@index([username, deletedAt])

// Gaming performance queries
@@index([gameType, status, isPublic, createdAt])
@@index([gameType, rating], map: "idx_rating_leaderboard")

// Social features
@@index([userId, type, read, createdAt], map: "idx_notifications_user_timeline")
@@index([requesterId, status], map: "idx_friendship_requests")

// Analytics queries
@@index([gameType, startedAt, result], map: "idx_game_analytics")
@@index([userId, gameType, endedAt], map: "idx_user_game_history")

// Tournament queries
@@index([gameType, status, registrationStart], map: "idx_tournament_discovery")
@@index([tournamentId, status, position], map: "idx_tournament_standings")
```

## Schema Migration Strategy

### Phase 1: Core Enhancements
1. **User Model Erweitungen** - Privacy, Enhanced Security
2. **Rating System** - ELO/Glicko-2 Implementation
3. **Audit Trail** - Security & Compliance

### Phase 2: Social Features
1. **Friendship System** - Social Connectivity
2. **Notification System** - User Engagement
3. **Enhanced Chat** - Community Features

### Phase 3: Competitive Features
1. **Tournament System** - Competitive Events
2. **Advanced Game History** - Performance Analytics
3. **Leaderboards** - Ranking Systems

### Phase 4: Analytics & Performance
1. **Performance Optimizations** - Query Tuning
2. **Data Partitioning** - Scalability
3. **Advanced Analytics** - Business Intelligence

## Migration Commands

```bash
# Schritt 1: Backup erstellen
pg_dump glxy_gaming > backup_before_migration.sql

# Schritt 2: Schema Migration ausführen
npx prisma migrate dev --name "enhanced_gaming_schema_v2"

# Schritt 3: Daten migrieren
npx prisma db seed

# Schritt 4: Performance Optimizations
npx prisma db execute --file="scripts/create_performance_indexes.sql"
```

## Performance Considerations

### 1. Index Strategy
- **Composite Indexes** für häufige Abfrage-Kombinationen
- **Partial Indexes** für gefilterte Abfragen
- **Covering Indexes** für read-heavy Queries

### 2. Query Patterns
- **Pagination** mit Cursor-basierter Navigation
- **Batch Operations** für Bulk-Updates
- **Read Replicas** für Analytics-Queries

### 3. Data Archival
- **Partitioning** für große Tabellen (GameHistory, AuditLog)
- **Soft Deletes** mit Cleanup-Jobs
- **Data Retention Policies** für Compliance

## Monitoring & Maintenance

### 1. Performance Monitoring
```sql
-- Slow Query Analysis
SELECT query, mean_time, calls, total_time
FROM pg_stat_statements
ORDER BY total_time DESC LIMIT 10;

-- Index Usage Analysis
SELECT schemaname, tablename, indexname, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_tup_read DESC;
```

### 2. Regular Maintenance Tasks
- **VACUUM ANALYZE** für Statistik-Updates
- **REINDEX** für Index-Optimierung
- **Partition Pruning** für alte Daten

### 3. Backup Strategy
- **Continuous WAL Archiving** für Point-in-Time Recovery
- **Daily Full Backups** mit Rotation
- **Cross-Region Replication** für Disaster Recovery

---

**Nächste Schritte:**
1. Review des optimierten Schemas
2. Erstellung der Migration Scripts
3. Testing in Development Environment
4. Performance Benchmarking
5. Production Rollout mit Monitoring

**Estimated Implementation Time:** 2-3 Wochen für vollständige Implementation