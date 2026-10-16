// Lettura di un gist (anche di altri utenti o di una revisione passata).
import { S, go, isMine, upsertGist, removeGist, setStarLocal, starredIds, addRecent } from '../state.js';
import * as api from '../api.js';
import { mountCode, newDoc } from '../code.js';
import { esc, icon, relTime, fullDate, langInfo, actionSheet, confirmSheet, toast, copyText } from '../ui.js';
import { openInReader } from './reader.js';

export function render(el, { id, sha }) {
  let g = sha ? null : S.full.get(id) || null;
  let fileIdx = 0;
  let cm = null;
  let wrap = S.settings.wrap;
  let starred = starredIds().has(id);
  const contents = new Map(); // filename -> testo completo
  const docs = new Map();
  let alive = true;

  const back = () => go(S.lastTab || '/gists', { replace: true });

  el.innerHTML = `
    <header class="nav-header">
      <button type="button" class="circle-btn glass press" data-act="back" aria-label="Indietro">${icon.back}</button>
      <span class="nav-title" data-title>Gist</span>
      <div class="pill-group glass" data-tools hidden>
        <button type="button" class="press" data-act="star" aria-label="Aggiungi stella" hidden></button>
        <button type="button" class="press" data-act="more" aria-label="Altre azioni">${icon.more}</button>
      </div>
    </header>
    <div data-body style="display:flex;flex-direction:column;flex:1;min-height:0">
      <div class="code-box"><div class="code-status"><span class="spin"></span>Caricamento…</div></div>
    </div>`;

  const body = el.querySelector('[data-body]');

  function files() { return g ? Object.values(g.files) : []; }

  function header() {
    const f = files()[0];
    el.querySelector('[data-title]').textContent = f ? f.filename : 'Gist';
    el.querySelector('[data-tools]').hidden = false;
    const starBtn = el.querySelector('[data-act="star"]');
    starBtn.hidden = !S.token || !!sha;
    starBtn.innerHTML = starred ? icon.starFill : icon.star;
    starBtn.style.color = starred ? '#FFC46B' : '';
    starBtn.setAttribute('aria-label', starred ? 'Rimuovi stella' : 'Aggiungi stella');
  }

  function primaryAction() {
    if (sha) return `<button type="button" class="btn-accent press" data-act="latest">${icon.history}Attuale</button>`;
    if (isMine(g)) return `<a class="btn-accent press" href="#/edit/${esc(g.id)}">${icon.edit}Modifica</a>`;
    if (S.token) return `<button type="button" class="btn-accent press" data-act="fork">${icon.fork}Fork</button>`;
    return `<button type="button" class="btn-accent press" data-act="reader">${icon.book}Reader</button>`;
  }

  function layout() {
    const list = files();
    const own = isMine(g);
    const meta = [
      !own && g.owner ? '@' + g.owner.login : null,
      g.public ? 'Pubblico' : 'Segreto',
      list.length === 1 ? '1 file' : list.length + ' file',
      g.history ? (g.history.length === 1 ? '1 revisione' : g.history.length + ' revisioni') : null,
      'modificato ' + relTime(g.updated_at)
    ].filter(Boolean).join(' · ');
    body.innerHTML = `
      <section class="gist-info">
        ${g.description ? `<p>${esc(g.description)}</p>` : ''}
        <div class="meta">${esc(meta)}</div>
      </section>
      ${sha ? `<div class="banner glass">${icon.history}<span>Revisione del ${esc(fullDate(revisionDate()))}</span></div>` : ''}
      <div class="file-bar">
        <div class="segmented files glass" role="tablist" aria-label="File del gist">
          ${list.map((f, i) => `<button type="button" role="tab" data-file="${i}" aria-selected="${i === fileIdx}">${esc(f.filename)}</button>`).join('')}
        </div>
        <button type="button" class="circle-btn glass press" data-act="wrap" aria-label="A capo automatico" aria-pressed="${wrap}" style="margin-left:auto">${icon.wrap}</button>
      </div>
      <div class="code-box" data-code></div>
      <div class="action-bar glass-bar">
        <button type="button" class="press" data-act="copy">${icon.copy}Copia</button>
        ${primaryAction()}
        <button type="button" class="press" data-act="share">${icon.share}Condividi</button>
      </div>`;
    styleWrap();
    const box = body.querySelector('[data-code]');
    cm = mountCode(box, { readOnly: true, wrap });
    showFile(fileIdx);
  }

  function revisionDate() {
    const hist = (S.full.get(id) || g).history || [];
    const h = hist.find((x) => x.version === sha) || hist[0];
    return h ? h.committed_at : g.updated_at;
  }

  function styleWrap() {
    const b = body.querySelector('[data-act="wrap"]');
    if (b) { b.setAttribute('aria-pressed', String(wrap)); b.style.background = wrap ? 'rgba(255,255,255,.22)' : ''; }
  }

  async function showFile(i) {
    fileIdx = i;
    body.querySelectorAll('[data-file]').forEach((b) => b.setAttribute('aria-selected', String(Number(b.dataset.file) === i)));
    const f = files()[i];
    if (!f) return;
    const sel = body.querySelector(`[data-file="${i}"]`);
    if (sel) sel.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    if (!docs.has(f.filename)) {
      let text = contents.get(f.filename);
      if (text == null) {
        if (f.truncated) cm.setValue('Caricamento del file completo…');
        try { text = await api.fileContent(f); } catch (e) { text = '// ' + e.message; }
        contents.set(f.filename, text);
      }
      docs.set(f.filename, newDoc(text, langInfo(f.filename, f.language).mime));
    }
    if (!alive) return;
    cm.swapDoc(docs.get(f.filename));
    cm.scrollTo(0, 0);
  }

  async function load() {
    try {
      const fresh = sha ? await api.getRevision(id, sha) : await api.getGist(id);
      if (!alive) return;
      g = fresh;
      if (!sha) {
        S.full.set(g.id, g);
        if (isMine(g)) upsertGist(g); else addRecent(g);
      }
      docs.clear(); contents.clear();
      header(); layout();
      if (S.token && !sha) {
        api.isStarred(id).then((on) => { if (alive && on !== starred) { starred = on; header(); } }).catch(() => {});
      }
    } catch (e) {
      if (!alive) return;
      if (g) { toast(e.message); return; }
      body.innerHTML = `<div class="empty" style="flex:1"><strong>Impossibile aprire il gist</strong><p>${esc(e.message)}</p>
        <button type="button" class="capsule-btn glass press" data-act="retry">Riprova</button></div>`;
    }
  }

  async function currentText() {
    const f = files()[fileIdx];
    if (!f) return '';
    return docs.has(f.filename) ? docs.get(f.filename).getValue() : api.fileContent(f);
  }

  async function allFilesForReader() {
    const out = [];
    for (const f of files()) {
      let text = contents.get(f.filename);
      if (text == null) { try { text = await api.fileContent(f); } catch { text = ''; } }
      out.push({ name: f.filename, text, mime: langInfo(f.filename, f.language).mime });
    }
    return out;
  }

  async function onMore() {
    const own = isMine(g);
    const items = [
      { key: 'github', label: 'Apri su GitHub' },
      { key: 'link', label: 'Copia link' },
      { key: 'reader', label: 'Apri nel Reader' }
    ];
    if (g.history && g.history.length > 1) items.push({ key: 'history', label: 'Cronologia revisioni', sub: String(g.history.length) });
    if (S.token && !own && !sha) items.push({ key: 'fork', label: 'Crea un fork' });
    if (own && !sha) items.push({ key: 'delete', label: 'Elimina gist', danger: true });
    const k = await actionSheet({ items });
    if (!k) return;
    if (k === 'github') window.open(g.html_url + (sha ? '/' + sha : ''), '_blank', 'noopener');
    if (k === 'link') { await copyText(g.html_url); toast('Link copiato'); }
    if (k === 'reader') { openInReader(await allFilesForReader()); }
    if (k === 'history') onHistory();
    if (k === 'fork') onFork();
    if (k === 'delete') onDelete();
  }

  async function onHistory() {
    const items = g.history.map((h, i) => ({
      key: h.version,
      label: (i === 0 ? 'Attuale · ' : '') + relTime(h.committed_at),
      sub: h.change_status ? `+${h.change_status.additions || 0} −${h.change_status.deletions || 0}` : ''
    }));
    const v = await actionSheet({ title: 'Cronologia revisioni', items });
    if (!v) return;
    if (v === g.history[0].version) go('/gist/' + id);
    else go('/gist/' + id + '/rev/' + v);
  }

  async function onFork() {
    try {
      toast('Creo il fork…');
      const f = await api.forkGist(g.id);
      upsertGist(f);
      toast('Fork creato nei tuoi gist');
      go('/gist/' + f.id);
    } catch (e) { toast(e.message, 3000); }
  }

  async function onDelete() {
    const ok = await confirmSheet({ title: 'Eliminare questo gist?', message: 'L’operazione non si può annullare.', ok: 'Elimina', danger: true });
    if (!ok) return;
    try {
      await api.deleteGist(g.id);
      removeGist(g.id);
      toast('Gist eliminato');
      go('/gists', { replace: true });
    } catch (e) { toast(e.message, 3000); }
  }

  async function onStar() {
    const next = !starred;
    starred = next; header();
    try {
      if (next) await api.star(g.id); else await api.unstar(g.id);
      setStarLocal(g, next);
    } catch (e) {
      starred = !next; header();
      toast(e.message);
    }
  }

  el.addEventListener('click', async (e) => {
    const fb = e.target.closest('[data-file]');
    if (fb) { showFile(Number(fb.dataset.file)); return; }
    const a = e.target.closest('[data-act]');
    if (!a) return;
    const act = a.dataset.act;
    if (act === 'back') back();
    else if (act === 'retry') { body.innerHTML = '<div class="code-box"><div class="code-status"><span class="spin"></span>Caricamento…</div></div>'; load(); }
    else if (!g) return;
    else if (act === 'star') onStar();
    else if (act === 'more') onMore();
    else if (act === 'wrap') { wrap = !wrap; cm.setOption('lineWrapping', wrap); styleWrap(); }
    else if (act === 'copy') { const ok = await copyText(await currentText()); toast(ok ? 'Copiato negli appunti' : 'Copia non riuscita'); }
    else if (act === 'share') {
      const data = { title: files()[0] ? files()[0].filename : 'Gist', text: g.description || undefined, url: g.html_url };
      if (navigator.share) { try { await navigator.share(data); } catch { /* annullato */ } }
      else { await copyText(g.html_url); toast('Link copiato'); }
    }
    else if (act === 'fork') onFork();
    else if (act === 'reader') openInReader(await allFilesForReader());
    else if (act === 'latest') go('/gist/' + id, { replace: true });
  });

  if (g) { header(); layout(); }
  load();

  return () => { alive = false; };
}
