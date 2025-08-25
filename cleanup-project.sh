#!/bin/bash

# 🧹 SCRIPT DI CLEANUP AUTOMATICO - Performance Prime Pulse
# Versione: 1.0
# Data: 10 Agosto 2025
# Descrizione: Rimuove automaticamente tutti i file obsoleti e duplicati

set -e  # Interrompi l'esecuzione in caso di errori

echo "🧹 INIZIO CLEANUP PROGETTO - Performance Prime Pulse"
echo "=================================================="
echo ""

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funzione per log colorato
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Controlla se siamo nella directory corretta
if [ ! -f "package.json" ]; then
    log_error "❌ ERRORE: Devi eseguire questo script dalla directory performance-prime-pulse/"
    exit 1
fi

# Crea backup directory
BACKUP_DIR="backup-cleanup-$(date +%Y%m%d-%H%M%S)"
log_info "📦 Creazione backup in: $BACKUP_DIR"
mkdir -p "$BACKUP_DIR"

# FASE 1: BACKUP DEI FILE DA RIMUOVERE
echo ""
log_info "🔄 FASE 1: Backup dei file da rimuovere..."

# Backup documentazione obsoleta
if ls *_UPDATE_*.md 1> /dev/null 2>&1; then
    log_info "📚 Backup documentazione UPDATE..."
    cp *_UPDATE_*.md "$BACKUP_DIR/" 2>/dev/null || true
fi

if ls *_FIX_*.md 1> /dev/null 2>&1; then
    log_info "🔧 Backup file FIX..."
    cp *_FIX_*.md "$BACKUP_DIR/" 2>/dev/null || true
fi

if ls *_IMPLEMENTATION_*.md 1> /dev/null 2>&1; then
    log_info "🏗️  Backup file IMPLEMENTATION..."
    cp *_IMPLEMENTATION_*.md "$BACKUP_DIR/" 2>/dev/null || true
fi

if ls *_REPORT_*.md 1> /dev/null 2>&1; then
    log_info "📊 Backup file REPORT..."
    cp *_REPORT_*.md "$BACKUP_DIR/" 2>/dev/null || true
fi

# Backup file di test
if [ -d "src/utils" ]; then
    log_info "🧪 Backup file di test..."
    mkdir -p "$BACKUP_DIR/src/utils"
    cp src/utils/*test*.ts "$BACKUP_DIR/src/utils/" 2>/dev/null || true
    cp src/utils/*test*.js "$BACKUP_DIR/src/utils/" 2>/dev/null || true
fi

if [ -d "src/test" ]; then
    log_info "🧪 Backup directory test..."
    cp -r src/test "$BACKUP_DIR/src/" 2>/dev/null || true
fi

# Backup file di deploy
if ls performance-prime-deploy*.zip 1> /dev/null 2>&1; then
    log_info "📦 Backup file di deploy..."
    cp performance-prime-deploy*.zip "$BACKUP_DIR/" 2>/dev/null || true
fi

if ls lovable-deploy.* 1> /dev/null 2>&1; then
    log_info "🚀 Backup file Lovable..."
    cp lovable-deploy.* "$BACKUP_DIR/" 2>/dev/null || true
fi

log_success "✅ Backup completato in: $BACKUP_DIR"

# FASE 2: RIMOZIONE FILE DI DOCUMENTAZIONE OBSOLETI
echo ""
log_info "🗑️  FASE 2: Rimozione documentazione obsoleta..."

# Rimuovi file di documentazione
log_info "📚 Rimozione file UPDATE..."
rm -f *_UPDATE_*.md 2>/dev/null || true

log_info "🔧 Rimozione file FIX..."
rm -f *_FIX_*.md 2>/dev/null || true

log_info "🏗️  Rimozione file IMPLEMENTATION..."
rm -f *_IMPLEMENTATION_*.md 2>/dev/null || true

log_info "📊 Rimozione file REPORT..."
rm -f *_REPORT_*.md 2>/dev/null || true

log_info "📝 Rimozione altri file di documentazione..."
rm -f TECHNICAL_UPDATE_*.md 2>/dev/null || true
rm -f ULTIMI_SVILUPPI_*.md 2>/dev/null || true
rm -f PROJECT_STATUS_SUMMARY.md 2>/dev/null || true
rm -f work.md 2>/dev/null || true

log_success "✅ Documentazione obsoleta rimossa"

# FASE 3: RIMOZIONE FILE DI TEST OBSOLETI
echo ""
log_info "🧪 FASE 3: Rimozione file di test obsoleti..."

# Rimuovi file di test dalle utils
if [ -d "src/utils" ]; then
    log_info "🗑️  Rimozione file di test da utils..."
    rm -f src/utils/*test*.ts 2>/dev/null || true
    rm -f src/utils/*test*.js 2>/dev/null || true
fi

# Rimuovi directory test
if [ -d "src/test" ]; then
    log_info "🗑️  Rimozione directory test..."
    rm -rf src/test 2>/dev/null || true
fi

# Rimuovi file di test environment
log_info "🗑️  Rimozione file test environment..."
rm -f test-env*.html 2>/dev/null || true

log_success "✅ File di test obsoleti rimossi"

# FASE 4: RIMOZIONE FILE DI DEPLOY OBSOLETI
echo ""
log_info "📦 FASE 4: Rimozione file di deploy obsoleti..."

# Rimuovi file zip di deploy
log_info "🗑️  Rimozione file zip di deploy..."
rm -f performance-prime-deploy*.zip 2>/dev/null || true

# Rimuovi file Lovable deploy
log_info "🗑️  Rimozione file Lovable deploy..."
rm -f lovable-deploy.* 2>/dev/null || true

# Rimuovi configurazioni obsolete
log_info "🗑️  Rimozione configurazioni obsolete..."
rm -f lovable.json 2>/dev/null || true
rm -f components.json 2>/dev/null || true
rm -f apply-waiting-list-migration.sql 2>/dev/null || true

log_success "✅ File di deploy obsoleti rimossi"

# FASE 5: RIMOZIONE LANDING PAGES DUPLICATE
echo ""
log_info "🏠 FASE 5: Rimozione landing pages duplicate..."

# Rimuovi directory landing duplicate
if [ -d "src/landing" ]; then
    log_info "🗑️  Rimozione directory src/landing..."
    rm -rf src/landing 2>/dev/null || true
fi

if [ -d "src/landing-old" ]; then
    log_info "🗑️  Rimozione directory src/landing-old..."
    rm -rf src/landing-old 2>/dev/null || true
fi

log_success "✅ Landing pages duplicate rimosse"

# FASE 6: PULIZIA FILE TEMPORANEI
echo ""
log_info "🧽 FASE 6: Pulizia file temporanei..."

# Rimuovi file temporanei
log_info "🗑️  Rimozione file temporanei..."
rm -f .DS_Store 2>/dev/null || true
rm -f *.tmp 2>/dev/null || true
rm -f *.log 2>/dev/null || true

log_success "✅ File temporanei rimossi"

# FASE 7: VERIFICA E STATISTICHE
echo ""
log_info "📊 FASE 7: Verifica e statistiche..."

# Conta file rimanenti
REMAINING_FILES=$(find . -type f -name "*.md" -o -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.html" -o -name "*.css" | grep -v node_modules | wc -l)

# Calcola spazio liberato (approssimativo)
BACKUP_SIZE=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1 || echo "0B")

echo ""
log_success "🎯 CLEANUP COMPLETATO CON SUCCESSO!"
echo "=========================================="
echo ""
echo "📊 STATISTICHE FINALI:"
echo "   • File rimanenti: $REMAINING_FILES"
echo "   • Spazio liberato: ~$BACKUP_SIZE"
echo "   • Backup salvato in: $BACKUP_DIR"
echo ""

# FASE 8: VERIFICA INTEGRITÀ
echo ""
log_info "🔍 FASE 8: Verifica integrità progetto..."

# Verifica che i file essenziali siano ancora presenti
ESSENTIAL_FILES=("package.json" "src/App.tsx" "src/main.tsx" "landing-app.js" "landing-components.js")

for file in "${ESSENTIAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        log_success "✅ $file - PRESENTE"
    else
        log_error "❌ $file - MANCANTE!"
    fi
done

# Verifica struttura finale
echo ""
log_info "📁 Struttura finale del progetto:"
echo "   • src/ - Componenti React"
echo "   • landing-app.js - Landing originale"
echo "   • landing-components.js - Componenti originali"
echo "   • package.json - Dipendenze"
echo "   • README.md - Documentazione principale"

echo ""
log_success "🚀 Il progetto è ora pulito e pronto per lo sviluppo!"
echo ""
log_warning "💡 CONSIGLIO: Rivedi il backup in $BACKUP_DIR prima di eliminarlo definitivamente"
echo ""
log_info "📝 Prossimi passi:"
echo "   1. Testa l'applicazione: npm run dev"
echo "   2. Verifica che tutto funzioni correttamente"
echo "   3. Commit delle modifiche: git add . && git commit -m '🧹 Cleanup progetto - rimossi file obsoleti'"
echo "   4. Elimina il backup quando sei sicuro: rm -rf $BACKUP_DIR"

echo ""
echo "🎯 Cleanup completato il: $(date)"
echo "=========================================="

