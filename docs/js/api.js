// GitHub REST API calls (gists only).
import { S } from './state.js';

const BASE = 'https://api.github.com';

export class ApiError extends Error {
  constructor(status, message) {
    super(message || ('Error ' + status));
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
    throw new ApiError(0, 'No connection');
  }
  if (res.status === 204) return null;
  if (!res.ok) {
    let msg = '';
    try { msg = (await res.json()).message || ''; } catch { /* no json */ }
    throw new ApiError(res.status, humanError(res.status, msg, res));
  }
  return res.json();
}

function humanError(status, msg, res) {
  if (status === 401) return 'Session expired or invalid token';
  if (status === 403 && res.headers.get('x-ratelimit-remaining') === '0') return 'GitHub rate limit reached: try again later';
  if (status === 403) return 'Permission denied' + (msg ? ': ' + msg : '');
  if (status === 404) return 'Gist not found';
  if (status === 422) return 'Invalid data' + (msg ? ': ' + msg : '');
  return msg || 'Error ' + status;
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

// Full file content (the API truncates files over ~1 MB).
export async function fileContent(file) {
  if (!file.truncated && typeof file.content === 'string') return file.content;
  const res = await fetch(file.raw_url);
  if (!res.ok) throw new ApiError(res.status, 'Could not download the file');
  return res.text();
}

// Extracts the ID from a gist link (raw links too) or a typed ID.
export function parseGistId(input) {
  const s = (input || '').trim();
  const m = s.match(/gist\.github(?:usercontent)?\.com\/(?:[^/\s]+\/)?([0-9a-f]{7,40})/i);
  if (m) return m[1];
  if (/^[0-9a-f]{7,40}$/i.test(s)) return s;
  return null;
}
