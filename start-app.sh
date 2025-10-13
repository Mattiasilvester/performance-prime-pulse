#!/bin/bash
echo "⚛️ Avvio Server App Principale su porta 8081..."
echo "🌐 URL: http://localhost:8081/"
echo "📱 Applicazione completa con modifiche in tempo reale"
echo ""
VITE_PORT=8081 npm run dev -- --port 8081 --host 0.0.0.0
