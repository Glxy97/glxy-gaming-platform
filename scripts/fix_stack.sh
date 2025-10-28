pass(){ printf '✅ %s\n' "$*"; }
fail(){ printf '❌ %s\n' "$*"; }
info(){ printf 'ℹ️  %s\n' "$*"; }

set -Eeuo pipefail
trap 'fail "Abbruch – ein Schritt ist fehlgeschlagen."' ERR

cd /opt/glxy-gaming
[ -f docker-stack.yml ] || { fail "docker-stack.yml fehlt"; exit 1; }
pass "Arbeitsverzeichnis ok: $(pwd)"

yq(){ docker run --rm -i --user root -v "$PWD:/w" -w /w mikefarah/yq:4.40.5 "$@"; }

info "Prüfe vorhandene Redis-Secrets …"
found=""
for s in redis_password redis_passwort REDIS_PASSWORD; do
  if docker secret inspect "$s" >/dev/null 2>&1; then found="$s"; break; fi
done
if [ -z "${found}" ]; then
  info "Kein Redis-Secret gefunden – erstelle 'redis_password' …"
  openssl rand -base64 32 | tr -d '\n' | docker secret create redis_password - >/dev/null
  found="redis_password"
  pass "Secret 'redis_password' angelegt"
else
  pass "Gefundenes Secret: ${found}"
fi
export REDIS_SECRET_EXT="$found"

ts="$(date +'%Y%m%d-%H%M%S' 2>/dev/null || echo local)"
cp -a docker-stack.yml "docker-stack.yml.bak-${ts}"
pass "Backup erstellt: docker-stack.yml.bak-${ts}"

info "Vereinheitliche Secret-Referenzen im Stack …"
docker run --rm -i --user root -e REDIS_SECRET_EXT -v "$PWD:/w" -w /w mikefarah/yq:4.40.5 -i '
  .secrets = (.secrets // {}) |
  .secrets.redis_password = {"external": true, "name": env(REDIS_SECRET_EXT)} |
  .services.redis.secrets = ((.services.redis.secrets // []) | map(select(. != "redis_password")) + ["redis_password"]) |
  .services.app.secrets   = ((.services.app.secrets   // []) | map(select(. != "redis_password")) + ["redis_password"])
' docker-stack.yml
pass "Secret-Referenzen aktualisiert"

info "Härte Redis-Service (requirepass + Healthcheck) …"
yq -i '
  .services.redis.image = (.services.redis.image // "redis:7-alpine") |
  .services.redis.command = [
    "redis-server","/usr/local/etc/redis/redis.conf",
    "--requirepass","$(cat /run/secrets/redis_password)"
  ] |
  (.services.redis.healthcheck //= {}) |
  .services.redis.healthcheck.test = ["CMD-SHELL","redis-cli -h 127.0.0.1 -a $(cat /run/secrets/redis_password) ping | grep -qi PONG"] |
  .services.redis.healthcheck.interval = "10s" |
  .services.redis.healthcheck.timeout = "5s" |
  .services.redis.healthcheck.retries = 20
' docker-stack.yml
pass "Redis-Konfiguration gehärtet"

info "Setze App-Umgebung & REDIS_URL (zur Laufzeit aus Secret) …"
yq -i '
  .services.app |= (
    (.environment |=
      if (. // {} | type) == "!!seq" then
        ((. // []) | map(select((. | test("^(HOST|PORT)=")) | not)) + ["HOST=0.0.0.0","PORT=3000"])
      else
        (. // {}) * {"HOST":"0.0.0.0","PORT":"3000"}
      end
    ) |
    .command = [
      "sh","-lc",
      "export REDIS_PASSWORD=$$(cat /run/secrets/redis_password); " +
      "export REDIS_URL=redis://:$$REDIS_PASSWORD@redis:6379; " +
      "echo \"[app] REDIS_URL gesetzt (maskiert)\"; " +
      "exec docker-entrypoint.sh"
    ] |
    (.healthcheck // {}) *
      {"test":["CMD-SHELL","wget -q --spider http://127.0.0.1:3000/ || exit 1"],
       "interval":"10s","timeout":"10s","start_period":"60s","retries":24}
  )
' docker-stack.yml
pass "App-Umgebung & Healthcheck gesetzt"

if [ -f nginx/conf.d/glxy.conf ]; then
  info "Korrigiere NGINX-Upstream auf app:3000 …"
  sed -i 's/glxy\(_stack\)\?_app:3000/app:3000/g' nginx/conf.d/glxy.conf || true
  pass "NGINX-Upstream geprüft/angepasst"
else
  info "nginx/conf.d/glxy.conf nicht gefunden – übersprungen"
fi

info "Deploye Stack …"
docker stack deploy -c docker-stack.yml glxy_stack
pass "Stack deploy ausgelöst"

wait_svc(){ svc="$1"; for i in $(seq 1 40); do r="$(docker service ls --format '{{.Name}} {{.Replicas}}' | awk -v n="$svc" '$1==n{print $2}')" || true; [ "${r:-0/0}" = "1/1" ] && { pass "$svc bereit (${r})"; return 0; } ; sleep 2; done; fail "$svc nicht bereit"; return 1; }
info "Warte auf Services (1/1) …"
wait_svc glxy_stack_redis
wait_svc glxy_stack_db
wait_svc glxy_stack_app
if docker service ls --format '{{.Name}}' | grep -q '^glxy_stack_nginx$'; then wait_svc glxy_stack_nginx; fi

info "Kurztest: App→Redis (DNS/Port) …"
app_c="$(docker ps --format '{{.ID}} {{.Names}}' | awk '/glxy_stack_app\.1/ {print $1; exit}' || true)"
if [ -n "${app_c:-}" ]; then
  docker exec -it "$app_c" sh -lc 'getent hosts redis; nc -zvw2 redis 6379 >/dev/null 2>&1 && echo "OK 6379" || echo "FAIL 6379"' || true
fi

info "Services:"
docker service ls --format '• {{.Name}}  {{.Replicas}}  {{.Image}}' | grep -E '^glxy_stack_' || true
pass "Fertig – Stack läuft, Secrets eingebunden (Werte wurden nicht ausgegeben)"
