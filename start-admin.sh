#!/bin/bash
echo "🛡️ Avvio Server SuperAdmin su porta 8080..."
echo "🔐 URL: http://localhost:8080/nexus-prime-control"
echo "📧 Email: mattiasilvester@gmail.com"
echo "🔑 Password: SuperAdmin2025!"
echo "🗝️ Secret Key: PP_SUPERADMIN_2025_SECURE_KEY_CHANGE_ME"
echo ""
VITE_PORT=8080 npm run dev -- --port 8080 --host 0.0.0.0
