import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, apikey, x-client-info, x-upsert');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const supabaseUrl = 'https://kfxoyucatvvcgmqalxsg.supabase.co';
  
  // Estrai il path dal query parameter o dall'URL
  let path = '';
  if (req.query.path && typeof req.query.path === 'string') {
    // Path dal rewrite di Vercel
    path = '/' + req.query.path;
  } else if (req.url) {
    // Path dall'URL originale
    path = req.url.replace('/api/supabase-proxy', '');
  }
  
  const targetUrl = `${supabaseUrl}${path}`;

  console.log(`🔄 Proxy request: ${req.method} ${targetUrl}`);

  try {
    const headers: HeadersInit = {};
    
    // Copia headers importanti
    if (req.headers.authorization) headers['Authorization'] = req.headers.authorization as string;
    if (req.headers.apikey) headers['apikey'] = req.headers.apikey as string;
    if (req.headers['content-type']) headers['Content-Type'] = req.headers['content-type'] as string;
    if (req.headers['x-client-info']) headers['x-client-info'] = req.headers['x-client-info'] as string;
    if (req.headers['x-upsert']) headers['x-upsert'] = req.headers['x-upsert'] as string;

    const body = req.method !== 'GET' && req.method !== 'HEAD' && req.body 
      ? JSON.stringify(req.body) 
      : undefined;

    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body
    });

    const contentType = response.headers.get('content-type');
    
    console.log(`✅ Proxy response: ${response.status} ${response.statusText}`);
    
    if (contentType?.includes('application/json')) {
      const data = await response.json();
      res.status(response.status).json(data);
    } else {
      const data = await response.text();
      res.status(response.status).send(data);
    }
  } catch (error: any) {
    console.error('❌ Proxy error:', error);
    res.status(500).json({ 
      error: error.message,
      details: 'Supabase proxy error'
    });
  }
}
