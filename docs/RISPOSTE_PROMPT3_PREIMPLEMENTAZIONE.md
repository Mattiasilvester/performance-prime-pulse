# Risposte pre-implementazione PROMPT 3

## 1. Esiste già WorkoutPlanCard.tsx o componente simile?

**No.** Non esiste alcun file `WorkoutPlanCard.tsx` in app-user.  
Il piano allenamento è renderizzato **inline** in PrimeChat.tsx: un unico blocco JSX (div con gradient, titolo, descrizione, therapeuticAdvice, safetyNotes, lista esercizi, warmup/cooldown).  
L’unico file “piano” trovato è `packages/app-user/src/services/workoutPlanGenerator.ts`, che definisce tipi (`StructuredWorkoutPlan`, `StructuredExercise`) e funzioni di generazione, non componenti UI.

## 2. Esiste già download PDF per piani allenamento? jsPDF nel progetto?

**No.** In app-user non c’è nessuna funzione di download PDF per i piani e **jsPDF non è in package.json**.  
Le dipendenze attuali non includono `jspdf` né `jspdf-autotable`. Vanno installate.

## 3. Come viene renderizzato oggi m.workoutPlan in PrimeChat.tsx?

**Righe 2329-2412** (circa).  
Un unico `<div className="mt-4 bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-[#EEBA2B] rounded-xl p-4">` che contiene:
- Titolo: `m.workoutPlan.name`
- Descrizione (se presente)
- Blocco “Consigli per il tuo dolore” (therapeuticAdvice)
- Blocco “Nota di sicurezza” (safetyNotes)
- Info: durata, numero esercizi, difficulty
- Lista esercizi con ExerciseGifLink (nome, set/rep, recupero, note)
- Warmup e Cooldown (se presenti)

Non c’è un componente card separato e **non c’è alcun bottone “Scarica PDF”**.

## 4. Come viene renderizzato m.nutritionPlan (aggiunto in Prompt 2)?

**Righe 2417-2456** (circa).  
Anch’esso è **testo formattato inline** nello stesso stile (stesso div gradient/oro): nome, descrizione, obiettivo, calorie, giorni (solo primi 3 con `.slice(0, 3)`), allergie, consigli, note finali.  
Non è un componente card separato; non ci sono accordion né bottoni Scarica/Elimina.

---

## Esito implementazione PROMPT 3

- **NutritionPlanCard** creata e usata in PrimeChat al posto del blocco inline.
- **downloadNutritionPlanPDF** e **downloadWorkoutPlanPDF** in `packages/app-user/src/utils/pdfExport.ts` (con `import 'jspdf-autotable'` e `(doc as any).autoTable`).
- Bottone **Scarica PDF** aggiunto al blocco inline del piano allenamento in PrimeChat.
- **Elimina piano**: rimuove il messaggio dalla chat; se in futuro il messaggio avrà `planId` (es. restituito da `getStructuredNutritionPlan`), la card potrà anche eliminare il record da `nutrition_plans`.
- **Build:** `pnpm build:user` → 0 errori TypeScript, build completata in ~5.6s.
