// Accesso: OAuth tramite il Worker oppure Personal Access Token.
import { LS, setSession } from './state.js';
import * as api from './api.js';

const cfg = window.GISTARIO_CONFIG || {};

export function oauthAvailable() {
  return !!(cfg.oauthClientId && cfg.tokenProxyUrl);
}

function redirectUri() {
  return location.origin + location.pathname;
}

export function startOAuth() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  const state = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  LS.set('oauth.state', state);
  const q = new URLSearchParams({
    client_id: cfg.oauthClientId,
    scope: 'gist',
    state,
    redirect_uri: redirectUri(),
    allow_signup: 'true'
  });
  location.href = 'https://github.com/login/oauth/authorize?' + q.toString();
}

export function hasCallback() {
  const p = new URLSearchParams(location.search);
  return p.has('code') || p.has('error');
}

// Completa il ritorno da GitHub: scambia il codice con il token tramite il Worker.
export async function finishOAuth() {
  const p = new URLSearchParams(location.search);
  const code = p.get('code');
  const state = p.get('state');
  const error = p.get('error_description') || p.get('error');
  history.replaceState(null, '', location.pathname + '#/gists');
  const expected = LS.get('oauth.state', null);
  LS.del('oauth.state');
  if (error) throw new Error('Accesso annullato');
  if (!code || !state || state !== expected) throw new Error('Risposta di accesso non valida, riprova');
  let res;
  try {
    res = await fetch(cfg.tokenProxyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, redirect_uri: redirectUri() })
    });
  } catch {
    throw new Error('Il servizio di accesso non risponde');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) throw new Error(data.error_description || 'Accesso non riuscito');
  return loginWithToken(data.access_token);
}

export async function loginWithToken(token) {
  const t = (token || '').trim();
  if (!t) throw new Error('Inserisci un token');
  const user = await api.me(t);
  setSession(t, { login: user.login, name: user.name, avatar_url: user.avatar_url, public_gists: user.public_gists, private_gists: user.private_gists, html_url: user.html_url });
  return user;
}
