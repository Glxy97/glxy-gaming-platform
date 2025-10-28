# GLXY Gaming Platform - Go-Live Checklist

Vollständige Checkliste für den Production-Start der GLXY Gaming Platform.

**Deployment-Datum**: _________________
**Verantwortlich**: _________________
**Review durch**: _________________

---

## Pre-Deployment Phase

### 1. Server-Setup

- [ ] Server bei Hetzner (oder anderem Provider) provisioniert
- [ ] Ubuntu 22.04 LTS installiert und aktualisiert
- [ ] Docker & Docker Compose installiert (neueste Versionen)
- [ ] Non-root User `glxy` erstellt mit sudo-Rechten
- [ ] SSH-Keys für Server-Zugriff eingerichtet
- [ ] SSH Password-Authentication deaktiviert
- [ ] Fail2ban installiert und konfiguriert
- [ ] UFW Firewall aktiviert (nur Ports 22, 80, 443 offen)
- [ ] Server-Monitoring-Tools installiert (htop, netstat, etc.)

**Verifizierung:**
```bash
docker --version
docker compose version
ufw status
systemctl status fail2ban
```

---

### 2. DNS & Domain

- [ ] Domain bei Registrar gekauft (glxy.at)
- [ ] A-Record für glxy.at auf Server-IP zeigt
- [ ] A-Record für www.glxy.at auf Server-IP zeigt (oder CNAME)
- [ ] DNS-Propagation abgeschlossen (48h Vorlaufzeit!)
- [ ] TTL auf niedrigen Wert gesetzt (für schnelle Änderungen)
- [ ] MX-Records für Email konfiguriert (optional)
- [ ] SPF/DKIM Records gesetzt (optional)

**Verifizierung:**
```bash
dig glxy.at +short
dig www.glxy.at +short
nslookup glxy.at
```

---

### 3. SSL/TLS Zertifikate

- [ ] Let's Encrypt Certbot installiert
- [ ] SSL-Zertifikat für glxy.at generiert
- [ ] SSL-Zertifikat für www.glxy.at generiert
- [ ] Zertifikate nach `/opt/glxy-gaming/ssl/` kopiert
- [ ] Auto-Renewal Cron-Job eingerichtet
- [ ] SSL-Konfiguration getestet (SSL Labs A+ Rating angestrebt)
- [ ] HSTS Header aktiviert
- [ ] HTTP -> HTTPS Redirect funktioniert

**Verifizierung:**
```bash
certbot certificates
openssl x509 -in /opt/glxy-gaming/ssl/glxy.at.crt -text -noout
curl -I https://glxy.at
```

---

### 4. Environment-Variablen & Secrets

- [ ] `.env.production` von `.env.production.template` erstellt
- [ ] Alle `GENERATE_WITH_OPENSSL_RAND_BASE64_32` durch echte Secrets ersetzt
- [ ] Alle `your_*_here` Platzhalter mit echten Werten befüllt
- [ ] Domain-URLs auf `glxy.at` angepasst
- [ ] Production Database-Credentials generiert
- [ ] Production Redis-Password generiert
- [ ] NEXTAUTH_SECRET generiert (32+ Zeichen)
- [ ] JWT_SECRET generiert (32+ Zeichen)
- [ ] SOCKET_IO_SECRET generiert (32+ Zeichen)
- [ ] Alle weiteren Secrets generiert
- [ ] `.env.production` Permissions auf 600 gesetzt (`chmod 600`)
- [ ] `.env.production` NIEMALS in Git committed

**Secrets-Generierung:**
```bash
for i in {1..10}; do openssl rand -base64 32; done
```

**Verifizierung:**
```bash
grep -i "GENERATE_WITH" .env.production  # Sollte KEINE Treffer haben
grep -i "your_.*_here" .env.production   # Sollte KEINE Treffer haben
```

---

### 5. OAuth Applications

#### Google OAuth

- [ ] Production Google Cloud Project erstellt
- [ ] Google+ API aktiviert
- [ ] OAuth 2.0 Credentials erstellt
- [ ] Authorized redirect URIs: `https://glxy.at/api/auth/callback/google`
- [ ] Client ID in `.env.production` eingetragen
- [ ] Client Secret in `.env.production` eingetragen
- [ ] OAuth Consent Screen konfiguriert (Domain-Verifikation!)
- [ ] Scope: email, profile

**Verifizierung:**
```bash
grep "GOOGLE_CLIENT_ID" .env.production | wc -l  # Sollte 1 sein
```

#### GitHub OAuth

- [ ] GitHub OAuth App für Production erstellt
- [ ] Homepage URL: `https://glxy.at`
- [ ] Authorization callback URL: `https://glxy.at/api/auth/callback/github`
- [ ] Client ID in `.env.production` eingetragen
- [ ] Client Secret in `.env.production` eingetragen

**Verifizierung:**
```bash
grep "GITHUB_CLIENT_ID" .env.production | wc -l  # Sollte 1 sein
```

---

### 6. Database Setup

- [ ] PostgreSQL Container getestet (Docker Compose)
- [ ] Database-User `glxy_admin` mit starkem Passwort
- [ ] Database `glxy_gaming` erstellt
- [ ] Connection-String in `.env.production` korrekt
- [ ] Prisma Schema auf Production-Mode
- [ ] Migration-Strategie definiert
- [ ] Initial-Backup-Strategie definiert

**Verifizierung:**
```bash
docker-compose -f docker-compose.prod.yml up -d db
docker-compose -f docker-compose.prod.yml exec db psql -U glxy_admin -d glxy_gaming -c "SELECT version();"
```

---

### 7. Redis Setup

- [ ] Redis Container getestet (Docker Compose)
- [ ] Redis mit Password-Auth konfiguriert
- [ ] Persistence aktiviert (AOF + RDB)
- [ ] Memory-Limit gesetzt (512MB)
- [ ] Eviction-Policy: `allkeys-lru`
- [ ] Connection-String in `.env.production` korrekt

**Verifizierung:**
```bash
docker-compose -f docker-compose.prod.yml up -d redis
docker-compose -f docker-compose.prod.yml exec redis redis-cli -a <PASSWORD> ping
```

---

### 8. Docker Images

- [ ] Multi-Stage Dockerfile getestet
- [ ] Production-Build erfolgreich
- [ ] Image-Größe akzeptabel (< 1GB)
- [ ] Non-root User in Container
- [ ] Health-Checks funktionieren
- [ ] Volumes korrekt gemountet
- [ ] Docker Compose Production-File getestet

**Verifizierung:**
```bash
docker-compose -f docker-compose.prod.yml build
docker images | grep glxy
docker-compose -f docker-compose.prod.yml config  # Config validieren
```

---

### 9. Nginx Reverse Proxy

- [ ] Nginx-Konfiguration getestet
- [ ] SSL/TLS Termination funktioniert
- [ ] HTTP -> HTTPS Redirect aktiv
- [ ] WebSocket-Support für Socket.IO funktioniert
- [ ] Rate Limiting konfiguriert
- [ ] Security Headers gesetzt (CSP, HSTS, etc.)
- [ ] Gzip Compression aktiviert
- [ ] Static Asset Caching konfiguriert
- [ ] Client Max Body Size: 50MB (für Uploads)

**Verifizierung:**
```bash
docker-compose -f docker-compose.prod.yml exec nginx nginx -t
curl -I https://glxy.at
```

---

### 10. Monitoring & Logging

- [ ] Application-Logs in JSON-Format (Production)
- [ ] Docker Logging-Driver konfiguriert (json-file mit Rotation)
- [ ] Health-Check-Endpoint funktioniert: `/api/health`
- [ ] Prometheus & Grafana Setup (optional)
- [ ] Sentry Error-Tracking aktiviert (optional)
- [ ] Alert-System konfiguriert (optional)
- [ ] Log-Aggregation eingerichtet (optional)

**Verifizierung:**
```bash
curl http://localhost/api/health | jq
docker-compose -f docker-compose.prod.yml logs app | head -10
```

---

### 11. Backups

- [ ] Automated Database Backup eingerichtet (täglich)
- [ ] Backup-Retention-Policy definiert (30 Tage)
- [ ] Backup-Storage außerhalb Server (S3, etc.)
- [ ] Uploads-Backup-Strategie definiert
- [ ] Backup-Restore getestet (WICHTIG!)
- [ ] Disaster-Recovery-Plan dokumentiert

**Verifizierung:**
```bash
./scripts/deploy.sh backup
ls -lh backups/
```

---

## Deployment Phase

### 12. Code Deployment

- [ ] Latest Code auf Server gepullt (`git pull origin main`)
- [ ] Dependencies installiert (`npm ci`)
- [ ] TypeScript-Check erfolgreich (`npm run typecheck`)
- [ ] ESLint Check erfolgreich (`npm run lint`)
- [ ] Unit-Tests erfolgreich (`npm run test`)
- [ ] E2E-Tests erfolgreich (`npm run e2e`)
- [ ] Production-Build erfolgreich (`npm run build`)

**Verifizierung:**
```bash
cd /opt/glxy-gaming
git status
npm run build
```

---

### 13. Database Migrations

- [ ] Database Migrations vorbereitet
- [ ] Prisma Client generiert
- [ ] Migration in Staging getestet
- [ ] Backup VOR Migration erstellt
- [ ] Migration auf Production ausgeführt
- [ ] Migration erfolgreich verifiziert
- [ ] Rollback-Plan bereit

**Ausführung:**
```bash
docker-compose -f docker-compose.prod.yml exec app npx prisma migrate deploy
```

---

### 14. Services Start

- [ ] Docker Compose Services gestartet
- [ ] Alle Container Status: `Up (healthy)`
- [ ] Database Health-Check: `OK`
- [ ] Redis Health-Check: `OK`
- [ ] App Health-Check: `OK`
- [ ] Nginx Health-Check: `OK`
- [ ] WebSocket-Verbindung getestet
- [ ] Logs auf Errors geprüft

**Ausführung:**
```bash
docker-compose -f docker-compose.prod.yml up -d
docker-compose -f docker-compose.prod.yml ps
```

---

## Post-Deployment Phase

### 15. Smoke Tests

- [ ] Homepage lädt: `https://glxy.at`
- [ ] SSL-Zertifikat gültig (grünes Schloss)
- [ ] Login mit Google OAuth funktioniert
- [ ] Login mit GitHub OAuth funktioniert
- [ ] User-Registration funktioniert
- [ ] Socket.IO WebSocket-Verbindung funktioniert
- [ ] Game-Room erstellen funktioniert
- [ ] Game-Spielen funktioniert (alle Game-Types)
- [ ] File-Upload funktioniert (Web-Adobe)
- [ ] Performance akzeptabel (< 3s Page Load)
- [ ] Mobile Responsiveness getestet

**Verifizierung:**
```bash
curl https://glxy.at
curl https://glxy.at/api/health | jq
curl https://glxy.at/api/auth/providers
```

---

### 16. Security Checks

- [ ] Security Headers validiert (securityheaders.com)
- [ ] SSL Labs Test: A+ Rating (ssllabs.com)
- [ ] OWASP Top 10 geprüft
- [ ] SQL-Injection-Tests negativ
- [ ] XSS-Tests negativ
- [ ] CSRF-Protection aktiv
- [ ] Rate-Limiting funktioniert
- [ ] DDoS-Protection aktiv (Cloudflare optional)
- [ ] Secrets nicht in Git committed
- [ ] Environment-Variables nicht öffentlich

**Tools:**
- https://securityheaders.com
- https://www.ssllabs.com/ssltest/
- `npm audit`

---

### 17. Performance Tests

- [ ] Lighthouse Score: > 90
- [ ] Core Web Vitals: Grün
- [ ] API Response Time: < 200ms (avg)
- [ ] Database Query Time: < 50ms (avg)
- [ ] Redis Latency: < 10ms
- [ ] WebSocket Latency: < 50ms
- [ ] Concurrent Users: 100+ ohne Performance-Degradation
- [ ] Load Testing durchgeführt (optional)

**Tools:**
```bash
npx lighthouse https://glxy.at --view
curl -o /dev/null -s -w '%{time_total}\n' https://glxy.at
```

---

### 18. Monitoring & Alerts

- [ ] Prometheus Metrics werden gesammelt (optional)
- [ ] Grafana Dashboards eingerichtet (optional)
- [ ] Sentry Error-Tracking funktioniert (optional)
- [ ] Email-Alerts für kritische Errors (optional)
- [ ] Uptime-Monitoring aktiv (UptimeRobot, etc.)
- [ ] Server-Resource-Monitoring aktiv
- [ ] Log-Rotation funktioniert

---

### 19. Documentation & Handover

- [ ] Deployment-Dokumentation aktualisiert
- [ ] Rollback-Prozedur dokumentiert
- [ ] Incident-Response-Plan erstellt
- [ ] Runbook für häufige Tasks erstellt
- [ ] Team über Go-Live informiert
- [ ] Support-Kontakte definiert
- [ ] Escalation-Prozess definiert

---

### 20. Post-Launch Monitoring

**Erste Stunde:**
- [ ] Health-Checks alle 5 Minuten
- [ ] Error-Logs kontinuierlich überwacht
- [ ] User-Traffic beobachtet
- [ ] Performance-Metriken überwacht

**Erste 24 Stunden:**
- [ ] Stündliche Health-Checks
- [ ] Database-Performance überwacht
- [ ] Redis Memory-Usage überwacht
- [ ] Server-Load überwacht
- [ ] Error-Rate < 1%

**Erste Woche:**
- [ ] Tägliche Backups verifiziert
- [ ] Performance-Trends analysiert
- [ ] User-Feedback gesammelt
- [ ] Bug-Reports priorisiert
- [ ] Optimization-Maßnahmen geplant

---

## Emergency Contacts

**DevOps Team:**
- Name: _________________
- Phone: _________________
- Email: _________________

**On-Call Engineer:**
- Name: _________________
- Phone: _________________
- Email: _________________

**Server Provider (Hetzner):**
- Support: support@hetzner.com
- Emergency: _________________

---

## Rollback Plan

**Bei kritischen Errors:**

1. **Sofortmaßnahmen:**
   ```bash
   # Services stoppen
   docker-compose -f docker-compose.prod.yml down

   # Zu letzter stabiler Version zurückkehren
   git reset --hard <LAST_STABLE_COMMIT>

   # Services neu starten
   docker-compose -f docker-compose.prod.yml up -d
   ```

2. **Database Rollback:**
   ```bash
   # Backup wiederherstellen
   cd /opt/glxy-gaming/backups
   gunzip db_backup_YYYYMMDD_HHMMSS.sql.gz
   docker-compose -f docker-compose.prod.yml exec -T db psql -U glxy_admin -d glxy_gaming < db_backup_YYYYMMDD_HHMMSS.sql
   ```

3. **Incident Communication:**
   - Status-Page aktualisieren
   - Users informieren (Email, Social Media)
   - Team informieren (Slack, Email)

---

## Sign-Off

**DevOps Engineer:**
Name: _________________
Signature: _________________
Date: _________________

**Product Owner:**
Name: _________________
Signature: _________________
Date: _________________

**CTO/Technical Lead:**
Name: _________________
Signature: _________________
Date: _________________

---

**Go-Live Status**: ⬜ NOT READY | ⬜ READY | ⬜ DEPLOYED

**Letzte Aktualisierung**: 2025-10-07
