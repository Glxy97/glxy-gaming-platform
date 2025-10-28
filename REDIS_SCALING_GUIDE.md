# Socket.IO Redis Adapter - Horizontal Scaling Guide

## Übersicht

Der Socket.IO Redis-Adapter ermöglicht horizontale Skalierung der GLXY Gaming Platform über mehrere Server-Instanzen hinweg. Alle Echtzeit-Events (Game-Updates, Chat-Nachrichten, Raum-Synchronisation) werden automatisch zwischen den Servern synchronisiert.

## Architektur

```
                    ┌─────────────────┐
                    │  Load Balancer  │
                    │   (nginx/HAProxy)│
                    └─────────┬───────┘
                              │
            ┌─────────────────┼─────────────────┐
            │                 │                 │
    ┌───────▼────────┐ ┌──────▼──────────┐ ┌──▼────────────┐
    │  Server 1      │ │  Server 2       │ │  Server 3     │
    │  Next.js +     │ │  Next.js +      │ │  Next.js +    │
    │  Socket.IO     │ │  Socket.IO      │ │  Socket.IO    │
    └───────┬────────┘ └──────┬──────────┘ └──┬────────────┘
            │                 │                 │
            └─────────────────┼─────────────────┘
                              │
                    ┌─────────▼───────────┐
                    │   Redis Server      │
                    │   (Pub/Sub)         │
                    └─────────────────────┘
```

## Features

✅ **Automatische Raum-Synchronisation**: Spieler können Räume über verschiedene Server-Instanzen hinweg beitreten  
✅ **Cross-Server-Messaging**: Events werden zwischen allen Server-Instanzen synchronisiert  
✅ **Graceful Failover**: Bei Ausfall eines Servers bleiben Verbindungen bestehen  
✅ **Keine Sticky-Sessions erforderlich**: Load Balancer kann Round-Robin verwenden  
✅ **Automatische Reconnection**: Bei Redis-Ausfall automatischer Reconnect mit Backoff  

## Konfiguration

### 1. Environment-Variablen

Fügen Sie folgende Variablen zu `.env` hinzu:

```bash
# Redis Configuration für Socket.IO Adapter
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password  # Optional
REDIS_DB=0                          # Optional, default: 0
```

### 2. Redis Server Setup

#### Option A: Lokale Redis-Installation

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

**macOS (Homebrew):**
```bash
brew install redis
brew services start redis
```

**Windows (WSL2 empfohlen):**
```bash
# In WSL2
sudo apt install redis-server
sudo service redis-server start
```

#### Option B: Docker

```bash
# Redis starten
docker run -d \
  --name glxy-redis \
  -p 6379:6379 \
  redis:7-alpine

# Mit Passwort
docker run -d \
  --name glxy-redis \
  -p 6379:6379 \
  redis:7-alpine \
  redis-server --requirepass your_password
```

#### Option C: Redis Cloud (Production)

1. Account erstellen bei [Redis Labs](https://redis.com/)
2. Neue Datenbank erstellen
3. Verbindungsdaten in `.env` eintragen

### 3. Docker Compose (Empfohlen für Entwicklung)

Bereits konfiguriert in `docker-compose.yml`:

```yaml
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes
```

Starten mit:
```bash
docker-compose up -d redis
```

## Testing

### 1. Verfügbarkeit prüfen

```bash
# Redis-Verbindung testen
redis-cli ping
# Erwartete Antwort: PONG

# Mit Passwort
redis-cli -a your_password ping
```

### 2. Admin-Endpunkt

Scaling-Status über Admin-API abfragen:

```bash
GET /api/admin/scaling
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "redis": {
      "available": true,
      "config": {
        "host": "localhost",
        "port": 6379,
        "db": 0,
        "hasPassword": true
      },
      "status": "connected"
    },
    "scalingMode": "multi-server",
    "capabilities": {
      "horizontalScaling": true,
      "roomSynchronization": true,
      "crossServerMessaging": true,
      "stickySessionsRequired": false
    }
  }
}
```

### 3. Multi-Server-Test

**Terminal 1:**
```bash
PORT=3000 npm start
```

**Terminal 2:**
```bash
PORT=3001 npm start
```

**Browser 1:** `http://localhost:3000/games/tetris`  
**Browser 2:** `http://localhost:3001/games/tetris`

Beide Clients sollten sich im selben Raum sehen können!

## Load Balancer Setup

### nginx Konfiguration

```nginx
upstream glxy_backend {
    # Round-Robin (keine Sticky Sessions nötig!)
    server localhost:3000;
    server localhost:3001;
    server localhost:3002;
}

server {
    listen 80;
    server_name glxy-gaming.com;

    location / {
        proxy_pass http://glxy_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # WebSocket-spezifisch
    location /api/socket/io {
        proxy_pass http://glxy_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 86400;
    }
}
```

### HAProxy Konfiguration

```haproxy
frontend http_front
    bind *:80
    default_backend glxy_servers

backend glxy_servers
    balance roundrobin
    option http-server-close
    option forwardfor
    
    server server1 localhost:3000 check
    server server2 localhost:3001 check
    server server3 localhost:3002 check
```

## Monitoring

### Redis-Metriken überwachen

```bash
# Verbindungen anzeigen
redis-cli CLIENT LIST | grep addr

# Pub/Sub Aktivität
redis-cli PUBSUB CHANNELS

# Memory-Usage
redis-cli INFO memory
```

### Socket.IO-Adapter-Metriken

Über Admin-Dashboard abrufbar:
- Anzahl verbundener Server
- Raum-Verteilung
- Event-Durchsatz
- Reconnection-Rate

## Performance-Optimierung

### Redis-Konfiguration

**`redis.conf` optimieren:**

```conf
# Maximale Clients
maxclients 10000

# Memory-Limits
maxmemory 2gb
maxmemory-policy allkeys-lru

# Persistence (optional für Pub/Sub)
save ""
appendonly no

# Performance
tcp-backlog 511
timeout 300
```

### Connection Pooling

Bereits implementiert in `lib/redis-config.ts`:
- Separate Pub/Sub-Clients
- Automatische Reconnection
- Exponential Backoff

## Troubleshooting

### Problem: "Redis not available"

**Lösung:**
```bash
# Redis Status prüfen
redis-cli ping

# Logs prüfen
docker logs glxy-redis

# Firewall-Regel prüfen
sudo ufw allow 6379
```

### Problem: Events werden nicht synchronisiert

**Lösung:**
1. Pub/Sub-Aktivität prüfen:
   ```bash
   redis-cli MONITOR
   ```
2. Alle Server verwenden gleiche Redis-Instanz?
3. Redis-Passwort korrekt in `.env`?

### Problem: Hohe Latenz

**Lösung:**
- Redis-Server näher zu App-Servern platzieren
- Redis Cluster für geografische Verteilung
- Memory-Limits erhöhen

## Production Checklist

- [ ] Redis-Cluster für High-Availability setup
- [ ] Redis-Passwort konfiguriert
- [ ] TLS für Redis-Verbindungen aktiviert (Redis 6+)
- [ ] Monitoring für Redis aufgesetzt (Prometheus/Grafana)
- [ ] Backup-Strategie für Redis-Daten
- [ ] Rate-Limiting konfiguriert
- [ ] Health-Checks für alle Server-Instanzen
- [ ] Load-Balancer konfiguriert
- [ ] Logging für Adapter-Events aktiviert

## Skalierungs-Strategie

| Concurrent Users | Empfohlene Setup                          |
|------------------|-------------------------------------------|
| 0 - 1.000        | 1 Server + Redis (Single-Instance)       |
| 1.000 - 10.000   | 2-3 Server + Redis                        |
| 10.000 - 50.000  | 3-5 Server + Redis Cluster                |
| 50.000+          | 5+ Server + Redis Cluster + CDN          |

## Weitere Resourcen

- [Socket.IO Redis Adapter Docs](https://socket.io/docs/v4/redis-adapter/)
- [Redis Best Practices](https://redis.io/topics/admin)
- [GLXY Gaming Platform API Docs](/api-docs)
- [Performance Monitoring Dashboard](/admin/performance)

## Support

Bei Fragen oder Problemen:
- GitHub Issues: `https://github.com/glxy97/glxy-gaming-platform/issues`
- Admin-Dashboard: `/admin/performance`
- Scaling-Status API: `/api/admin/scaling`

