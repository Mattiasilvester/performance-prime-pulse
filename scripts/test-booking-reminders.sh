#!/bin/bash

# Script di test per promemoria prenotazioni
# Uso: ./scripts/test-booking-reminders.sh

# Colori per output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔔 TEST PROMEMORIA PRENOTAZIONI${NC}"
echo ""

# Verifica variabili ambiente
if [ -z "$SUPABASE_URL" ]; then
  SUPABASE_URL="https://kfxoyucatvvcgmqalxsg.supabase.co"
  echo -e "${YELLOW}⚠️  SUPABASE_URL non impostata, uso default: $SUPABASE_URL${NC}"
fi

if [ -z "$SUPABASE_ANON_KEY" ]; then
  echo -e "${RED}❌ SUPABASE_ANON_KEY non impostata!${NC}"
  echo "Impostala con: export SUPABASE_ANON_KEY='your_key_here'"
  exit 1
fi

echo -e "${GREEN}✅ Chiamata Edge Function booking-reminders...${NC}"
echo ""

# Chiama Edge Function
RESPONSE=$(curl -s -X POST \
  "$SUPABASE_URL/functions/v1/booking-reminders" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json")

echo "Risposta:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# Verifica risultato
if echo "$RESPONSE" | grep -q '"success":true'; then
  echo -e "${GREEN}✅ Funzione eseguita con successo!${NC}"
  
  REMINDERS=$(echo "$RESPONSE" | jq -r '.remindersCreated // 0' 2>/dev/null || echo "0")
  if [ "$REMINDERS" -gt 0 ]; then
    echo -e "${GREEN}✅ $REMINDERS promemoria creati!${NC}"
  else
    echo -e "${YELLOW}⚠️  Nessun promemoria creato. Verifica:${NC}"
    echo "  - Prenotazione è confermata (status = 'confirmed')?"
    echo "  - Prenotazione è futura?"
    echo "  - notify_booking_reminder = true?"
    echo "  - Siamo nella finestra temporale corretta?"
  fi
else
  echo -e "${RED}❌ Errore nella chiamata!${NC}"
fi
