// Stato condiviso dell'app e persistenza locale.
const PREFIX = 'gistario.';

export const LS = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem(PREFIX + key);
      return v == null ? fallback : JSON.parse(v);
    } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); } catch { /* spazio pieno o storage bloccato */ }
  },
  del(key) {
    try { localStorage.removeItem(PREFIX + key); } catch { /* ignora */ }
  }
};

export const ACCENTS = ['#F0A63A', '#7CC4FA', '#9BE38A', '#F28FAD'];

export const S = {
  token: LS.get('token', null),
  user: LS.get('user', null),
  gists: LS.get('cache.gists', null),       // lista dei miei gist (riassunti)
  starred: LS.get('cache.starred', null),   // lista dei gist con stella
  full: new Map(),                          // gist completi aperti in questa sessione
  list: { filter: 'all', query: '', sort: LS.get('sort', 'updated') },
  starList: { query: '' },
  explore: { user: '', results: null, loading: false, error: null },
  recent: LS.get('recent', []),
  settings: Object.assign({ accent: ACCENTS[0], codeSize: 13, wrap: false }, LS.get('settings', {})),
  // Il Reader vive solo in memoria: si svuota quando l'app viene chiusa.
  reader: { tabs: [], active: null, edit: false, wrap: true, seq: 0 },
  lastTab: '/gists',
  scroll: {}
};

export function starredIds() {
  return new Set((S.starred || []).map((g) => g.id));
}

function slim(g) {
  const files = {};
  for (const [k, f] of Object.entries(g.files || {})) {
    files[k] = { filename: f.filename, language: f.language, size: f.size };
  }
  return {
    id: g.id, description: g.description, public: g.public,
    created_at: g.created_at, updated_at: g.updated_at,
    html_url: g.html_url, comments: g.comments,
    owner: g.owner ? { login: g.owner.login, avatar_url: g.owner.avatar_url } : null,
    files
  };
}

export function setGists(list) {
  S.gists = list.map(slim);
  LS.set('cache.gists', S.gists);
}
export function setStarred(list) {
  S.starred = list.map(slim);
  LS.set('cache.starred', S.starred);
}

export function upsertGist(g) {
  S.full.set(g.id, g);
  const s = slim(g);
  if (isMine(g)) {
    const arr = (S.gists || []).filter((x) => x.id !== g.id);
    arr.unshift(s);
    S.gists = arr;
    LS.set('cache.gists', S.gists);
  }
  if (S.starred && S.starred.some((x) => x.id === g.id)) {
    S.starred = S.starred.map((x) => (x.id === g.id ? s : x));
    LS.set('cache.starred', S.starred);
  }
}

export function removeGist(id) {
  S.full.delete(id);
  if (S.gists) { S.gists = S.gists.filter((g) => g.id !== id); LS.set('cache.gists', S.gists); }
  if (S.starred) { S.starred = S.starred.filter((g) => g.id !== id); LS.set('cache.starred', S.starred); }
}

export function setStarLocal(g, on) {
  const list = (S.starred || []).filter((x) => x.id !== g.id);
  if (on) list.unshift(slim(g));
  S.starred = list;
  LS.set('cache.starred', S.starred);
}

export function isMine(g) {
  return !!(S.user && g && g.owner && g.owner.login === S.user.login);
}

export function addRecent(g) {
  const item = slim(g);
  S.recent = [item, ...S.recent.filter((x) => x.id !== g.id)].slice(0, 12);
  LS.set('recent', S.recent);
}
export function clearRecent() { S.recent = []; LS.set('recent', []); }

export function setSession(token, user) {
  S.token = token; S.user = user;
  LS.set('token', token); LS.set('user', user);
}

export function logout() {
  S.token = null; S.user = null; S.gists = null; S.starred = null; S.full.clear();
  ['token', 'user', 'cache.gists', 'cache.starred'].forEach(LS.del);
  try { navigator.serviceWorker && navigator.serviceWorker.controller && navigator.serviceWorker.controller.postMessage('clear-api'); } catch { /* ignora */ }
}

export function saveSettings() {
  LS.set('settings', S.settings);
  applySettings();
}

export function applySettings() {
  const r = document.documentElement.style;
  r.setProperty('--accent', S.settings.accent);
  r.setProperty('--code-size', S.settings.codeSize + 'px');
}

export function go(path, opts = {}) {
  const target = '#' + path;
  if (opts.replace) location.replace(target);
  else if (location.hash === target) window.dispatchEvent(new HashChangeEvent('hashchange'));
  else location.hash = target;
}
