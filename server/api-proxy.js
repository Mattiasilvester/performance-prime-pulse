// Server proxy locale per API OpenAI in sviluppo
// Questo server gestisce /api/ai-chat localmente invece di usare Vercel serverless functions

import http from 'http';
import { URL } from 'url';

// Porta del server proxy (diversa da Vite)
const PORT = process.env.API_PROXY_PORT || 3001;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ALLOW_ORIGIN = process.env.API_PROXY_ALLOW_ORIGIN || 'http://localhost:8080';

function send(res, code, data, headers = {}) {
  res.writeHead(code, { 
    'Content-Type': 'application/json',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Origin': ALLOW_ORIGIN,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    ...headers 
  });
  res.end(typeof data === 'string' ? data : JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return send(res, 200, '{}');
  }

  try {
    // Verifica chiave API
    if (!OPENAI_API_KEY) {
      console.error('❌ ERRORE: OPENAI_API_KEY non configurata nel .env');
      return send(res, 500, { 
        error: 'OpenAI API key not configured',
        message: 'Please configure OPENAI_API_KEY in .env file'
      });
    }

    const url = new URL(req.url, `http://${req.headers.host}`);
    
    // Solo POST su /api/ai-chat
    if (req.method !== 'POST' || url.pathname !== '/api/ai-chat') {
      return send(res, 404, { error: 'Not found' });
    }

    // Leggi body
    let body = '';
    for await (const chunk of req) body += chunk;
    
    const requestData = JSON.parse(body);
    const { messages, model = 'gpt-3.5-turbo' } = requestData;

    if (!messages || !Array.isArray(messages)) {
      return send(res, 400, { error: 'Messages array required' });
    }

    // Chiamata a OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 2000 // Aumentato per piani allenamento
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ OpenAI API Error:', error);
      return send(res, response.status, { 
        error: 'OpenAI API error',
        details: error 
      });
    }

    const data = await response.json();
    return send(res, 200, data);

  } catch (error) {
    console.error('❌ API Proxy Error:', error);
    return send(res, 500, { 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

server.listen(PORT, () => {
  console.log(`🚀 [API Proxy] Server locale per OpenAI API in ascolto su http://localhost:${PORT}`);
  console.log(`📡 Proxy endpoint: http://localhost:${PORT}/api/ai-chat`);
  if (!OPENAI_API_KEY) {
    console.warn('⚠️  ATTENZIONE: OPENAI_API_KEY non configurata nel .env');
  }
});

