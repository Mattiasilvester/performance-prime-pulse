# ANALISI — Bug intermittente pagina Profilo (PrimePro)
**Data:** 16 Febbraio 2026  
**Scope:** `packages/app-pro/src/pages/partner/dashboard/ProfiloPage.tsx` e componenti collegati (SpecializzazioniModal da Impostazioni).  
**Obiettivo:** Individuare cause possibili del bug per cui a volte non si riesce a modificare/salvare dati.  
**Nessuna modifica al codice:** solo analisi.

---

## 1. FETCH PROFILO E GESTIONE ERRORI

### 1.1 `loadProfile` — comportamento del `finally`
- **File:** `ProfiloPage.tsx`  
- **Righe:** 74–101  

Se `getUser()` restituisce `!user` oppure la query restituisce `!data`, la funzione fa `return` **senza** eseguire `setLoading(false)` (che è solo nel `finally` dopo il `try`). In quei rami il `finally` non viene raggiunto perché c’è un `return` prima.

- **Conseguenza:** La pagina resta in loading (skeleton) a tempo indefinito.
- **Rischio:** ALTO — spiega “a volte non riesco a modificare”: in realtà il profilo non è mai stato caricato e l’utente vede solo lo skeleton.

**Dettaglio:**  
- Riga 77–80: `if (!user) { toast.error(...); return; }` → niente `setLoading(false)`.  
- Riga 89–92: `if (!data) { toast.error(...); return; }` → niente `setLoading(false)`.

In JavaScript il `finally` viene eseguito anche in caso di `return` nel `try`. Quindi `setLoading(false)` viene sempre chiamato. Nessun bug qui.

---

### 1.2 Pagina “Profilo non trovato” senza reload
- **File:** `ProfiloPage.tsx`  
- **Righe:** 282–288  

Se `!profile` dopo il load, si mostra “Profilo non trovato” e non c’è pulsante o azione per ritentare il caricamento.

- **Rischio:** MEDIO — UX: l’utente non può recuperare senza ricaricare la pagina.

---

## 2. SALVATAGGIO (saveEdit) E FEEDBACK

### 2.1 Return silenzioso se utente non autenticato
- **File:** `ProfiloPage.tsx`  
- **Righe:** 162–164  

Dopo `getUser()`, se `!user` la funzione fa `return` senza:
- toast di errore
- messaggio all’utente

- **Conseguenza:** L’utente clicca “Salva”, non succede nulla, nessun feedback.
- **Rischio:** ALTO — tipico “salvataggio che a volte non fa niente” (sessione scaduta o problema auth).

---

### 2.2 Update Supabase: 0 righe modificate non gestito
- **File:** `ProfiloPage.tsx`  
- **Righe:** 166–173  

Si fa `update(updateData).eq('user_id', user.id)`. Se non esiste una riga con quel `user_id` (trigger mancato, migrazione, altro), Supabase può restituire **nessun errore** anche con 0 righe aggiornate. Il codice considera successo se `!error` e mostra “Modifica salvata con successo”.

- **Conseguenza:** Toast di successo ma nessun dato salvato in DB.
- **Rischio:** ALTO — comportamento intermittente se per alcuni utenti/sessioni la riga in `professionals` manca o non è trovata.

---

### 2.3 `prezzo_seduta`: possibile invio di `NaN`
- **File:** `ProfiloPage.tsx`  
- **Righe:** 150–153  

`valueToSave` per `prezzo_seduta` è `editValue ? parseInt(editValue) : null`. Se l’utente inserisce testo non numerico (es. “abc”), `parseInt(editValue)` è `NaN`. Non c’è controllo su `NaN` prima di mandare l’update.

- **Conseguenza:** Invio di `NaN` a Supabase (comportamento/errore dipendente dal DB).
- **Rischio:** MEDIO — il campo prezzo in ProfiloPage non è stato trovato in questa analisi; se viene usato altrove (es. Impostazioni) con lo stesso `saveEdit`, il rischio resta.

---

### 2.4 Validazione P.IVA / CAP non blocca il salvataggio
- **File:** `ProfiloPage.tsx`  
- **Righe:** 154–158, 125–144  

`validateVatNumber` e `validatePostalCode` mostrano solo `toast.warning` e restituiscono true/false. Il risultato **non** viene usato per interrompere il salvataggio: anche con validazione fallita si procede con l’update.

- **Rischio:** BASSO — coerente con “warning che non bloccano”, ma può confondere se l’utente si aspetta che dati “errati” non vengano salvati.

---

## 3. STATO LOCALE E INPUT

### 3.1 `editValue` per select Categoria
- **File:** `ProfiloPage.tsx`  
- **Righe:** 858–861, 106–113  

`startEdit('category', profile.category)` imposta `editValue` con `String(value || '')`. Se `profile.category` è `null`/`undefined`, `editValue` diventa `''`. Il `<select value={editValue}>` non ha un’opzione con `value=""`, quindi la select può apparire vuota o mostrare la prima option senza che il valore salvato sia coerente.

- **Conseguenza:** Possibile salvataggio di stringa vuota per `category` se l’utente salva senza cambiare la select.
- **Rischio:** MEDIO — dipende dal fatto che `category` possa essere null in DB; se sì, il bug è rilevante.

---

### 3.2 Annulla specializzazioni (inline) non resetta `newSpecInput`
- **File:** `ProfiloPage.tsx`  
- **Righe:** 924–930  

In modifica specializzazioni, “Annulla” fa solo `setEditingField(null)` e `setSpecializations([])`, **senza** `setNewSpecInput('')`.

- **Conseguenza:** Alla successiva apertura della modifica specializzazioni, `newSpecInput` potrebbe ancora contenere il testo precedente (poi resettato da `startEdit` solo quando si clicca sulla matita).
- **Rischio:** BASSO — stato residuo, possibile confusione minore.

---

### 3.3 Dopo `saveEdit` non si resetta `newTitoloInput`
- **File:** `ProfiloPage.tsx`  
- **Righe:** 173–179  

Dopo un salvataggio riuscito si chiamano `setEditingField(null)`, `setEditValue('')`, `setEditTitoli([])` ma **non** `setNewTitoloInput('')`.

- **Rischio:** BASSO — alla prossima apertura di “Titolo di studio”, `startEdit` imposta `setNewTitoloInput('')`, quindi l’impatto è solo su stato intermedio.

---

## 4. VALORI NULL / TIPI E OPERAZIONI PERICOLOSE

### 4.1 `startEdit('titolo_studio', value)` con valore non-array
- **File:** `ProfiloPage.tsx`  
- **Riga:** 109  

`setEditTitoli(Array.isArray(value) ? [...value] : (value && String(value).trim() ? [String(value).trim()] : []))` gestisce correttamente `null`/`undefined` (risultato `[]`). Se da Supabase arrivasse una stringa (es. JSON non parsato), verrebbe trattata come singolo elemento: possibile ma gestito.

- **Rischio:** BASSO — solo da verificare che il tipo di `titolo_studio` dal DB sia sempre array o null.

---

### 4.2 `profile.specializzazioni` e `profile.titolo_studio` in lettura
- **File:** `ProfiloPage.tsx`  

Uso di `profile.specializzazioni && profile.specializzazioni.length > 0` e `profile.titolo_studio && profile.titolo_studio.length > 0` prima di `.map`/`.join`: null/undefined sono gestiti.

- **Rischio:** Nessuno per null/undefined. Resta da assicurarsi che il tipo restituito da Supabase (array vs stringa) sia sempre coerente con l’uso.

---

### 4.3 Validatori: `value.trim()` su string
- **File:** `ProfiloPage.tsx`  
- **Righe:** 126, 136  

`validateVatNumber` e `validatePostalCode` ricevono `String(valueToSave)` solo quando `valueToSave != null`, quindi non si chiama `.trim()` su null.

- **Rischio:** Nessuno.

---

## 5. SALVATAGGIO SPECIALIZZAZIONI (INLINE)

### 5.1 Return silenzioso se utente non autenticato
- **File:** `ProfiloPage.tsx`  
- **Righe:** 259–264  

In `saveSpecializations`, se `!user` si fa `return` senza toast né messaggio.

- **Conseguenza:** Stesso effetto di 2.1: “Salva” senza alcun feedback.
- **Rischio:** ALTO.

---

### 5.2 Stesso problema update a 0 righe
- **File:** `ProfiloPage.tsx`  
- **Righe:** 264–272  

Stessa logica di 2.2: nessun controllo su quante righe siano state aggiornate; possibile “successo” con 0 righe modificate.

- **Rischio:** ALTO.

---

## 6. UPLOAD FOTO

### 6.1 Estensione file assente
- **File:** `ProfiloPage.tsx`  
- **Righe:** 209–211  

`const fileExt = file.name.split('.').pop();` — se `file.name` non contiene `.` (es. "file"), `.pop()` è `undefined`. Il nome su storage diventa `...${fileExt}` → `".undefined"`.

- **Rischio:** MEDIO — upload può andare a buon fine ma con nome file anomalo; possibili problemi lato storage o lettura.

---

### 6.2 Return silenzioso se `!user` dopo get user
- **File:** `ProfiloPage.tsx`  
- **Righe:** 204–206  

Se dopo `getUser()` risulta `!user`, si fa `return` senza toast. L’utente non capisce perché l’upload “non fa niente”.

- **Rischio:** MEDIO.

---

## 7. MODAL SPECIALIZZAZIONI (Impostazioni)

### 7.1 Loading non resettato se `!user?.id`
- **File:** `SpecializzazioniModal.tsx`  
- **Righe:** 36–38  

In `fetchSpecializzazioni`, se `!user?.id` la funzione fa `return` senza mai chiamare `setLoading(false)` (il `finally` è alle righe 54–56 ma non viene raggiunto).

- **Conseguenza:** Il modal resta in stato di caricamento (spinner) a tempo indefinito.
- **Rischio:** ALTO — “a volte non riesco a modificare le specializzazioni” dall’Impostazioni.

---

### 7.2 Salvataggio e stato
- **File:** `SpecializzazioniModal.tsx`  
- **Righe:** 87–115  

Try/catch e toast di errore ci sono. Dopo il successo si chiama `onSuccess()` e `onClose()`. Non si può dire se `onSuccess` aggiorna il profilo nella pagina che ha aperto il modal (dipende da ImpostazioniPage): da verificare se ProfiloPage e Impostazioni condividono lo stesso stato profilo o se c’è rischio di dati “stale”.

- **Rischio:** BASSO per il modal in sé; MEDIO se l’utente ha sia Profilo che Impostazioni aperti e si aspetta coerenza.

---

## 8. RIEPILOGO RISCHI PER “BUG INTERMITTENTE”

| # | File | Riga/e | Problema | Rischio |
|---|------|--------|----------|---------|
| 1 | ProfiloPage.tsx | 162–164 | `saveEdit`: `!user` → return senza toast | **ALTO** |
| 3 | ProfiloPage.tsx | 166–173 | Update Supabase: nessun check su 0 righe → successo falso | **ALTO** |
| 4 | ProfiloPage.tsx | 259–264 | `saveSpecializations`: `!user` → return senza toast | **ALTO** |
| 5 | ProfiloPage.tsx | 264–272 | Stesso problema 0 righe per specializzazioni | **ALTO** |
| 6 | SpecializzazioniModal.tsx | 36–38 | Fetch: `!user?.id` → return senza `setLoading(false)` (return è prima del try/finally) | **ALTO** |
| 7 | ProfiloPage.tsx | 150–153 | `prezzo_seduta`: possibile `NaN` inviato al DB | MEDIO |
| 8 | ProfiloPage.tsx | 858–861, 111 | Select category con `editValue === ''` se category null | MEDIO |
| 9 | ProfiloPage.tsx | 209–211 | Estensione file foto: `.pop()` può essere undefined | MEDIO |
| 10 | ProfiloPage.tsx | 204–206 | Upload foto: `!user` → return senza toast | MEDIO |
| 11 | ProfiloPage.tsx | 282–288 | “Profilo non trovato” senza azione di retry | MEDIO |
| 12 | ProfiloPage.tsx | 924–930 | Annulla specializzazioni: `newSpecInput` non resettato | BASSO |
| 13 | ProfiloPage.tsx | 173–179 | Dopo saveEdit: `newTitoloInput` non resettato | BASSO |

---

## 9. RACCOMANDAZIONI PER IL FIX (da applicare in un secondo momento)

1. **saveEdit / saveSpecializations:** se `!user`, mostrare toast di errore (es. “Sessione scaduta. Effettua di nuovo l’accesso.”) invece di uscire in silenzio.
2. **Update Supabase:** dove serve, controllare il numero di righe aggiornate (o usare una risposta che lo indichi) e, in caso di 0 righe, mostrare errore e non “Modifica salvata con successo”.
3. **prezzo_seduta:** validare `parseInt(editValue)` (o usare `Number(editValue)`) e non inviare mai `NaN`; eventualmente mostrare errore all’utente.
4. **Categoria:** in `startEdit('category', ...)` usare un default (es. `'pt'`) se `profile.category` è null/undefined, così la select ha sempre un valore valido.
5. **SpecializzazioniModal:** in `fetchSpecializzazioni`, chiamare `setLoading(false)` anche nel ramo `if (!user?.id) return` (es. prima del return o in un finally).
6. **Upload foto:** gestire il caso in cui `file.name` non contenga `.` (estensione assente) e usare un default (es. `"jpg"`) o rifiutare il file con toast.
7. **Profilo non trovato:** aggiungere pulsante “Riprova” che richiama `loadProfile()`.

Fine analisi. Nessuna modifica al codice è stata applicata.
