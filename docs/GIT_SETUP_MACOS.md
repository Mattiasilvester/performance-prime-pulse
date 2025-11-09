# GIT Setup macOS 14/15 – Fix SSL Certificates

## Obiettivo
Ripristinare la possibilità di usare `git push` su macOS 14/15 quando Git non riesce più a trovare i certificati di sistema (`error setting certificate verify locations`).

## Passaggi

### 1. Generare un nuovo bundle certificati
```bash
mkdir -p ~/.config/git
security find-certificate -a -p /System/Library/Keychains/SystemRootCertificates.keychain > ~/.config/git/cacert.pem
```
> Il file risultante pesa ~230 KB e contiene tutte le CA di sistema.

### 2. Configurare Git a usare il bundle
```bash
git config --global http.sslCAinfo ~/.config/git/cacert.pem
git config --global credential.helper osxkeychain
```
- `http.sslCAinfo` punta al nuovo bundle
- `credential.helper osxkeychain` salva i token nel portachiavi di macOS

### 3. Verificare la configurazione
```bash
git config --global --list | grep -E "(ssl|credential)"
```
Dovresti vedere:
```
http.sslcainfo=/Users/<utente>/.config/git/cacert.pem
credential.helper=osxkeychain
```

### 4. Testare la connessione a GitHub
```bash
git ls-remote https://github.com/github/gitignore.git
```
Il comando deve restituire l’elenco dei branch/tags. In caso contrario:
- Controlla di aver copiato bene il percorso del file `cacert.pem`
- Assicurati che il file non sia vuoto (`ls -lh ~/.config/git/cacert.pem`)

### 5. Effettuare un push di prova
```bash
echo "# Test Git" > TEST_SSL.md
git add TEST_SSL.md
git commit -m "test: verifica certificati"
git push origin main
git rm TEST_SSL.md
git commit -m "chore: clean test"
git push origin main
```

## Troubleshooting
- **Errore CAfile non trovato** → Rigenera il bundle (passo 1) e verifica permessi cartella `~/.config/git`
- **Errore credenziali** → Esegui `git config --global credential.helper osxkeychain` e ripeti il push inserendo il PAT
- **Lavori in sandbox (es. Cursor)** → Potresti dover eseguire il passo 1 dal Terminale di macOS e poi riaprire Cursor

## Stato finale
- Git push funzionante da Terminal macOS e da Cursor
- Repository `performance-prime-pulse` sincronizzato sul branch `main`
