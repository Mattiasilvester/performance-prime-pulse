const http = require('http');
const { URL } = require('url');

const PORT = process.env.VF_PROXY_PORT || 8099;
const VF_API_KEY = process.env.VF_API_KEY;
const VF_BASE_URL = process.env.VF_BASE_URL || 'https://general-runtime.voiceflow.com';
const ALLOW_ORIGIN = process.env.VF_PROXY_ALLOW_ORIGIN || 'http://localhost:8084';

function send(res, code, data, headers = {}) {
  res.writeHead(code, { 'Content-Type': 'application/json', ...headers });
  res.end(typeof data === 'string' ? data : JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', ALLOW_ORIGIN);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return send(res, 200, '{}');

  try {
    if (!VF_API_KEY) return send(res, 500, { error: 'Missing VF_API_KEY' });

    const url = new URL(req.url, `http://${req.headers.host}`);
    // Path atteso: /api/voiceflow/:userId/interact
    const parts = url.pathname.split('/').filter(Boolean);
    if (parts.length !== 4 || parts[0] !== 'api' || parts[1] !== 'voiceflow' || parts[3] !== 'interact') {
      return send(res, 404, { error: 'Not found' });
    }
    const userId = parts[2];

    let body = '';
    for await (const chunk of req) body += chunk;
    const target = `${VF_BASE_URL}/state/user/${encodeURIComponent(userId)}/interact`;

    const r = await fetch(target, {
      method: 'POST',
      headers: { 'Authorization': `VF-Api-Key ${VF_API_KEY}`, 'Content-Type': 'application/json' },
      body: body || '{}',
    });

    const text = await r.text();
    send(res, r.status, text, { 'Content-Type': 'application/json' });
  } catch (e) {
    send(res, 500, { error: String(e) });
  }
});

server.listen(PORT, () => {
  console.log(`[dev-proxy] Voiceflow proxy listening on :${PORT}`);
});
