# Configurazione Redirect URL per Reset Password (PrimePro)

Per far funzionare il flusso **Password dimenticata** in PrimePro, in Supabase va configurato il redirect dopo il click sul link nell’email.

## Dove configurarlo

**Supabase Dashboard** → **Authentication** → **URL Configuration** → **Redirect URLs**

## URL da aggiungere

Aggiungi questo URL alla lista **Redirect URLs**:

- **Produzione:** `https://pro.performanceprime.it/partner/update-password`  
  (oppure il dominio effettivo dell’app PrimePro, se diverso)

- **Locale (opzionale):** `http://localhost:5173/partner/update-password`

## Cosa fa il flusso

1. Il professionista clicca "Password dimenticata" nella pagina di login.
2. Inserisce l’email e riceve il link da Supabase.
3. Cliccando il link viene reindirizzato a `/partner/update-password` (questa pagina).
4. Inserisce la nuova password e conferma → la password viene aggiornata e viene reindirizzato al login.

Se l’URL di redirect non è presente in **Redirect URLs**, Supabase può reindirizzare alla default (es. login) e il flusso non funziona.

---

*Documentazione per Marco/Mattia – configurare una sola volta in Supabase.*
