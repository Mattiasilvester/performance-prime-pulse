#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROMPT_FILE = path.join(__dirname, '..', 'PROMPT_MASTER_CURRENT.md');
const ARCHIVE_DIR = path.join(__dirname, '..', '..', 'prompts_archive');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('');
console.log('🌙 CHIUSURA SESSIONE PERFORMANCE PRIME');
console.log('='.repeat(50));
console.log('');
console.log('📝 Incolla gli aggiornamenti da Cursor');
console.log('   (task completati, modifiche, note)');
console.log('   Premi Ctrl+D quando finito:');
console.log('');

let updates = '';

rl.on('line', (line) => {
  updates += line + '\n';
});

rl.on('close', () => {
  if (updates.trim()) {
    // Backup del file corrente
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(ARCHIVE_DIR, `session-${timestamp}.md`);
    
    if (fs.existsSync(PROMPT_FILE)) {
      let content = fs.readFileSync(PROMPT_FILE, 'utf8');
      
      // Aggiungi aggiornamenti alla sezione STATO SESSIONE
      const sessionUpdate = `
## 📌 AGGIORNAMENTI SESSIONE ${new Date().toLocaleString()}
${updates}

---`;
      
      // Inserisci prima della fine del file
      content = content.replace(
        /---\nPROMPT MASTER/,
        `${sessionUpdate}\n---\nPROMPT MASTER`
      );
      
      // Salva backup
      fs.writeFileSync(backupFile, content);
      
      // Aggiorna file corrente
      fs.writeFileSync(PROMPT_FILE, content);
      
      console.log('');
      console.log('✅ Sessione salvata con successo!');
      console.log(`📁 Backup: ${backupFile}`);
      console.log('');
    }
  } else {
    console.log('');
    console.log('⚠️  Nessun aggiornamento ricevuto');
    console.log('');
  }
  
  process.exit(0);
});
