# 🔐 HTTPS für lokale Entwicklung

## Warum HTTPS lokal?

- **OAuth-Testing**: GitHub/Google OAuth erfordert HTTPS
- **Service Workers**: Funktionieren nur mit HTTPS
- **Realistische Umgebung**: Identisch mit Production

---

## ✅ Setup (Windows)

### 1. mkcert installieren

```powershell
# Mit Chocolatey
choco install mkcert

# Oder mit Scoop
scoop install mkcert

# Root CA erstellen
mkcert -install
```

### 2. Zertifikate generieren

```powershell
# Im Projektverzeichnis
cd G:\33_git_projects\glxy-gaming-platform

# Zertifikate erstellen
mkcert localhost 127.0.0.1 ::1

# Dateien umbenennen
Rename-Item -Path "localhost+2.pem" -NewName "localhost.crt"
Rename-Item -Path "localhost+2-key.pem" -NewName "localhost.key"
```

### 3. .env konfigurieren

Füge zu `.env` hinzu:

```bash
HTTPS=true
SSL_CRT_FILE=localhost.crt
SSL_KEY_FILE=localhost.key
```

### 4. Custom Server verwenden

Erstelle `server-https.js`:

```javascript
const { createServer } = require('https')
const { parse } = require('url')
const next = require('next')
const fs = require('fs')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = 3000

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

const httpsOptions = {
  key: fs.readFileSync('./localhost.key'),
  cert: fs.readFileSync('./localhost.crt'),
}

app.prepare().then(() => {
  createServer(httpsOptions, async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  }).listen(port, (err) => {
    if (err) throw err
    console.log(`> Ready on https://${hostname}:${port}`)
  })
})
```

### 5. package.json anpassen

```json
{
  "scripts": {
    "dev": "node server-https.js",
    "dev:http": "next dev"
  }
}
```

---

## ✅ Setup (macOS/Linux)

```bash
# mkcert installieren
brew install mkcert
mkcert -install

# Zertifikate erstellen
mkcert localhost 127.0.0.1 ::1
mv localhost+2.pem localhost.crt
mv localhost+2-key.pem localhost.key

# .env konfigurieren
echo "HTTPS=true" >> .env
echo "SSL_CRT_FILE=localhost.crt" >> .env
echo "SSL_KEY_FILE=localhost.key" >> .env
```

---

## 🚀 Verwendung

```bash
# HTTPS Dev-Server starten
npm run dev

# Website öffnen
# https://localhost:3000
```

---

## 🔧 Troubleshooting

### Problem: "Certificate not trusted"

```powershell
# Root CA neu installieren
mkcert -uninstall
mkcert -install
```

### Problem: "Port already in use"

```powershell
# Prozess finden
netstat -ano | findstr :3000

# Prozess beenden
taskkill /PID <PID> /F
```

### Problem: "SSL_CRT_FILE not found"

Prüfe, ob die Dateien im Projektverzeichnis sind:
```powershell
ls localhost.*
```

---

## 📝 .gitignore

Zertifikate **NICHT** committen!

```gitignore
# SSL Certificates
localhost.crt
localhost.key
*.pem
```

---

## ✅ Nächste Schritte

1. OAuth Callback URLs anpassen:
   - GitHub: `https://localhost:3000/api/auth/callback/github`
   - Google: `https://localhost:3000/api/auth/callback/google`

2. Service Workers testen

3. Push-Notifications entwickeln

