// Chiamate alle REST API di GitHub (solo la parte dei gist).
import { S } from './state.js';

const BASE = 'https://api.github.com';

export class ApiError extends Error {
  constructor(status, message) {
    super(message || ('Errore ' + status));
    this.status = status;
  }
}

export async function gh(path, { method = 'GET', body, token = S.token } = {}) {
  const headers = {
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28'
  };
  if (token) headers['Authorization'] = 'Bearer ' + token;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  let res;
  try {
    res = await fetch(BASE + path, {
      method, headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: 'no-cache'
    });
  } catch {
    throw new ApiError(0, 'Connessione non disponibile');
  }
  if (res.status === 204) return null;
  if (!res.ok) {
    let msg = '';
    try { msg = (await res.json()).message || ''; } catch { /* nessun json */ }
    throw new ApiError(res.status, humanError(res.status, msg, res));
  }
  return res.json();
}

function humanError(status, msg, res) {
  if (status === 401) return 'Accesso scaduto o token non valido';
  if (status === 403 && res.headers.get('x-ratelimit-remaining') === '0') return 'Limite di richieste GitHub raggiunto: riprova più tardi';
  if (status === 403) return 'Permesso negato' + (msg ? ': ' + msg : '');
  if (status === 404) return 'Gist non trovato';
  if (status === 422) return 'Dati non validi' + (msg ? ': ' + msg : '');
  return msg || 'Errore ' + status;
}

async function paged(path, maxPages = 10) {
  const out = [];
  for (let page = 1; page <= maxPages; page++) {
    const sep = path.includes('?') ? '&' : '?';
    const batch = await gh(`${path}${sep}per_page=100&page=${page}`);
    out.push(...batch);
    if (batch.length < 100) break;
  }
  return out;
}

export const me = (token) => gh('/user', { token });
export const listGists = () => paged('/gists');
export const listStarred = () => paged('/gists/starred');
export const userGists = (login) => paged('/users/' + encodeURIComponent(login) + '/gists', 3);
export const getGist = (id) => gh('/gists/' + id);
export const getRevision = (id, sha) => gh('/gists/' + id + '/' + sha);
export const createGist = (data) => gh('/gists', { method: 'POST', body: data });
export const updateGist = (id, data) => gh('/gists/' + id, { method: 'PATCH', body: data });
export const deleteGist = (id) => gh('/gists/' + id, { method: 'DELETE' });
export const forkGist = (id) => gh('/gists/' + id + '/forks', { method: 'POST' });
export const star = (id) => gh('/gists/' + id + '/star', { method: 'PUT' });
export const unstar = (id) => gh('/gists/' + id + '/star', { method: 'DELETE' });

export async function isStarred(id) {
  try { await gh('/gists/' + id + '/star'); return true; }
  catch (e) { if (e.status === 404) return false; throw e; }
}

// Contenuto completo di un file (le API troncano i file oltre ~1 MB).
export async function fileContent(file) {
  if (!file.truncated && typeof file.content === 'string') return file.content;
  const res = await fetch(file.raw_url);
  if (!res.ok) throw new ApiError(res.status, 'Impossibile scaricare il file');
  return res.text();
}

// Estrae l'ID da un link di gist (anche raw) o da un ID scritto a mano.
export function parseGistId(input) {
  const s = (input || '').trim();
  const m = s.match(/gist\.github(?:usercontent)?\.com\/(?:[^/\s]+\/)?([0-9a-f]{7,40})/i);
  if (m) return m[1];
  if (/^[0-9a-f]{7,40}$/i.test(s)) return s;
  return null;
}
