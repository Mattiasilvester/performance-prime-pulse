# n8n Webhook Configuration for Performance Prime

## 🎯 Webhook Endpoints Necessari

### 1. Welcome Email Webhook
**Endpoint**: `/webhook/pp-welcome-email`  
**Method**: POST  
**Description**: Invia email di benvenuto per nuovi utenti

**Payload Schema**:
```json
{
  "email": "user@example.com",
  "firstName": "Mario",
  "lastName": "Rossi",
  "userId": "uuid-string",
  "registrationDate": "2025-01-11T10:30:00Z"
}
```

**n8n Workflow**:
1. **Webhook Trigger** - Riceve payload
2. **Template Engine** - Genera HTML email
3. **Email Provider** - Invia via SMTP/SendGrid/etc
4. **Database Log** - Salva log invio

---

### 2. Password Reset Webhook
**Endpoint**: `/webhook/pp-password-reset`  
**Method**: POST  
**Description**: Invia email per reset password

**Payload Schema**:
```json
{
  "email": "user@example.com",
  "resetLink": "https://app.performanceprime.com/reset?token=abc123",
  "expiresIn": 3600,
  "firstName": "Mario"
}
```

**n8n Workflow**:
1. **Webhook Trigger** - Riceve payload
2. **Template Engine** - Genera HTML con link
3. **Email Provider** - Invia email sicura
4. **Security Log** - Log per audit

---

### 3. Email Verification Webhook
**Endpoint**: `/webhook/pp-email-verification`  
**Method**: POST  
**Description**: Invia email per verifica account

**Payload Schema**:
```json
{
  "email": "user@example.com",
  "verificationLink": "https://app.performanceprime.com/verify?token=xyz789",
  "firstName": "Mario"
}
```

**n8n Workflow**:
1. **Webhook Trigger** - Riceve payload
2. **Template Engine** - Genera HTML verifica
3. **Email Provider** - Invia email
4. **Verification Log** - Traccia stato

---

### 4. Notification Email Webhook
**Endpoint**: `/webhook/pp-notification-email`  
**Method**: POST  
**Description**: Email notifiche generiche

**Payload Schema**:
```json
{
  "email": "user@example.com",
  "type": "workout_reminder|appointment_confirmation|progress_update",
  "data": {
    "workoutName": "Upper Body",
    "scheduledTime": "2025-01-11T18:00:00Z",
    "trainerName": "Marco"
  },
  "firstName": "Mario"
}
```

**n8n Workflow**:
1. **Webhook Trigger** - Riceve payload
2. **Switch Node** - Route basato su tipo
3. **Template Engine** - Template specifico per tipo
4. **Email Provider** - Invia email
5. **Analytics** - Traccia engagement

---

## 🎨 Email Templates

### Welcome Email Template
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Benvenuto in Performance Prime</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #EEBA2B, #FFD700); padding: 20px; text-align: center;">
    <h1 style="color: #000; margin: 0;">🏋️ Performance Prime</h1>
  </div>
  
  <div style="padding: 30px; background: #f9f9f9;">
    <h2 style="color: #333;">Ciao {{firstName}}! 👋</h2>
    <p>Benvenuto in Performance Prime, la tua palestra digitale personale!</p>
    
    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="color: #EEBA2B;">🎯 Cosa puoi fare ora:</h3>
      <ul>
        <li>📊 <strong>Dashboard</strong> - Monitora i tuoi progressi</li>
        <li>💪 <strong>Allenamenti</strong> - Crea workout personalizzati</li>
        <li>📅 <strong>Appuntamenti</strong> - Prenota sessioni con trainer</li>
        <li>🤖 <strong>AI Coach</strong> - Consigli personalizzati</li>
      </ul>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="https://app.performanceprime.com/dashboard" 
         style="background: #EEBA2B; color: #000; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
        Inizia il tuo percorso
      </a>
    </div>
  </div>
  
  <div style="background: #333; color: #fff; padding: 20px; text-align: center; font-size: 12px;">
    <p>Performance Prime - La tua palestra digitale</p>
    <p>Se non hai richiesto questo account, ignora questa email.</p>
  </div>
</body>
</html>
```

### Password Reset Template
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Reset Password - Performance Prime</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #EEBA2B, #FFD700); padding: 20px; text-align: center;">
    <h1 style="color: #000; margin: 0;">🔐 Reset Password</h1>
  </div>
  
  <div style="padding: 30px; background: #f9f9f9;">
    <h2 style="color: #333;">Ciao {{firstName}}!</h2>
    <p>Hai richiesto il reset della password per il tuo account Performance Prime.</p>
    
    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #EEBA2B;">
      <p><strong>⚠️ Importante:</strong></p>
      <ul>
        <li>Questo link scade tra {{expiresIn}} minuti</li>
        <li>Usa il link solo se hai richiesto tu il reset</li>
        <li>Non condividere questo link con nessuno</li>
      </ul>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{resetLink}}" 
         style="background: #EEBA2B; color: #000; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
        Reset Password
      </a>
    </div>
    
    <p style="font-size: 12px; color: #666;">
      Se non riesci a cliccare il pulsante, copia e incolla questo link nel browser:<br>
      <a href="{{resetLink}}">{{resetLink}}</a>
    </p>
  </div>
  
  <div style="background: #333; color: #fff; padding: 20px; text-align: center; font-size: 12px;">
    <p>Performance Prime - Sicurezza Account</p>
    <p>Se non hai richiesto il reset, ignora questa email.</p>
  </div>
</body>
</html>
```

---

## 🔧 n8n Configuration

### Environment Variables
```bash
# Email Provider (es. SendGrid, Mailgun, etc.)
EMAIL_PROVIDER_API_KEY=your_api_key
EMAIL_FROM_NAME=Performance Prime
EMAIL_FROM_ADDRESS=noreply@performanceprime.com

# Database (per logging)
DATABASE_URL=your_database_url

# Security
WEBHOOK_SECRET=your_webhook_secret
```

### Webhook Security
- **Authentication**: Header `X-Webhook-Secret`
- **Rate Limiting**: Max 100 requests/minute per IP
- **Validation**: Schema validation per payload
- **Logging**: Tutti i webhook loggati per audit

### Error Handling
- **Retry Logic**: 3 tentativi con backoff esponenziale
- **Dead Letter Queue**: Email fallite salvate per retry manuale
- **Monitoring**: Alert per errori critici
- **Fallback**: Email di testo semplice se HTML fallisce

---

## 📊 Monitoring & Analytics

### Metrics da Tracciare
- **Delivery Rate**: % email inviate con successo
- **Open Rate**: % email aperte (se tracking abilitato)
- **Click Rate**: % link cliccati
- **Bounce Rate**: % email non consegnate
- **Error Rate**: % webhook falliti

### Dashboard n8n
- **Real-time**: Webhook ricevuti nell'ultima ora
- **Success Rate**: Tasso di successo per endpoint
- **Error Logs**: Ultimi errori con dettagli
- **Performance**: Tempo medio di elaborazione

---

## 🚀 Deployment

### 1. Setup n8n Instance
```bash
# Docker
docker run -it --rm --name n8n -p 5678:5678 n8nio/n8n

# O con docker-compose
version: '3.8'
services:
  n8n:
    image: n8nio/n8n
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=your_password
```

### 2. Import Workflows
- Esporta workflow da n8n
- Importa in istanza di produzione
- Configura variabili d'ambiente
- Testa tutti i webhook

### 3. Update Frontend
```typescript
// Sostituire in emailService.ts
const response = await fetch('https://your-n8n-instance.com/webhook/pp-welcome-email', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Webhook-Secret': process.env.N8N_WEBHOOK_SECRET
  },
  body: JSON.stringify({ email, firstName, lastName })
});
```

---

## ✅ Checklist Migrazione

- [ ] Setup n8n instance
- [ ] Creare 4 webhook endpoints
- [ ] Configurare email provider
- [ ] Testare tutti i webhook
- [ ] Aggiornare emailService.ts
- [ ] Testare flusso completo
- [ ] Configurare monitoring
- [ ] Deploy in produzione
- [ ] Verificare funzionamento
- [ ] Documentare per team

---

## 📞 Support

Per problemi con n8n o webhook:
- **Documentation**: https://docs.n8n.io
- **Community**: https://community.n8n.io
- **GitHub**: https://github.com/n8n-io/n8n
