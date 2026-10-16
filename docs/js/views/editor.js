// Creazione e modifica di un gist.
import { S, go, upsertGist, isMine } from '../state.js';
import * as api from '../api.js';
import { mountCode, newDoc } from '../code.js';
import { esc, icon, langInfo, toast, confirmSheet, pickFiles, guessMime } from '../ui.js';

export function render(el, { id }) {
  const editing = !!id;
  let files = [];        // { orig, name, doc }
  let active = 0;
  let description = '';
  let isPublic = false;
  let dirty = false;
  let saving = false;
  let cm = null;
  let alive = true;
  let seq = 1;

  el.innerHTML = `
    <header class="nav-header">
      <button type="button" class="capsule-btn glass press" data-act="cancel">Annulla</button>
      <span class="nav-title">${editing ? 'Modifica gist' : 'Nuovo gist'}</span>
      <button type="button" class="capsule-btn btn-accent press" data-act="save" disabled>Salva</button>
    </header>
    <div data-body style="display:flex;flex-direction:column;flex:1;min-height:0">
      <div class="code-box"><div class="code-status"><span class="spin"></span>Caricamento…</div></div>
    </div>`;
  const body = el.querySelector('[data-body]');
  const saveBtn = el.querySelector('[data-act="save"]');

  function markDirty() { dirty = true; }

  function uniqueName(name) {
    const taken = new Set(files.map((f) => f.name.toLowerCase()));
    if (!taken.has(name.toLowerCase())) return name;
    const dot = name.lastIndexOf('.');
    const base = dot > 0 ? name.slice(0, dot) : name;
    const ext = dot > 0 ? name.slice(dot) : '';
    let i = 2;
    while (taken.has((base + '-' + i + ext).toLowerCase())) i++;
    return base + '-' + i + ext;
  }

  function addFile(name, text, select = true) {
    const nm = uniqueName(name || 'gistfile' + (seq++) + '.txt');
    const mime = /\.txt$/i.test(nm) && text ? guessMime(text) : langInfo(nm).mime;
    const doc = newDoc(text || '', mime);
    doc.on('change', markDirty);
    files.push({ orig: null, name: nm, doc });
    if (select) active = files.length - 1;
  }

  function layout() {
    body.innerHTML = `
      <div class="edit-top">
        <label class="sr-only" for="desc">Descrizione</label>
        <input id="desc" class="field glass" style="height:44px" type="text" placeholder="Descrizione del gist" value="${esc(description)}" autocomplete="off">
        <div class="segmented glass" role="group" aria-label="Visibilità">
          <button type="button" data-vis="sec" aria-pressed="${!isPublic}" ${editing ? 'disabled' : ''}>Segreto</button>
          <button type="button" data-vis="pub" aria-pressed="${isPublic}" ${editing ? 'disabled' : ''}>Pubblico</button>
        </div>
      </div>
      <div class="file-tabs" role="tablist" aria-label="File" data-tabs></div>
      <section class="code-box" aria-label="File">
        <div class="file-head">
          <label class="sr-only" for="fname">Nome file</label>
          <input id="fname" type="text" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
          <span class="lang-chip" data-lang></span>
          <button type="button" class="circle-btn press" data-act="delfile" aria-label="Elimina file">${icon.trash}</button>
        </div>
        <div style="flex:1;min-height:0;display:flex;flex-direction:column" class="cm-flat" data-code></div>
      </section>
      <div class="bottom-pair">
        <button type="button" class="capsule-btn glass press" style="height:48px;border-radius:24px" data-act="addfile">${icon.plus}Aggiungi file</button>
        <button type="button" class="capsule-btn glass press" style="height:48px;border-radius:24px" data-act="import">${icon.download}Importa file</button>
      </div>`;
    cm = mountCode(body.querySelector('[data-code]'), { readOnly: false, wrap: S.settings.wrap, placeholder: 'Scrivi o incolla il codice…' });
    saveBtn.disabled = false;
    select(active);
  }

  function paintTabs() {
    const tabs = body.querySelector('[data-tabs]');
    tabs.hidden = files.length < 2;
    tabs.innerHTML = files.map((f, i) => `<button type="button" role="tab" data-file="${i}" aria-selected="${i === active}">${esc(f.name || 'senza nome')}</button>`).join('');
  }

  function paintLang() {
    const f = files[active];
    body.querySelector('[data-lang]').textContent = langInfo(f.name).name;
  }

  function select(i) {
    active = Math.max(0, Math.min(i, files.length - 1));
    const f = files[active];
    body.querySelector('#fname').value = f.name;
    cm.swapDoc(f.doc);
    paintTabs(); paintLang();
  }

  async function load() {
    if (!editing) {
      addFile('', '');
      layout();
      return;
    }
    try {
      let g = S.full.get(id);
      if (!g) g = await api.getGist(id);
      if (!alive) return;
      if (!isMine(g)) { toast('Puoi modificare solo i tuoi gist'); go('/gist/' + id, { replace: true }); return; }
      description = g.description || '';
      isPublic = g.public;
      for (const f of Object.values(g.files)) {
        const text = await api.fileContent(f);
        const doc = newDoc(text, langInfo(f.filename, f.language).mime);
        doc.on('change', markDirty);
        files.push({ orig: f.filename, name: f.filename, doc });
      }
      if (!alive) return;
      layout();
    } catch (e) {
      if (!alive) return;
      body.innerHTML = `<div class="empty" style="flex:1"><strong>Impossibile aprire il gist</strong><p>${esc(e.message)}</p></div>`;
    }
  }

  function validate() {
    const seen = new Set();
    for (const f of files) {
      const n = f.name.trim();
      if (!n) return 'Ogni file deve avere un nome';
      if (/[/\\]/.test(n)) return 'Il nome “' + n + '” non può contenere / o \\';
      if (/^gistfile\d+$/i.test(n)) return 'Il nome “' + n + '” è riservato da GitHub: aggiungi un’estensione';
      if (seen.has(n.toLowerCase())) return 'Ci sono due file chiamati “' + n + '”';
      seen.add(n.toLowerCase());
      if (!f.doc.getValue().trim()) return 'Il file “' + n + '” è vuoto';
    }
    return null;
  }

  async function save() {
    if (saving) return;
    const err = validate();
    if (err) { toast(err, 2800); return; }
    saving = true; saveBtn.disabled = true; saveBtn.innerHTML = '<span class="spin"></span>';
    try {
      let g;
      if (!editing) {
        const payload = { description, public: isPublic, files: {} };
        for (const f of files) payload.files[f.name.trim()] = { content: f.doc.getValue() };
        g = await api.createGist(payload);
      } else {
        const original = S.full.get(id) || await api.getGist(id);
        const payload = { description, files: {} };
        const kept = new Set(files.filter((f) => f.orig).map((f) => f.orig));
        for (const name of Object.keys(original.files)) if (!kept.has(name)) payload.files[name] = null;
        for (const f of files) {
          const name = f.name.trim();
          if (f.orig) payload.files[f.orig] = name !== f.orig ? { filename: name, content: f.doc.getValue() } : { content: f.doc.getValue() };
          else payload.files[name] = { content: f.doc.getValue() };
        }
        g = await api.updateGist(id, payload);
      }
      dirty = false;
      upsertGist(g);
      toast(editing ? 'Modifiche salvate' : 'Gist creato');
      go('/gist/' + g.id, { replace: true });
    } catch (e) {
      toast(e.message, 3200);
    } finally {
      saving = false;
      if (alive) { saveBtn.disabled = false; saveBtn.textContent = 'Salva'; }
    }
  }

  async function cancel() {
    if (dirty) {
      const ok = await confirmSheet({ title: 'Eliminare le modifiche?', message: 'Le modifiche non salvate andranno perse.', ok: 'Elimina modifiche', danger: true });
      if (!ok) return;
    }
    dirty = false;
    go(editing ? '/gist/' + id : (S.lastTab || '/gists'), { replace: true });
  }

  el.addEventListener('input', (e) => {
    if (e.target.id === 'desc') { description = e.target.value; markDirty(); }
    if (e.target.id === 'fname') {
      const f = files[active];
      f.name = e.target.value;
      cm.setOption('mode', langInfo(f.name).mime);
      markDirty(); paintTabs(); paintLang();
    }
  });

  el.addEventListener('click', async (e) => {
    const vis = e.target.closest('[data-vis]');
    if (vis && !vis.disabled) {
      isPublic = vis.dataset.vis === 'pub';
      body.querySelectorAll('[data-vis]').forEach((b) => b.setAttribute('aria-pressed', String(b === vis)));
      markDirty();
      return;
    }
    const tab = e.target.closest('[data-file]');
    if (tab) { select(Number(tab.dataset.file)); return; }
    const a = e.target.closest('[data-act]');
    if (!a) return;
    const act = a.dataset.act;
    if (act === 'cancel') cancel();
    if (act === 'save') save();
    if (act === 'addfile') { addFile('', ''); select(active); markDirty(); setTimeout(() => body.querySelector('#fname').focus(), 50); }
    if (act === 'import') {
      const picked = await pickFiles();
      if (!picked.length) return;
      // se c'è un solo file vuoto e senza nome, lo sostituisco
      if (files.length === 1 && !files[0].orig && !files[0].doc.getValue() && /^gistfile\d+\.txt$/.test(files[0].name)) files = [];
      picked.forEach((p) => addFile(p.name, p.text));
      select(files.length - 1); markDirty();
      toast(picked.length === 1 ? 'File importato' : picked.length + ' file importati');
    }
    if (act === 'delfile') {
      if (files.length < 2) { toast('Un gist deve avere almeno un file'); return; }
      const f = files[active];
      if (f.doc.getValue().trim()) {
        const ok = await confirmSheet({ title: 'Eliminare “' + (f.name || 'senza nome') + '”?', ok: 'Elimina file', danger: true });
        if (!ok) return;
      }
      files.splice(active, 1); select(active); markDirty();
    }
  });

  const beforeUnload = (e) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } };
  window.addEventListener('beforeunload', beforeUnload);
  load();
  return () => { alive = false; window.removeEventListener('beforeunload', beforeUnload); };
}
