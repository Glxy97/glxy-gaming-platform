#!/usr/bin/env bash
set -e

cd /opt/glxy-gaming

# 1. .env anlegen
rm -f .env
cp .env.production .env

# 2. containerd auf 1.7.27 bringen
wget -q https://download.docker.com/linux/ubuntu/dists/noble/pool/stable/amd64/containerd.io_1.7.27-1_amd64.deb
dpkg -i containerd.io_1.7.27-1_amd64.deb || apt -f install -y

# 3. Shebang im deploy.sh korrigieren
sed -i '1s|^.*$|#!/usr/bin/env bash|' deploy.sh
sed -i 's|\[\[\s*\$(which docker)\s*\]\]|command -v docker >/dev/null 2>&1|' deploy.sh
chmod +x deploy.sh

# 4. *.sh aus .dockerignore entfernen
grep -v '^\*\.sh$' .dockerignore > .dockerignore.tmp && mv .dockerignore.tmp .dockerignore

# 5. rate-limit.ts und redis.ts patchen
sed -i 's/delay:/backoff:/' lib/rate-limit.ts
sed -i "/new Redis(/,+3 s|^{|{\
  token: process.env.REDIS_PASSWORD,|" lib/rate-limit.ts
sed -i "/new Redis(/,+3 s|^{|{\
  token: process.env.REDIS_PASSWORD,|" lib/redis.ts

# 6. IP-Ermittlung in rate-limit.ts anpassen
sed -i "s|return req.ip || 'unknown'|const xff = req.headers.get('x-forwarded-for');\
if (xff) return xff.split(',')[0].trim();\
\/\/ @ts-ignore\
return req.socket?.remoteAddress || 'unknown'|" lib/rate-limit.ts

# 7. docker-compose.yml modernisieren (version entfernen)
sed -i '/^version:/d' docker-compose.yml

# 8. Build & Deploy
docker-compose build --no-cache app
docker-compose up -d app
bash ./deploy.sh deploy

echo "✅ Alle Fixes angewendet und Deployment abgeschlossen."
