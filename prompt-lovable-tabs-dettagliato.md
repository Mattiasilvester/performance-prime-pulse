# PROMPT DETTAGLIATO PER LOVABLE - CODICE TAB FILTRI

Copia e incolla questo prompt completo in Lovable:

---

## 🎯 RICHIESTA CODICE TAB FILTRI COMPLETO

Ciao! Sto replicando lo stile dei tab filtri che hai implementato e ho bisogno del codice esatto.

### 📍 SEZIONE DA COPIARE

La sezione con i tab filtri che contiene:
- Tab "Ultimi 7 giorni" (attivo con sfondo nero)
- Tab "Ultimi 30 giorni" (inattivo con sfondo grigio)
- Tab "⭐ In evidenza" (inattivo con sfondo grigio)

### 🎨 DETTAGLI VISIVI RICHIESTI

**Tab Attivo (selezionato):**
- Sfondo: nero solido (#000000 o bg-black)
- Testo: bianco in grassetto
- Bordo: grigio scuro sottile (border-gray-600 o simile)
- Forma: pill arrotondata (rounded-full)

**Tab Inattivi (non selezionati):**
- Sfondo: grigio scuro (bg-gray-800/50 o simile)
- Testo: grigio chiaro (text-gray-400 o simile)
- Nessun bordo
- Forma: pill arrotondata (rounded-full)

**Container TabsList:**
- Sfondo: grigio scuro uniforme
- Padding interno
- Gap tra i tab

### 📋 COSA MI SERVE (IN ORDINE DI PRIORITÀ)

1. **Codice completo del componente Tabs**
   ```tsx
   <Tabs value={...} onValueChange={...}>
     <TabsList className="...">
       <TabsTrigger value="7days" className="...">
         Ultimi 7 giorni
       </TabsTrigger>
       <TabsTrigger value="30days" className="...">
         Ultimi 30 giorni
       </TabsTrigger>
       <TabsTrigger value="highlighted" className="...">
         ⭐ In evidenza
       </TabsTrigger>
     </TabsList>
   </Tabs>
   ```

2. **Tutte le classi Tailwind CSS complete** per:
   - `<TabsList>` (tutte le classi)
   - `<TabsTrigger>` (tutte le classi per ogni tab)

3. **Eventuali stili custom CSS** se presenti (file CSS separato o stili inline)

4. **Nome del file** dove si trova questo codice

5. **Eventuali varianti responsive** (mobile/desktop) se presenti

### 🔍 DOVE CERCARE

Il codice potrebbe essere in:
- Un componente React (`.tsx` o `.jsx`)
- Una pagina (es. `DiaryPage.tsx`, `NotesPage.tsx`, ecc.)
- Un componente riutilizzabile (es. `FilterTabs.tsx`)

### ✅ OUTPUT ATTESO

Per favore, incolla qui il codice completo così strutturato:

```
FILE: [nome file]

CODICE COMPLETO:
[qui il codice completo della sezione Tabs]

CLASSI CSS CUSTOM (se presenti):
[qui eventuali CSS custom]

NOTE AGGIUNTIVE:
[eventuali note o spiegazioni]
```

### 🎯 ESEMPIO OUTPUT IDEALE

```
FILE: src/pages/diary/DiaryPage.tsx

CODICE COMPLETO:
<Tabs value={filterMode} onValueChange={(v) => setFilterMode(v as FilterMode)}>
  <TabsList className="w-full justify-start overflow-x-auto flex-nowrap gap-2 bg-gray-800/50 p-1 rounded-lg">
    <TabsTrigger 
      value="7days"
      className="rounded-full px-4 py-2 data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:border data-[state=active]:border-gray-600 data-[state=inactive]:bg-gray-800/50 data-[state=inactive]:text-gray-400 border-0"
    >
      Ultimi 7 giorni
    </TabsTrigger>
    <TabsTrigger 
      value="30days"
      className="rounded-full px-4 py-2 data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:border data-[state=active]:border-gray-600 data-[state=inactive]:bg-gray-800/50 data-[state=inactive]:text-gray-400 border-0"
    >
      Ultimi 30 giorni
    </TabsTrigger>
    <TabsTrigger 
      value="highlighted"
      className="rounded-full px-4 py-2 data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:border data-[state=active]:border-gray-600 data-[state=inactive]:bg-gray-800/50 data-[state=inactive]:text-gray-400 border-0"
    >
      ⭐ In evidenza
    </TabsTrigger>
  </TabsList>
</Tabs>
```

Grazie mille! 🚀

---

