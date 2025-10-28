import React from 'react'

interface SchemaProps {
  schema: object
}

function SchemaScript({ schema }: SchemaProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export function OrganizationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Performance Prime",
    "alternateName": "PP",
    "url": "https://www.performanceprime.it",
    "logo": "https://www.performanceprime.it/logo-pp.png",
    "image": "https://www.performanceprime.it/og-image.jpg",
    "description": "Performance Prime è l'app fitness italiana con AI Coach integrato. Traccia allenamenti, monitora progressi e raggiungi i tuoi obiettivi con piani personalizzati.",
    "foundingDate": "2024",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "IT",
      "addressLocality": "Genova",
      "addressRegion": "Liguria"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "Customer Support",
      "email": "info@performanceprime.it",
      "availableLanguage": ["Italian"],
      "areaServed": "IT"
    },
    "sameAs": [
      "https://www.instagram.com/performanceprime.it",
      "https://www.tiktok.com/@performanceprime",
      "https://www.youtube.com/@performanceprime"
    ],
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "reviewCount": "1200",
      "bestRating": "5",
      "worstRating": "1"
    }
  }

  return <SchemaScript schema={schema} />
}

export function MobileAppSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "MobileApplication",
    "name": "Performance Prime",
    "applicationCategory": "HealthApplication",
    "operatingSystem": "iOS, Android",
    "description": "App fitness per tracciare allenamenti, monitorare progressi e raggiungere obiettivi con l'aiuto di PrimeBot AI Coach.",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "1200",
      "bestRating": "5",
      "worstRating": "1"
    },
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "EUR",
      "description": "Download gratuito con 10 conversazioni AI al mese. Premium da €9.99/mese."
    }
  }

  return <SchemaScript schema={schema} />
}

export function FAQSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Quanto costa Performance Prime?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Performance Prime è gratuita con 10 conversazioni PrimeBot al mese. L'abbonamento Premium costa €9.99/mese e include accesso illimitato all'AI Coach, piani personalizzati avanzati e tracking senza limiti."
        }
      },
      {
        "@type": "Question",
        "name": "Come funziona PrimeBot AI Coach?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "PrimeBot è un AI Coach che analizza i tuoi obiettivi, livello di allenamento e preferenze per fornirti consigli personalizzati su allenamento, nutrizione e motivazione. Disponibile 24/7 direttamente nell'app."
        }
      },
      {
        "@type": "Question",
        "name": "L'app è disponibile per iOS e Android?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Sì, Performance Prime è disponibile gratuitamente sia su App Store (iOS) che su Google Play Store (Android). Il download è gratuito per entrambe le piattaforme."
        }
      },
      {
        "@type": "Question",
        "name": "Posso cancellare l'abbonamento Premium in qualsiasi momento?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Sì, puoi cancellare l'abbonamento Premium in qualsiasi momento direttamente dalle impostazioni dell'app. Non ci sono vincoli o penali. Continuerai ad avere accesso Premium fino alla fine del periodo già pagato."
        }
      }
    ]
  }

  return <SchemaScript schema={schema} />
}
