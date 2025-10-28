# 🚀 GLXY.AT Gaming Plattform - Deployment Leitfaden

**Deutschsprachiges Projekt - Vollständige Deployment Anleitung**  
**Domain:** glxy.at  
**Erstellungsdatum:** 2025-09-10  

---

## 📋 DEPLOYMENT ÜBERSICHT

### ✅ **Bereits erledigt:**
- 🔐 Sichere Production Secrets generiert
- 🌐 Domain glxy.at konfiguriert  
- 📝 Vollständige deutschsprachige Dokumentation
- 🛡️ Sicherheits-Härtung implementiert
- 📊 API-Dokumentation & Monitoring

### 🔄 **Nächste Schritte:**
1. Server-Setup (PostgreSQL + Redis)
2. Database Migration ausführen
3. SSL-Zertifikat einrichten
4. Application Deployment

---

## 🖥️ SERVER ANFORDERUNGEN

### **Mindest-Spezifikationen:**
- **RAM:** 4GB (8GB empfohlen für Gaming-Last)
- **CPU:** 2 Cores (4 Cores empfohlen)
- **Speicher:** 50GB SSD (wachsende Datenbank)
- **Bandbreite:** Unlimited (Gaming-Traffic)
- **OS:** Ubuntu 22.04 LTS

### **Benötigte Services:**
```bash
# Kern-Services
- PostgreSQL 15+ (Hauptdatenbank)
- Redis 7+ (Caching & Sessions)
- Node.js 18+ (Application Runtime)
- Nginx (Reverse Proxy & SSL)
- PM2 (Process Management)
- Certbot/Let's Encrypt (SSL-Zertifikate)

# Optional für Skalierung
- Docker & Docker Compose
- Prometheus & Grafana (Monitoring)
- Backup-System (täglich)
```

---

## 🔧 SCHRITT-FÜR-SCHRITT DEPLOYMENT

### **Schritt 1: Server Vorbereitung**

```bash
# System aktualisieren
sudo apt update && sudo apt upgrade -y

# Node.js 18 installieren
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# PM2 global installieren
sudo npm install -g pm2

# Nginx installieren
sudo apt install nginx -y

# Certbot für SSL installieren
sudo apt install certbot python3-certbot-nginx -y
```

### **Schritt 2: Datenbank Setup**

```bash
# PostgreSQL installieren
sudo apt install postgresql postgresql-contrib -y

# PostgreSQL starten
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Datenbank-Benutzer erstellen
sudo -u postgres psql
CREATE DATABASE glxy_gaming;
CREATE USER glxy_2e9e6f9b WITH PASSWORD 'DsIt8cfibS>;{b@[wbf)r$%]*:21E|lB';
GRANT ALL PRIVILEGES ON DATABASE glxy_gaming TO glxy_2e9e6f9b;
ALTER USER glxy_2e9e6f9b CREATEDB;
\q
```

### **Schritt 3: Redis Setup**

```bash
# Redis installieren
sudo apt install redis-server -y

# Redis konfigurieren
sudo nano /etc/redis/redis.conf

# Folgende Zeilen ändern:
requirepass 1yH0fiVNjdzZVot]y.;JZv9qjP#V=&L?
bind 127.0.0.1
maxmemory 1gb
maxmemory-policy allkeys-lru

# Redis starten
sudo systemctl restart redis-server
sudo systemctl enable redis-server
```

### **Schritt 4: Application Deployment**

```bash
# Arbeitsverzeichnis erstellen
sudo mkdir -p /var/www/glxy-gaming
sudo chown $USER:$USER /var/www/glxy-gaming

# Code hochladen (via SCP oder Git)
cd /var/www/glxy-gaming

# Dependencies installieren
npm install --production

# Production Build erstellen
npm run build

# Environment Variables kopieren
# .env.production → .env (mit Server-spezifischen Hosts)

# Prisma Setup
npx prisma generate
npx prisma migrate deploy

# PM2 Konfiguration
pm2 start npm --name "glxy-gaming" -- start
pm2 save
pm2 startup
```

### **Schritt 5: Nginx & SSL Setup**

```bash
# Nginx Konfiguration für glxy.at
sudo nano /etc/nginx/sites-available/glxy.at
```

```nginx
server {
    server_name glxy.at www.glxy.at;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Socket.IO WebSocket Support
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";
}
```

```bash
# Site aktivieren
sudo ln -s /etc/nginx/sites-available/glxy.at /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# SSL-Zertifikat erstellen
sudo certbot --nginx -d glxy.at -d www.glxy.at
```

---

## 🔍 VALIDIERUNG & TESTS

### **Health Checks nach Deployment:**

```bash
# 1. Application Health
curl https://glxy.at/api/health

# 2. Database Connection
curl https://glxy.at/api/health | grep database

# 3. Redis Connection
curl https://glxy.at/api/health | grep redis

# 4. Socket.IO Test
curl https://glxy.at/socket.io/?transport=polling

# 5. SSL Zertifikat
openssl s_client -connect glxy.at:443 -servername glxy.at
```

### **Erwartete Responses:**
```json
{
  "status": "healthy",
  "timestamp": "2025-09-10T...",
  "version": "1.0.0",
  "services": {
    "database": "connected",
    "redis": "connected",
    "socketio": "running"
  }
}
```

---

## 🛡️ SICHERHEITS-CHECKLISTE

### **Firewall Konfiguration:**
```bash
# UFW aktivieren
sudo ufw enable

# Nur nötige Ports öffnen
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Alle anderen Ports schließen
sudo ufw default deny incoming
sudo ufw default allow outgoing
```

### **Fail2Ban für Brute-Force Schutz:**
```bash
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### **System-Härtung:**
```bash
# Automatische Updates aktivieren
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure -plow unattended-upgrades

# SSH Key-Only Authentication (empfohlen)
# Password-Authentication deaktivieren
sudo nano /etc/ssh/sshd_config
# PasswordAuthentication no
sudo systemctl restart ssh
```

---

## 📊 MONITORING SETUP

### **Application Monitoring:**
- ✅ **Sentry:** Error Tracking (bereits konfiguriert)
- ✅ **Custom API:** `/api/metrics` & `/api/errors`
- 🔄 **External Monitoring:** UptimeRobot/Pingdom

### **Server Monitoring:**
```bash
# Optional: Prometheus Node Exporter
wget https://github.com/prometheus/node_exporter/releases/download/v1.6.1/node_exporter-1.6.1.linux-amd64.tar.gz
tar xvfz node_exporter-1.6.1.linux-amd64.tar.gz
sudo mv node_exporter-1.6.1.linux-amd64/node_exporter /usr/local/bin/
sudo useradd --no-create-home --shell /bin/false node_exporter
```

---

## 🔄 BACKUP STRATEGIE

### **Automatisierte Backups:**

```bash
# Database Backup Script
sudo nano /usr/local/bin/backup-glxy.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/glxy"
mkdir -p $BACKUP_DIR

# PostgreSQL Backup
pg_dump -U glxy_2e9e6f9b -h localhost glxy_gaming > $BACKUP_DIR/db_backup_$DATE.sql

# Redis Backup
redis-cli --rdb $BACKUP_DIR/redis_backup_$DATE.rdb

# Application Files Backup
tar -czf $BACKUP_DIR/app_backup_$DATE.tar.gz /var/www/glxy-gaming

# Alte Backups löschen (älter als 7 Tage)
find $BACKUP_DIR -type f -mtime +7 -delete

echo "Backup completed: $DATE"
```

```bash
# Backup-Script ausführbar machen
sudo chmod +x /usr/local/bin/backup-glxy.sh

# Tägliche Cron-Job einrichten
sudo crontab -e
# 0 2 * * * /usr/local/bin/backup-glxy.sh >> /var/log/glxy-backup.log 2>&1
```

---

## 🚨 NOTFALL-PROZEDUREN

### **Rollback Strategie:**
```bash
# 1. Application Rollback
pm2 stop glxy-gaming
# Vorherige Version aus Backup wiederherstellen
pm2 start glxy-gaming

# 2. Database Rollback
sudo -u postgres psql
DROP DATABASE glxy_gaming;
CREATE DATABASE glxy_gaming;
# Backup einspielen
psql -U glxy_2e9e6f9b glxy_gaming < backup_file.sql
```

### **Performance Probleme:**
```bash
# Resource-Monitoring
htop
iotop
nethogs

# Application-Logs
pm2 logs glxy-gaming
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### **Sicherheitsvorfälle:**
1. **Sofort:** Secrets rotieren (neue Passwörter generieren)
2. **Firewall:** Verdächtige IPs blocken
3. **Logs:** Vollständige Audit-Trail analysieren
4. **Monitoring:** Sentry-Alerts aktivieren

---

## 📞 SUPPORT & WARTUNG

### **Regelmäßige Wartungsaufgaben:**
- **Wöchentlich:** Log-Rotation & Cleanup
- **Monatlich:** Security Updates installieren
- **Quartalsweise:** Vollständige System-Audits
- **Halbjährlich:** Secrets rotieren

### **Performance Optimierung:**
```bash
# Node.js Memory Limit erhöhen
pm2 delete glxy-gaming
pm2 start npm --name "glxy-gaming" --node-args="--max_old_space_size=2048" -- start

# Database Query Optimization
# Prisma Query Logging aktivieren
# Redis Memory Optimization
```

---

**📍 DEPLOYMENT LEITFADEN ENDE**

**✅ Mit diesem Leitfaden ist glxy.at deployment-ready!**  
**🔒 Alle Sicherheitsmaßnahmen sind implementiert!**  
**🚀 Gaming-Plattform kann live gehen!**