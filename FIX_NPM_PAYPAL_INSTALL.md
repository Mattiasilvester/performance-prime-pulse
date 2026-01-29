# 🔧 Fix Installazione @paypal/react-paypal-js

## Problemi Identificati

1. **Cache npm con permessi root** - File nella cache npm di proprietà root
2. **Connessione di rete** - Impossibile raggiungere registry.npmjs.org

---

## Soluzione 1: Fix Permessi Cache npm

Esegui questo comando nel terminale per correggere i permessi della cache npm:

```bash
sudo chown -R 501:20 "/Users/mattiasilvestrelli/.npm"
```

**Nota:** Ti verrà chiesto di inserire la password. Questo comando cambia la proprietà di tutti i file nella cache npm al tuo utente.

Dopo aver eseguito il comando, verifica che funzioni:

```bash
npm cache verify
```

---

## Soluzione 2: Pulire Cache e Reinstallare

Dopo aver fixato i permessi, pulisci la cache e reinstalla:

```bash
# Pulisci cache
npm cache clean --force

# Installa PayPal SDK
npm install @paypal/react-paypal-js
```

---

## Soluzione 3: Se la Connessione Non Funziona

Se continui ad avere errori di rete (`ENOTFOUND registry.npmjs.org`):

1. **Verifica connessione internet:**
   ```bash
   ping registry.npmjs.org
   ```

2. **Prova con proxy (se necessario):**
   ```bash
   npm config set proxy http://proxy-server:port
   npm config set https-proxy http://proxy-server:port
   ```

3. **Usa registry alternativo (temporaneo):**
   ```bash
   npm install @paypal/react-paypal-js --registry https://registry.npmjs.org/
   ```

---

## Soluzione 4: Installazione Manuale (Ultima Risorsa)

Se nulla funziona, puoi aggiungere manualmente al `package.json`:

```json
{
  "dependencies": {
    "@paypal/react-paypal-js": "^8.1.3"
  }
}
```

Poi esegui:
```bash
npm install
```

---

## Verifica Installazione

Dopo l'installazione, verifica che il pacchetto sia installato:

```bash
npm list @paypal/react-paypal-js
```

Dovresti vedere la versione installata.

---

## Ordine Consigliato

1. ✅ **Prima**: Fix permessi cache (`sudo chown -R 501:20 "/Users/mattiasilvestrelli/.npm"`)
2. ✅ **Poi**: Verifica connessione internet
3. ✅ **Infine**: Installa pacchetto (`npm install @paypal/react-paypal-js`)

---

**Nota:** Il problema di rete potrebbe risolversi automaticamente quando la connessione sarà disponibile. Il problema dei permessi invece va risolto manualmente con il comando `sudo chown`.
