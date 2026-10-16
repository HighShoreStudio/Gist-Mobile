// Cloudflare Worker per il login OAuth di Gistario.
// Riceve il "code" restituito da GitHub e lo scambia con il token,
// usando il Client Secret che non deve mai stare nella webapp.
//
// Variabili richieste (Settings → Variables and Secrets):
//   GITHUB_CLIENT_ID      (testo)   Client ID della OAuth App
//   GITHUB_CLIENT_SECRET  (secret)  Client Secret della OAuth App
//   ALLOWED_ORIGINS       (testo)   origini ammesse separate da virgola,
//                                   es. "https://tuonome.github.io"

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const allowed = (env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
    const originOk = allowed.includes(origin);
    const cors = {
      'Access-Control-Allow-Origin': originOk ? origin : 'null',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
      'Vary': 'Origin'
    };

    if (request.method === 'OPTIONS') return new Response(null, { status: originOk ? 204 : 403, headers: cors });
    if (!originOk) return json({ error: 'origin_not_allowed' }, 403, cors);

    const url = new URL(request.url);
    if (request.method !== 'POST' || url.pathname !== '/token') return json({ error: 'not_found' }, 404, cors);

    let body;
    try { body = await request.json(); } catch { return json({ error: 'bad_request' }, 400, cors); }
    const code = body && body.code;
    if (typeof code !== 'string' || !/^[\w-]{1,100}$/.test(code)) return json({ error: 'bad_code' }, 400, cors);

    const payload = { client_id: env.GITHUB_CLIENT_ID, client_secret: env.GITHUB_CLIENT_SECRET, code };
    if (typeof body.redirect_uri === 'string' && body.redirect_uri.length < 500) payload.redirect_uri = body.redirect_uri;

    const gh = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', 'User-Agent': 'gistario-oauth-proxy' },
      body: JSON.stringify(payload)
    });
    const data = await gh.json().catch(() => ({}));
    if (!gh.ok || data.error || !data.access_token) {
      return json({ error: data.error || 'exchange_failed', error_description: data.error_description || 'Scambio del codice non riuscito' }, 400, cors);
    }
    return json({ access_token: data.access_token, scope: data.scope, token_type: data.token_type }, 200, cors);
  }
};

function json(obj, status, headers) {
  return new Response(JSON.stringify(obj), { status, headers: { ...headers, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
}
