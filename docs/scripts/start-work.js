#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROMPT_FILE = path.join(__dirname, '..', 'PROMPT_MASTER_CURRENT.md');
const ARCHIVE_DIR = path.join(__dirname, '..', '..', 'prompts_archive');

// Crea directory archivio se non esiste
if (!fs.existsSync(ARCHIVE_DIR)) {
  fs.mkdirSync(ARCHIVE_DIR, { recursive: true });
}

// Leggi il prompt master
if (fs.existsSync(PROMPT_FILE)) {
  const content = fs.readFileSync(PROMPT_FILE, 'utf8');
  
  // Aggiorna data sessione
  const now = new Date().toISOString();
  const updatedContent = content.replace(
    /- Data: \[.*\]/,
    `- Data: ${now}`
  );
  
  fs.writeFileSync(PROMPT_FILE, updatedContent);
  
  console.log('');
  console.log('='.repeat(80));
  console.log('---START PROMPT MASTER PERFORMANCE PRIME---');
  console.log('='.repeat(80));
  console.log('');
  console.log(updatedContent);
  console.log('');
  console.log('='.repeat(80));
  console.log('---END PROMPT MASTER PERFORMANCE PRIME---');
  console.log('='.repeat(80));
  console.log('');
  console.log('📋 ISTRUZIONI:');
  console.log('1. Copia tutto dal ---START--- al ---END---');
  console.log('2. Incolla in Cursor');
  console.log('3. Aspetta conferma: "✅ SISTEMA INIZIALIZZATO"');
  console.log('');
} else {
  console.error('❌ File PROMPT_MASTER_CURRENT.md non trovato!');
  process.exit(1);
}
