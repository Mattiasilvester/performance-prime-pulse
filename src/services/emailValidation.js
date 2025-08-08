// services/emailValidation.js

class EmailValidationService {
  constructor() {
    // Lista domini disposable più comuni (aggiornata regolarmente)
    this.disposableDomains = new Set([
      // Servizi email temporanee più popolari
      '10minutemail.com', '10minutemail.net', '10minutemail.org',
      'guerrillamail.com', 'guerrillamail.net', 'guerrillamail.org',
      'guerrillamailblock.com', 'guerrillamail.biz', 'guerrillamail.de',
      'mailinator.com', 'mailinator.net', 'mailinator.org', 'mailinator2.com',
      'tempmail.com', 'temp-mail.org', 'temp-mail.io', 'temp-mail.de',
      'throwaway.email', 'throwawaymail.com', 'throwawaydomain.com',
      'yopmail.com', 'yopmail.fr', 'yopmail.net',
      'trashmail.com', 'trashmail.net', 'trashmail.org', 'trashmail.de',
      'sharklasers.com', 'spam4.me', 'spambox.us', 'spamcowboy.com',
      'mytrashmail.com', 'mt2009.com', 'mt2014.com', 'mt2015.com',
      'emailondeck.com', 'getnada.com', 'inboxkitten.com',
      'dispostable.com', 'disposemail.com', 'disposableemailaddresses.com',
      'fakeinbox.com', 'fakemailgenerator.com', 'emailfake.com',
      'maildrop.cc', 'mailnesia.com', 'mailslurp.com',
      'mohmal.com', 'mohmal.im', 'mohmal.tech',
      'crazymailing.com', 'emailsensei.com', 'imgof.com',
      'letthemeatspam.com', 'mailexpire.com', 'mailforspam.com',
      'mailscrap.com', 'mailseal.de', 'mailtemp.info',
      'migmail.pl', 'mint.lgbt', 'mytemp.email',
      'nada.email', 'nincsmail.hu', 'noclickemail.com',
      'nwldx.com', 'opayq.com', 'poofy.org',
      'quickinbox.com', 'rcpt.at', 'ruu.kr',
      'spamdecoy.net', 'spamex.com', 'spamfree24.org',
      'spamgourmet.com', 'spamherelots.com', 'spamhereplease.com',
      'spamhole.com', 'spamify.com', 'spaminator.de',
      'spamkill.info', 'spaml.com', 'spammotel.com',
      'spamnot.org', 'spamoff.de', 'spamslicer.com',
      'spamspot.com', 'spamthis.co.uk', 'spamthisplease.com',
      'spamtrail.com', 'speed.1s.fr', 'spoofmail.de',
      'tafmail.com', 'teleworm.us', 'tempemail.co.za',
      'tempemail.net', 'tempinbox.co.uk', 'tempinbox.com',
      'tempmail.it', 'tempmail2.com', 'tempmailer.com',
      'tempomail.fr', 'temporarily.de', 'temporarioemail.com.br',
      'temporaryemail.net', 'temporaryemail.us', 'temporaryinbox.com',
      'thanksnospam.info', 'thankyou2010.com', 'thecloudindex.com',
      'thelimestones.com', 'thisisnotmyrealemail.com', 'throam.com',
      // Altri servizi comuni
      'mailnesia.com', 'maildrop.cc', 'mohmal.com',
      'crazymailing.com', 'emailsensei.com', 'imgof.com',
      'letthemeatspam.com', 'mailexpire.com', 'mailforspam.com',
      'mailscrap.com', 'mailseal.de', 'mailtemp.info',
      'migmail.pl', 'mint.lgbt', 'mytemp.email',
      'nada.email', 'nincsmail.hu', 'noclickemail.com',
      'nwldx.com', 'opayq.com', 'poofy.org',
      'quickinbox.com', 'rcpt.at', 'ruu.kr',
      'spamdecoy.net', 'spamex.com', 'spamfree24.org',
      'spamgourmet.com', 'spamherelots.com', 'spamhereplease.com',
      'spamhole.com', 'spamify.com', 'spaminator.de',
      'spamkill.info', 'spaml.com', 'spammotel.com',
      'spamnot.org', 'spamoff.de', 'spamslicer.com',
      'spamspot.com', 'spamthis.co.uk', 'spamthisplease.com',
      'spamtrail.com', 'speed.1s.fr', 'spoofmail.de',
      'tafmail.com', 'teleworm.us', 'tempemail.co.za',
      'tempemail.net', 'tempinbox.co.uk', 'tempinbox.com',
      'tempmail.it', 'tempmail2.com', 'tempmailer.com',
      'tempomail.fr', 'temporarily.de', 'temporarioemail.com.br',
      'temporaryemail.net', 'temporaryemail.us', 'temporaryinbox.com',
      'thanksnospam.info', 'thankyou2010.com', 'thecloudindex.com',
      'thelimestones.com', 'thisisnotmyrealemail.com', 'throam.com'
    ]);
    
    // Pattern sospetti
    this.suspiciousPatterns = [
      /^test\d*@/i,
      /^temp\d*@/i,
      /^fake\d*@/i,
      /^disposable\d*@/i,
      /^throwaway\d*@/i,
      /^spam\d*@/i,
      /^trash\d*@/i,
      /\+temp\d*@/i,
      /\+test\d*@/i,
      /^demo\d*@/i,
      /^example\d*@/i,
      /^sample\d*@/i,
      /^user\d*@/i,
      /^admin\d*@/i,
      /^info\d*@/i,
      /^contact\d*@/i,
      /^support\d*@/i,
      /^help\d*@/i,
      /^service\d*@/i,
      /^sales\d*@/i
    ];
    
    // Cache per risultati API (evita chiamate duplicate)
    this.validationCache = new Map();
    this.cacheTimeout = 24 * 60 * 60 * 1000; // 24 ore
    
    // Inizializza aggiornamento lista
    this.updateDisposableList();
  }
  
  /**
   * Validazione completa multi-livello
   */
  async validateEmail(email) {
    const normalizedEmail = email.toLowerCase().trim();
    
    // Check cache
    const cached = this.getCachedResult(normalizedEmail);
    if (cached !== null) {
      return cached;
    }
    
    const result = {
      valid: false,
      email: normalizedEmail,
      checks: {
        format: false,
        disposable: false,
        dns: false,
        smtp: false,
        reputation: false
      },
      errors: [],
      warnings: [],
      score: 0, // 0-100, dove 100 è perfetto
      timestamp: Date.now()
    };
    
    try {
      // LIVELLO 1: Validazione formato
      result.checks.format = this.validateFormat(normalizedEmail);
      if (!result.checks.format) {
        result.errors.push('Formato email non valido');
        result.score = 0;
        return this.cacheAndReturn(normalizedEmail, result);
      }
      result.score += 20;
      
      // LIVELLO 2: Check domini disposable
      result.checks.disposable = !this.isDisposableEmail(normalizedEmail);
      if (!result.checks.disposable) {
        result.errors.push('Email temporanea o disposable non permessa');
        result.score = Math.max(0, result.score - 50);
        return this.cacheAndReturn(normalizedEmail, result);
      }
      result.score += 20;
      
      // LIVELLO 3: Validazione DNS (MX records)
      result.checks.dns = await this.validateDNS(normalizedEmail);
      if (!result.checks.dns) {
        result.errors.push('Dominio email non valido o inesistente');
        result.score = Math.max(0, result.score - 30);
        return this.cacheAndReturn(normalizedEmail, result);
      }
      result.score += 20;
      
      // LIVELLO 4: Validazione API esterna (se configurata)
      if (process.env.REACT_APP_EMAIL_VALIDATION_API_KEY) {
        const apiValidation = await this.validateWithAPI(normalizedEmail);
        result.checks.smtp = apiValidation.deliverable || false;
        result.checks.reputation = apiValidation.reputation_score > 0.7;
        
        if (!result.checks.smtp) {
          result.warnings.push('Email potrebbe non essere raggiungibile');
          result.score = Math.max(0, result.score - 20);
        } else {
          result.score += 20;
        }
        
        if (!result.checks.reputation) {
          result.warnings.push('Bassa reputazione del dominio email');
          result.score = Math.max(0, result.score - 10);
        } else {
          result.score += 20;
        }
      }
      
      // Risultato finale
      result.valid = result.score >= 40; // Soglia minima di accettazione
      
    } catch (error) {
      console.error('Errore validazione email:', error);
      result.errors.push('Errore durante la validazione');
      result.valid = false;
    }
    
    return this.cacheAndReturn(normalizedEmail, result);
  }
  
  /**
   * Validazione formato email con regex avanzato
   */
  validateFormat(email) {
    // RFC 5322 compliant regex
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    
    if (!emailRegex.test(email)) {
      return false;
    }
    
    // Check lunghezza
    if (email.length > 254) { // Max length per RFC
      return false;
    }
    
    // Check local part (prima di @)
    const [localPart, domain] = email.split('@');
    if (localPart.length > 64) { // Max length local part
      return false;
    }
    
    // Check domini con solo numeri (spesso spam)
    if (/^\d+\.\d+$/.test(domain)) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Check se email è disposable
   */
  isDisposableEmail(email) {
    const domain = email.split('@')[1];
    
    // Check lista domini disposable
    if (this.disposableDomains.has(domain)) {
      return true;
    }
    
    // Check pattern sospetti
    for (const pattern of this.suspiciousPatterns) {
      if (pattern.test(email)) {
        return true;
      }
    }
    
    // Check subdomini di servizi disposable
    const suspiciousSubdomains = [
      'mailinator', 'guerrilla', 'temp', 'trash', 
      'disposable', 'throwaway', 'fake', 'spam',
      'burner', 'dispos', 'temporary', 'temporary'
    ];
    
    for (const subdomain of suspiciousSubdomains) {
      if (domain.includes(subdomain)) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Validazione DNS - verifica MX records
   */
  async validateDNS(email) {
    const domain = email.split('@')[1];
    
    try {
      // Usa un servizio DNS pubblico per verificare MX records
      const response = await fetch(`https://dns.google/resolve?name=${domain}&type=MX`);
      const data = await response.json();
      
      if (data.Status === 0 && data.Answer && data.Answer.length > 0) {
        // Verifica che ci siano MX records validi
        const mxRecords = data.Answer.filter(record => record.type === 15);
        return mxRecords.length > 0;
      }
      
      return false;
    } catch (error) {
      console.error('Errore DNS lookup:', error);
      // In caso di errore, usa fallback API
      return this.validateDNSFallback(domain);
    }
  }
  
  /**
   * Fallback DNS validation
   */
  async validateDNSFallback(domain) {
    try {
      // Usa un'API alternativa per DNS lookup
      const response = await fetch(`https://api.hackertarget.com/dnslookup/?q=${domain}`);
      const text = await response.text();
      return text.includes('MX') && !text.includes('error');
    } catch {
      // Se anche il fallback fallisce, accetta il dominio
      return true;
    }
  }
  
  /**
   * Validazione con API esterna (AbstractAPI, ZeroBounce, etc.)
   */
  async validateWithAPI(email) {
    const apiKey = process.env.REACT_APP_EMAIL_VALIDATION_API_KEY;
    const apiProvider = process.env.REACT_APP_EMAIL_VALIDATION_PROVIDER || 'abstractapi';
    
    try {
      let response;
      
      switch (apiProvider) {
        case 'abstractapi':
          response = await fetch(
            `https://emailvalidation.abstractapi.com/v1/?api_key=${apiKey}&email=${email}`
          );
          break;
          
        case 'zerobounce':
          response = await fetch(
            `https://api.zerobounce.net/v2/validate?api_key=${apiKey}&email=${email}`
          );
          break;
          
        case 'emailrep':
          response = await fetch(
            `https://emailrep.io/${email}`,
            {
              headers: {
                'Authorization': `Bearer ${apiKey}`
              }
            }
          );
          break;
          
        default:
          return { deliverable: true, reputation_score: 1 };
      }
      
      const data = await response.json();
      
      // Normalizza risposta basata sul provider
      return this.normalizeAPIResponse(data, apiProvider);
      
    } catch (error) {
      console.error('Errore API validazione:', error);
      // In caso di errore API, non bloccare la registrazione
      return { deliverable: true, reputation_score: 0.8 };
    }
  }
  
  /**
   * Normalizza risposte da diversi provider API
   */
  normalizeAPIResponse(data, provider) {
    switch (provider) {
      case 'abstractapi':
        return {
          deliverable: data.deliverability === 'DELIVERABLE',
          reputation_score: data.quality_score || 0.5,
          is_disposable: data.is_disposable_email?.value || false,
          is_role: data.is_role_email?.value || false,
          is_free: data.is_free_email?.value || false
        };
        
      case 'zerobounce':
        return {
          deliverable: data.status === 'valid',
          reputation_score: data.sub_status === 'clean' ? 1 : 0.5,
          is_disposable: data.free_email || false,
          is_role: data.role || false,
          is_free: data.free_email || false
        };
        
      case 'emailrep':
        return {
          deliverable: data.details.deliverable || false,
          reputation_score: (100 - data.reputation) / 100,
          is_disposable: data.details.disposable || false,
          is_role: false,
          is_free: data.details.free_provider || false
        };
        
      default:
        return {
          deliverable: true,
          reputation_score: 0.5
        };
    }
  }
  
  /**
   * Cache management
   */
  getCachedResult(email) {
    const cached = this.validationCache.get(email);
    if (cached && (Date.now() - cached.timestamp < this.cacheTimeout)) {
      return cached;
    }
    return null;
  }
  
  cacheAndReturn(email, result) {
    this.validationCache.set(email, result);
    
    // Pulizia cache vecchia
    if (this.validationCache.size > 1000) {
      const oldestKey = this.validationCache.keys().next().value;
      this.validationCache.delete(oldestKey);
    }
    
    return result;
  }
  
  /**
   * Aggiorna lista domini disposable da fonte esterna
   */
  async updateDisposableList() {
    try {
      // Fonte pubblica di domini disposable
      const response = await fetch(
        'https://raw.githubusercontent.com/martenson/disposable-email-domains/master/disposable_email_blocklist.conf'
      );
      const text = await response.text();
      const domains = text.split('\n').filter(d => d && !d.startsWith('#'));
      
      domains.forEach(domain => {
        this.disposableDomains.add(domain.trim());
      });
      
      console.log(`Lista domini disposable aggiornata: ${this.disposableDomains.size} domini`);
    } catch (error) {
      console.error('Errore aggiornamento lista disposable:', error);
    }
  }
}

export default new EmailValidationService();
