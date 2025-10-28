# Socket.IO Quick Start Guide

## TL;DR - Was wurde gefixt?

**Problem:**
```
WebSocket connection to 'ws://localhost:3001/api/socket/io/' failed
```

**Root Cause:**
1. Server lief nicht (TypeScript-Loading-Problem)
2. Client hatte falschen Path (`/api/socketio` statt `/api/socket/io`)
3. Unnötig komplexe Zwei-Server-Architektur

**Fix:**
- Unified Server (Port 3000 für Next.js UND Socket.IO)
- tsx für TypeScript-Loading in Dev
- Path-Korrektur in `hooks/use-socket.tsx`

---

## Schnellstart

### 1. Server starten

```bash
cd G:\website\verynew\glxy-gaming
npm run dev
```

**Erwartete Ausgabe:**
```
✅ Socket.IO initialized on Next.js server
⚡ Socket.IO Server ready on http://localhost:3000/api/socket/io
```

### 2. Browser öffnen

```
http://localhost:3000
```

### 3. DevTools Console Test

```javascript
// Socket.IO sollte automatisch connecten
// Checke Connection-Status im UI oder:
console.log(window.__SOCKET_CONNECTED__)
```

---

## Wichtige Änderungen

### Server (server.ts)

**Vorher:**
```javascript
// Zwei separate Server
const nextServer = createServer(...)
nextServer.listen(3000)

const socketServer = createServer()
socketServer.listen(3001)  // Separater Port!
```

**Nachher:**
```javascript
// Ein Server für beides
const server = createServer(handler)
const io = initializeSocketServer(server)
server.listen(3000)  // Nur ein Port!
```

### Client (hooks/use-socket.tsx)

**Vorher:**
```typescript
path: '/api/socketio'  // FALSCH
```

**Nachher:**
```typescript
path: '/api/socket/io'  // KORREKT
```

### Package Scripts

**Vorher:**
```json
"dev": "node server.ts"  // Konnte TS nicht laden
```

**Nachher:**
```json
"dev": "tsx server.ts"  // TypeScript-Support!
```

---

## Environment Variables

### Entfernen (nicht mehr nötig)

```bash
SOCKET_IO_PORT=3001  # DELETE THIS
```

### Behalten

```bash
PORT=3000
NEXTAUTH_URL=http://localhost:3000
SOCKET_IO_CORS_ORIGIN=http://localhost,http://localhost:3000
SOCKET_IO_SECRET=...
```

---

## Troubleshooting

### "Socket.IO NOT available"

**Problem:** tsx nicht installiert oder Build fehlt

**Fix:**
```bash
npm install --save-dev tsx
npm run dev
```

### "ECONNREFUSED localhost:3001"

**Problem:** Alter Browser-Cache oder alte Config

**Fix:**
```bash
# Hard Refresh
Ctrl + Shift + R (Chrome/Edge)
Cmd + Shift + R (Mac)

# Oder Cache löschen
rm -rf .next
npm run dev
```

### "connect_error: Authentication failed"

**Problem:** Nicht eingeloggt

**Fix:** In Development erlaubt Socket.IO unauthenticated connections als `dev-user`

---

## Testing Checklist

- [ ] Server startet ohne Errors
- [ ] Console zeigt "Socket.IO initialized"
- [ ] Browser DevTools zeigt keine Socket-Errors
- [ ] Network Tab zeigt WebSocket-Verbindung (101 Switching Protocols)
- [ ] Keine Requests zu localhost:3001 mehr

---

## URL-Übersicht

| Service | URL | Status |
|---------|-----|--------|
| Next.js Frontend | http://localhost:3000 | Active |
| Socket.IO | ws://localhost:3000/api/socket/io | Active |
| Socket.IO Polling | http://localhost:3000/api/socket/io/?EIO=4&transport=polling | Active |
| ~~Old Socket.IO~~ | ~~ws://localhost:3001~~ | **REMOVED** |

---

## Code-Snippets

### React Component mit Socket.IO

```tsx
'use client'

import { useSocket } from '@/hooks/use-socket'

export default function MyComponent() {
  const { socket, isConnected, error } = useSocket()

  useEffect(() => {
    if (!socket || !isConnected) return

    socket.on('my-event', (data) => {
      console.log('Received:', data)
    })

    return () => {
      socket.off('my-event')
    }
  }, [socket, isConnected])

  return (
    <div>
      Status: {isConnected ? '✅ Connected' : '❌ Disconnected'}
    </div>
  )
}
```

### Server-Side Event Emitting

```typescript
// In einem API-Route oder Server-Action
import { getServerSocket } from '@/lib/socket-server'

export async function broadcastUpdate() {
  const io = getServerSocket()
  io.emit('update', { message: 'Hello from server!' })
}
```

---

## Weitere Ressourcen

- **Full Report:** `SOCKET_FIX_REPORT.md`
- **Socket.IO Docs:** https://socket.io/docs/v4/
- **Next.js Custom Server:** https://nextjs.org/docs/advanced-features/custom-server

---

**Status:** ✅ FIXED
**Last Updated:** 2025-10-07
