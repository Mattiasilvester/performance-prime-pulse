// services/emailAnalytics.js

class EmailAnalytics {
  constructor() {
    this.blockedAttempts = this.loadBlockedAttempts();
    this.validationStats = this.loadValidationStats();
  }
  
  /**
   * Traccia una validazione email
   */
  trackValidation(email, result) {
    // Invia a Google Analytics o altro sistema
    if (window.gtag) {
      window.gtag('event', 'email_validation', {
        event_category: 'registration',
        event_label: result.valid ? 'valid' : 'invalid',
        value: result.score,
        custom_dimensions: {
          disposable: !result.checks.disposable,
          dns_valid: result.checks.dns,
          validation_score: result.score
        }
      });
    }
    
    // Log per monitoring
    if (!result.valid) {
        email: email.split('@')[1], // Log solo dominio per privacy
        errors: result.errors,
        score: result.score
      });
    }
    
    // Aggiorna statistiche locali
    this.updateValidationStats(email, result);
  }
  
  /**
   * Traccia tentativo di registrazione
   */
  trackRegistrationAttempt(email, success) {
    // Track tentativi di registrazione con email disposable
    if (!success) {
      this.logBlockedAttempt(email);
    }
    
    // Analytics
    if (window.gtag) {
      window.gtag('event', 'registration_attempt', {
        event_category: 'user_registration',
        event_label: success ? 'success' : 'blocked',
        custom_dimensions: {
          domain: email.split('@')[1],
          disposable: this.isDisposableEmail(email)
        }
      });
    }
  }
  
  /**
   * Logga tentativo bloccato
   */
  logBlockedAttempt(email) {
    const domain = email.split('@')[1];
    const timestamp = Date.now();
    
    // Salva in localStorage per rate limiting
    const blocked = this.loadBlockedAttempts();
    blocked.push({
      domain: domain,
      timestamp: timestamp,
      fullEmail: email // Solo per debug locale
    });
    
    // Mantieni solo ultimi 100
    if (blocked.length > 100) {
      blocked.shift();
    }
    
    localStorage.setItem('blocked_attempts', JSON.stringify(blocked));
    this.blockedAttempts = blocked;
    
    // Log per monitoring
      domain: domain,
      timestamp: new Date(timestamp).toISOString(),
      reason: 'Email disposable o non valida'
    });
  }
  
  /**
   * Carica tentativi bloccati da localStorage
   */
  loadBlockedAttempts() {
    try {
      return JSON.parse(localStorage.getItem('blocked_attempts') || '[]');
    } catch {
      return [];
    }
  }
  
  /**
   * Carica statistiche validazione da localStorage
   */
  loadValidationStats() {
    try {
      return JSON.parse(localStorage.getItem('email_validation_stats') || '{}');
    } catch {
      return {};
    }
  }
  
  /**
   * Aggiorna statistiche validazione
   */
  updateValidationStats(email, result) {
    const domain = email.split('@')[1];
    const stats = this.loadValidationStats();
    
    if (!stats[domain]) {
      stats[domain] = {
        total: 0,
        valid: 0,
        invalid: 0,
        disposable: 0,
        avgScore: 0,
        lastSeen: Date.now()
      };
    }
    
    stats[domain].total++;
    stats[domain].lastSeen = Date.now();
    
    if (result.valid) {
      stats[domain].valid++;
    } else {
      stats[domain].invalid++;
    }
    
    if (!result.checks.disposable) {
      stats[domain].disposable++;
    }
    
    // Calcola score medio
    const currentAvg = stats[domain].avgScore;
    const totalAttempts = stats[domain].total;
    stats[domain].avgScore = ((currentAvg * (totalAttempts - 1)) + result.score) / totalAttempts;
    
    // Salva statistiche
    localStorage.setItem('email_validation_stats', JSON.stringify(stats));
    this.validationStats = stats;
  }
  
  /**
   * Controlla se un dominio è stato bloccato recentemente
   */
  isRecentlyBlocked(domain, hours = 24) {
    const blocked = this.loadBlockedAttempts();
    const cutoff = Date.now() - (hours * 60 * 60 * 1000);
    
    return blocked.some(attempt => 
      attempt.domain === domain && attempt.timestamp > cutoff
    );
  }
  
  /**
   * Ottieni statistiche per dominio
   */
  getDomainStats(domain) {
    const stats = this.loadValidationStats();
    return stats[domain] || null;
  }
  
  /**
   * Ottieni tutti i domini più bloccati
   */
  getTopBlockedDomains(limit = 10) {
    const stats = this.loadValidationStats();
    const domains = Object.entries(stats)
      .filter(([domain, stat]) => stat.disposable > 0)
      .sort((a, b) => b[1].disposable - a[1].disposable)
      .slice(0, limit)
      .map(([domain, stat]) => ({
        domain,
        blockedCount: stat.disposable,
        totalAttempts: stat.total,
        lastSeen: stat.lastSeen
      }));
    
    return domains;
  }
  
  /**
   * Controlla se email è disposable (helper)
   */
  isDisposableEmail(email) {
    const disposableDomains = [
      '10minutemail.com', 'guerrillamail.com', 'mailinator.com',
      'tempmail.com', 'throwaway.email', 'yopmail.com',
      'trashmail.com', 'sharklasers.com', 'spam4.me'
    ];
    
    const domain = email.split('@')[1];
    return disposableDomains.includes(domain);
  }
  
  /**
   * Genera report analytics
   */
  generateReport() {
    const stats = this.loadValidationStats();
    const blocked = this.loadBlockedAttempts();
    
    const totalDomains = Object.keys(stats).length;
    const totalAttempts = Object.values(stats).reduce((sum, stat) => sum + stat.total, 0);
    const totalBlocked = Object.values(stats).reduce((sum, stat) => sum + stat.disposable, 0);
    const totalValid = Object.values(stats).reduce((sum, stat) => sum + stat.valid, 0);
    
    const avgScore = Object.values(stats).reduce((sum, stat) => sum + stat.avgScore, 0) / totalDomains;
    
    return {
      summary: {
        totalDomains,
        totalAttempts,
        totalBlocked,
        totalValid,
        blockRate: totalAttempts > 0 ? (totalBlocked / totalAttempts * 100).toFixed(2) : 0,
        avgScore: avgScore.toFixed(2)
      },
      topBlocked: this.getTopBlockedDomains(5),
      recentBlocked: blocked.slice(-10).map(attempt => ({
        domain: attempt.domain,
        timestamp: new Date(attempt.timestamp).toISOString()
      }))
    };
  }
  
  /**
   * Esporta dati per analisi
   */
  exportData() {
    return {
      blockedAttempts: this.loadBlockedAttempts(),
      validationStats: this.loadValidationStats(),
      report: this.generateReport(),
      exportDate: new Date().toISOString()
    };
  }
  
  /**
   * Pulisci dati vecchi (più di 30 giorni)
   */
  cleanupOldData() {
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    
    // Pulisci tentativi bloccati
    const blocked = this.loadBlockedAttempts();
    const filteredBlocked = blocked.filter(attempt => attempt.timestamp > thirtyDaysAgo);
    localStorage.setItem('blocked_attempts', JSON.stringify(filteredBlocked));
    
    // Pulisci statistiche
    const stats = this.loadValidationStats();
    const filteredStats = {};
    Object.entries(stats).forEach(([domain, stat]) => {
      if (stat.lastSeen > thirtyDaysAgo) {
        filteredStats[domain] = stat;
      }
    });
    localStorage.setItem('email_validation_stats', JSON.stringify(filteredStats));
    
  }
}

export default new EmailAnalytics();
