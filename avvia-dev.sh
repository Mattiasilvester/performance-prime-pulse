#!/usr/bin/env bash
set -e

# Esegui sempre dallo stesso folder dello script
cd "$(dirname "$0")"
PORT=8081

# Carica TUTTO il .env (commenti ignorati da bash)
set -a
. ./.env
set +a

# Default sicuri
VITE_ENABLE_PRIMEBOT=${VITE_ENABLE_PRIMEBOT:-true}
VITE_APP_MODE=${VITE_APP_MODE:-development}

# Verifica variabili minime richieste
missing=()
for v in VITE_SUPABASE_URL VITE_SUPABASE_ANON_KEY VITE_VF_API_KEY VITE_VF_VERSION_ID; do
  [ -n "${!v:-}" ] || missing+=("$v")
done
if [ ${#missing[@]} -gt 0 ]; then
  echo "❌ Mancano queste variabili in .env:"
  for m in "${missing[@]}"; do echo "   - $m"; done
  exit 1
fi

# Log sintetico (maschera le chiavi)
mask() { local s="$1"; local n=${#s}; (( n>12 )) && echo "${s:0:6}…${s: -6}" || echo "$s"; }
echo "==> Riepilogo:"
echo "   Supabase URL: $VITE_SUPABASE_URL"
echo "   Supabase anon: $(mask "$VITE_SUPABASE_ANON_KEY")"
echo "   VF API key:    $(mask "$VITE_VF_API_KEY")"
echo "   VF version:    $VITE_VF_VERSION_ID"
echo "   PRIMEBOT:      $VITE_ENABLE_PRIMEBOT"
echo "   APP_MODE:      $VITE_APP_MODE"
echo "   Vite port:     $PORT"

# Libera porta e avvia
lsof -ti:$PORT | xargs kill -9 2>/dev/null || true
exec npm run dev -- --port "$PORT" --host
