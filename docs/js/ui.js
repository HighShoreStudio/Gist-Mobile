// Componenti e utilità di interfaccia condivise.

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const P = (d, w = 2) => `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
export const icon = {
  back: P('<path d="M15 6l-6 6 6 6"/>', 2.2),
  more: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>',
  star: P('<path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/>'),
  starFill: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/></svg>',
  starSmall: '<svg width="16" height="16" viewBox="0 0 24 24" fill="#FFC46B" stroke="#FFC46B" stroke-width="2" stroke-linejoin="round" role="img" aria-label="Con stella"><path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/></svg>',
  search: P('<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>'),
  plus: P('<path d="M12 5v14M5 12h14"/>', 2.3),
  copy: P('<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a1 1 0 011-1h9"/>'),
  share: P('<path d="M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7M16 6l-4-4-4 4M12 2v13"/>'),
  edit: P('<path d="M4 20h4L19 9l-4-4L4 16z"/>', 2.1),
  wrap: P('<path d="M4 6h16M4 12h13a3 3 0 010 6h-4M4 18h5M15 16l-2 2 2 2"/>'),
  trash: P('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>'),
  download: P('<path d="M12 3v12M7 10l5 5 5-5M4 20h16"/>'),
  clipboard: P('<rect x="6" y="4" width="12" height="17" rx="2"/><path d="M9 4V3h6v1"/>'),
  close: P('<path d="M6 6l12 12M18 6L6 18"/>', 2.4),
  chevron: P('<path d="M6 9l6 6 6-6"/>'),
  chevronR: P('<path d="M9 6l6 6-6 6"/>', 2.2),
  globe: P('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>'),
  book: P('<path d="M3 5h6a3 3 0 013 3v12a2 2 0 00-2-2H3zM21 5h-6a3 3 0 00-3 3v12a2 2 0 012-2h7z"/>', 1.6),
  fork: P('<circle cx="6" cy="5" r="2"/><circle cx="18" cy="5" r="2"/><circle cx="12" cy="19" r="2"/><path d="M6 7v2a3 3 0 003 3h6a3 3 0 003-3V7M12 12v5"/>'),
  history: P('<path d="M3 12a9 9 0 109-9 9 9 0 00-6.4 2.6L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/>'),
  link: P('<path d="M10 14a5 5 0 007 0l3-3a5 5 0 00-7-7l-1 1M14 10a5 5 0 00-7 0l-3 3a5 5 0 007 7l1-1"/>'),
  external: P('<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5"/>'),
  shield: P('<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>'),
  eye: P('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
  github: P('<path d="M9 19c-4 1.5-4-2-6-2.5M15 21v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 00-1.3-3.2 4.2 4.2 0 00-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 00-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 00-.1 3.2A4.6 4.6 0 004 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21"/>'),
  key: P('<circle cx="8" cy="15" r="4"/><path d="M10.8 12.2L20 3M17 6l3 3M15 8l2 2"/>'),
  refresh: P('<path d="M20 11a8 8 0 10-2.3 5.7M20 4v7h-7"/>'),
  phone: P('<rect x="7" y="2" width="10" height="20" rx="2.5"/><path d="M11 18h2"/>')
};

// ---------- toast ----------
let toastTimer;
export function toast(msg, ms = 2200) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), ms);
}

// ---------- action sheet ----------
function openSheet(inner, onReady) {
  return new Promise((resolve) => {
    const bd = document.createElement('div');
    bd.className = 'sheet-backdrop';
    bd.innerHTML = `<div class="sheet" role="dialog" aria-modal="true">${inner}</div>`;
    const done = (v) => { bd.remove(); document.removeEventListener('keydown', onKey); resolve(v); };
    const onKey = (e) => { if (e.key === 'Escape') done(null); };
    bd.addEventListener('click', (e) => { if (e.target === bd) done(null); });
    document.addEventListener('keydown', onKey);
    document.body.appendChild(bd);
    onReady && onReady(bd, done);
  });
}

// items: [{key, label, sub?, danger?}]
export function actionSheet({ title, message, items }) {
  const head = title || message ? `<div class="title">${title ? `<strong>${esc(title)}</strong>` : ''}${message ? esc(message) : ''}</div>` : '';
  const opts = items.map((it, i) => `<button type="button" class="opt ${it.sub ? 'left' : ''} ${it.danger ? 'danger' : ''}" data-i="${i}" ${head || i ? '' : 'style="border-top:0"'}>${esc(it.label)}${it.sub ? `<span class="sub">${esc(it.sub)}</span>` : ''}</button>`).join('');
  return openSheet(`<div class="panel">${head}${opts}</div><div class="panel"><button type="button" class="opt cancel" data-i="-1">Annulla</button></div>`, (bd, done) => {
    bd.querySelectorAll('[data-i]').forEach((b) => b.addEventListener('click', () => {
      const i = Number(b.dataset.i);
      done(i < 0 ? null : items[i].key);
    }));
  });
}

export function confirmSheet({ title, message, ok = 'Conferma', danger = false }) {
  return actionSheet({ title, message, items: [{ key: true, label: ok, danger }] }).then((v) => v === true);
}

export function promptSheet({ title, label, placeholder = '', value = '', ok = 'OK', type = 'text', hint = '' }) {
  return openSheet(`<div class="panel"><div class="title"><strong>${esc(title)}</strong></div>
    <form class="form">
      <label class="sr-only" for="sheet-input">${esc(label || title)}</label>
      <input id="sheet-input" class="field" type="${type}" placeholder="${esc(placeholder)}" value="${esc(value)}" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false">
      ${hint ? `<p class="hint">${esc(hint)}</p>` : ''}
      <div class="btns"><button type="button" class="capsule-btn glass press" data-cancel>Annulla</button><button type="submit" class="capsule-btn btn-accent press">${esc(ok)}</button></div>
    </form></div>`, (bd, done) => {
    const input = bd.querySelector('input');
    setTimeout(() => input.focus(), 60);
    bd.querySelector('[data-cancel]').addEventListener('click', () => done(null));
    bd.querySelector('form').addEventListener('submit', (e) => { e.preventDefault(); done(input.value.trim() || null); });
  });
}

export function infoSheet({ title, html }) {
  return openSheet(`<div class="panel"><div class="title"><strong>${esc(title)}</strong></div>${html}</div><div class="panel"><button type="button" class="opt cancel" data-close>Ho capito</button></div>`, (bd, done) => {
    bd.querySelector('[data-close]').addEventListener('click', () => done(null));
  });
}

// ---------- testo, date, linguaggi ----------
const rtf = new Intl.RelativeTimeFormat('it', { numeric: 'auto', style: 'short' });
export function relTime(iso) {
  if (!iso) return '';
  const diff = (new Date(iso).getTime() - Date.now()) / 1000;
  const abs = Math.abs(diff);
  if (abs < 60) return 'ora';
  if (abs < 3600) return rtf.format(Math.round(diff / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), 'hour');
  if (abs < 86400 * 7) return rtf.format(Math.round(diff / 86400), 'day');
  if (abs < 86400 * 30) return rtf.format(Math.round(diff / (86400 * 7)), 'week');
  return new Date(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: abs > 86400 * 300 ? 'numeric' : undefined });
}
export function fullDate(iso) {
  return new Date(iso).toLocaleString('it-IT', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const LANG_COLORS = {
  'C#': '#9BE38A', 'JavaScript': '#F7DF6B', 'TypeScript': '#7CC4FA', 'JSON': '#7CC4FA', 'Python': '#8FB8FF',
  'Shell': '#F28FAD', 'PowerShell': '#9CB8FF', 'HTML': '#FF9F7A', 'CSS': '#C9A6FF', 'Markdown': '#E6E6EA',
  'YAML': '#FFB27A', 'SQL': '#FFD27A', 'Go': '#7FE0E8', 'Rust': '#FFB08A', 'Lua': '#8FA0FF', 'C++': '#FF8FB8',
  'C': '#B8C0CC', 'Java': '#FFB27A', 'Kotlin': '#C9A6FF', 'Swift': '#FF9F7A', 'PHP': '#A9B4FF', 'XML': '#FF9F7A',
  'TOML': '#FFC46B', 'Dockerfile': '#7CC4FA', 'Diff': '#8FE388'
};
const EXTRA_EXT = { cs: 'C#', csx: 'C#', shader: 'HLSL', hlsl: 'HLSL', cginc: 'HLSL', uss: 'CSS', uxml: 'XML', asmdef: 'JSON', unity: 'YAML', prefab: 'YAML', meta: 'YAML', mat: 'YAML', xaml: 'XML', csproj: 'XML', sln: 'Text', ps1: 'PowerShell', gitignore: 'Text', env: 'Properties', ini: 'Properties', cfg: 'Properties' };
const EXTRA_MIME = { HLSL: 'text/x-c++src', PowerShell: 'application/x-powershell', Properties: 'text/x-properties', Text: 'text/plain' };

export function langInfo(filename, apiLang) {
  const CM = window.CodeMirror;
  const ext = (filename || '').toLowerCase().split('.').pop();
  let name = null; let mime = 'text/plain';
  if (EXTRA_EXT[ext]) {
    name = EXTRA_EXT[ext];
    const found = CM && CM.findModeByName ? CM.findModeByName(name) : null;
    mime = EXTRA_MIME[name] || (found ? found.mime || found.mimes[0] : 'text/plain');
  } else if (CM && CM.findModeByFileName && filename) {
    const info = CM.findModeByFileName(filename);
    if (info) { name = info.name; mime = info.mime || (info.mimes && info.mimes[0]) || 'text/plain'; }
  }
  if (!name && apiLang && CM && CM.findModeByName) {
    const info = CM.findModeByName(apiLang);
    if (info) { name = info.name; mime = info.mime || info.mimes[0]; }
  }
  name = apiLang || name || 'Testo';
  if (name === 'Plain Text') name = 'Testo';
  return { name, mime, color: LANG_COLORS[name] || '#C7CBD1' };
}

// Riconoscimento leggero per il testo incollato senza nome file.
export function guessMime(text) {
  const t = (text || '').trim();
  if (!t) return 'text/plain';
  if (/^[[{]/.test(t)) { try { JSON.parse(t); return 'application/json'; } catch { /* non è json */ } }
  if (/^<(!doctype|html)/i.test(t)) return 'text/html';
  if (/^<\?xml|^<[a-z][\w:-]*[\s>]/i.test(t)) return 'application/xml';
  if (/^#!.*\b(ba|z)?sh\b/.test(t)) return 'text/x-sh';
  if (/\busing\s+[\w.]+;|\bnamespace\s+\w|\bpublic\s+(class|void|static)\b|\bMonoBehaviour\b/.test(t)) return 'text/x-csharp';
  if (/^\s*(def |import |from \w+ import )/m.test(t) && /:\s*$/m.test(t)) return 'text/x-python';
  if (/\b(const|let|function)\s+\w+|=>\s*[{(]|console\.log/.test(t)) return 'text/javascript';
  if (/^\s*(SELECT|INSERT|UPDATE|CREATE TABLE)\b/i.test(t)) return 'text/x-sql';
  if (/^#{1,6}\s|\n#{1,6}\s|^\s*[-*]\s+\S/m.test(t) && !/[;{}]\s*$/m.test(t)) return 'text/x-markdown';
  return 'text/plain';
}

export function fileCount(g) {
  const n = Object.keys(g.files || {}).length;
  return n === 1 ? '1 file' : n + ' file';
}

export function firstFile(g) {
  const files = Object.values(g.files || {});
  return files[0] || { filename: 'senza nome' };
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text; ta.setAttribute('readonly', '');
    ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch { ok = false; }
    ta.remove();
    return ok;
  }
}

export function pickFiles({ multiple = true } = {}) {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file'; input.multiple = multiple;
    input.style.display = 'none';
    input.addEventListener('change', async () => {
      const files = Array.from(input.files || []);
      const out = [];
      for (const f of files) {
        if (f.size > 5 * 1024 * 1024) { toast(f.name + ' è troppo grande (max 5 MB)'); continue; }
        out.push({ name: f.name, text: await f.text() });
      }
      input.remove();
      resolve(out);
    });
    document.body.appendChild(input);
    input.click();
  });
}

export function avatarHtml(user, size) {
  if (user && user.avatar_url) return `<img src="${esc(user.avatar_url)}&s=${size * 2}" alt="" width="${size}" height="${size}">`;
  return esc(((user && (user.name || user.login)) || '?').slice(0, 1).toUpperCase());
}

export function loadingCards(n = 4) {
  return Array.from({ length: n }, () => '<div class="skeleton"></div>').join('');
}
