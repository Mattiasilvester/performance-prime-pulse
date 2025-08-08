# PRIMEBOT CONFIGURATION

# Crea file .env
cat > .env << 'EOF'
# Voiceflow API Configuration
VITE_VF_API_KEY=VFDM.68950f3b3d888b1dd3ae2656.kmWvcOjRYmgvmJnT
VITE_VF_VERSION_ID=64dbb6696a8fab0013dba194

# Supabase Configuration (SOSTITUISCI con i tuoi valori)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Feature Flags
VITE_ENABLE_PRIMEBOT=true
VITE_APP_MODE=development
EOF

echo '✅ File .env creato!'
echo '🔧 Ora sostituisci VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY con i tuoi valori'
echo '�� Poi esegui: npm run dev'
