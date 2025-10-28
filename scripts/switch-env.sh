#!/usr/bin/env bash

# Wrapper script to preserve legacy "local|online" interface
# Delegates to the enhanced scripts/switch-env.sh implementation.

SCRIPT_DIR="$(dirname "$(readlink -f "$0")")"
ENHANCED_SCRIPT="$SCRIPT_DIR/scripts/switch-env.sh"

if [[ ! -x "$ENHANCED_SCRIPT" ]]; then
  echo "❌ Enhanced switch script not found at $ENHANCED_SCRIPT" >&2
  exit 1
fi

LEGACY_MODE=${1:-local}

case $LEGACY_MODE in
  local)
    "$ENHANCED_SCRIPT" development
    ;;
  online)
    "$ENHANCED_SCRIPT" production
    ;;
  status)
    "$ENHANCED_SCRIPT" status
    ;;
  dev|development|prod|production)
    "$ENHANCED_SCRIPT" "$LEGACY_MODE"
    ;;
  help|-h|--help)
    echo "Usage: $0 [local|online|status]"
    echo "  local   → scripts/switch-env.sh development"
    echo "  online  → scripts/switch-env.sh production"
    echo "  status  → scripts/switch-env.sh status"
    echo "Other arguments are forwarded to scripts/switch-env.sh"
    ;;
  *)
    "$ENHANCED_SCRIPT" "$@"
    ;;
esac
