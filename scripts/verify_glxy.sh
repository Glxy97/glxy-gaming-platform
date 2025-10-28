#!/usr/bin/env bash
set -euo pipefail
ROOT=${1:-/opt/glxy-gaming}
RED='\033[0;31m'; GRN='\033[0;32m'; YLW='\033[1;33m'; NC='\033[0m'

need() { command -v "$1" >/dev/null || { echo -e "$RED fehlend: $1 $NC"; exit 2; }; }
need grep; need sed; need awk

ok() { echo -e "${GRN}OK${NC}  $1"; }
miss() { echo -e "${RED}MISS${NC} $1"; FAIL=1; }

FAIL=0
# 1) Artefakte
[[ -f "$ROOT/GLXY_Platform_Documentation_COMPLETE.md" ]] && ok doc || miss doc
[[ -f "$ROOT/lib/config.ts" ]] && ok lib/config.ts || miss lib/config.ts
[[ -f "$ROOT/app/layout.tsx" ]] && ok app/layout.tsx || miss app/layout.tsx
[[ -f "$ROOT/nginx/glxy.conf" ]] && ok nginx/glxy.conf || miss nginx/glxy.conf

# 2) Gefährliche Globals (ohne config.ts)
MATCHES=$(grep -RInE '\bwindow\.settings\b|^[^/]*\bsettings\b' \
  "$ROOT/app" "$ROOT/components" "$ROOT/lib" 2>/dev/null | grep -v 'lib/config.ts' || true)
if [[ -n "$MATCHES" ]]; then
  echo -e "${YLW}HINWEIS${NC} Verdächtige settings-Verwendung:\n$MATCHES"; else ok "keine direkten globals"; fi

# 3) NGINX Config sanity
if [[ -f "$ROOT/nginx/glxy.conf" ]]; then
  grep -q '/_next/static/' "$ROOT/nginx/glxy.conf" && ok "/_next/static/ Regel vorhanden" || miss "_next/static Regel"
  grep -qi 'application/javascript' "$ROOT/nginx/glxy.conf" && ok "MIME js gesetzt" || miss "MIME js fehlt"
fi

# Exitcode
if [[ ${FAIL} -ne 0 ]]; then echo -e "${RED}VERIFICATION: FEHLER${NC}"; exit 1; else echo -e "${GRN}VERIFICATION: OK${NC}"; fi