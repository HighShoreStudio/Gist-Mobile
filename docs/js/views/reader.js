// Reader: temporary tabs to read, edit and copy text.
// Everything stays in memory: tabs disappear when the app is closed.
import { S, go } from '../state.js';
import * as api from '../api.js';
import { mountCode, newDoc, setEditable } from '../code.js';
import { esc, icon, toast, copyText, guessMime, langInfo, actionSheet, promptSheet, pickFiles } from '../ui.js';

const R = S.reader;

function addTab({ name, text, mime }) {
  R.seq += 1;
  const nm = name || 'Text ' + R.seq;
  const tab = { id: R.seq, name: nm, doc: newDoc(text || '', mime || (name ? langInfo(name).mime : guessMime(text))) };
  R.tabs.push(tab);
  R.active = tab.id;
  return tab;
}

// Used by the gist viewer: opens the files in the Reader.
export function openInReader(items) {
  items.forEach((it) => addTab(it));
  R.edit = false;
  go('/reader');
}

export function render(el) {
  let cm = null;

  el.innerHTML = `
    <div class="tabstrip" role="tablist" aria-label="Open texts" data-tabs></div>
    <div class="toolbar">
      <div class="tgroup glass">
        <button type="button" class="press" data-act="paste">${icon.clipboard}Paste</button>
        <span class="sep"></span>
        <button type="button" class="press" data-act="import">${icon.download}Import</button>
      </div>
      <div class="tgroup glass end" data-doc-tools>
        <button type="button" class="icon press" data-act="wrap" aria-label="Line wrap">${icon.wrap}</button>
        <button type="button" class="icon press" data-act="edit" aria-label="Edit text">${icon.edit}</button>
        <button type="button" class="btn-accent press" data-act="copy" aria-label="Copy all">${icon.copy}Copy</button>
      </div>
    </div>
    <div class="code-box" data-box style="margin-bottom:calc(var(--tabbar-h) + var(--tabbar-bottom) + 30px)">
      <div data-code style="flex:1;min-height:0;display:flex;flex-direction:column" class="cm-flat"></div>
      <div class="empty" data-empty style="position:absolute;inset:0;justify-content:center">
        ${icon.book.replace('width="20" height="20"', 'width="44" height="44"')}
        <strong>No open texts</strong>
        <p>Paste some text or import a file: each one opens in a new tab.</p>
      </div>
    </div>
    <p class="float-note">Tabs are cleared when the app closes</p>`;

  const tabsEl = el.querySelector('[data-tabs]');
  const emptyEl = el.querySelector('[data-empty]');
  const codeEl = el.querySelector('[data-code]');
  cm = mountCode(codeEl, { readOnly: true, wrap: R.wrap, placeholder: 'Type or paste here…' });

  function current() { return R.tabs.find((t) => t.id === R.active) || null; }

  function paint() {
    tabsEl.innerHTML = R.tabs.map((t) => `
      <div class="rtab" aria-selected="${t.id === R.active}">
        <button type="button" class="rtab-name" role="tab" aria-selected="${t.id === R.active}" data-tab="${t.id}">${esc(t.name)}</button>
        <button type="button" class="rtab-x" data-close="${t.id}" aria-label="Close ${esc(t.name)}">${icon.close}</button>
      </div>`).join('') +
      `<button type="button" class="circle-btn press" style="width:40px;height:40px;border-radius:20px;background:var(--fill);border:1px solid var(--stroke)" data-act="paste" aria-label="New tab from clipboard">${icon.plus}</button>`;
    const tab = current();
    emptyEl.hidden = !!tab;
    codeEl.style.visibility = tab ? 'visible' : 'hidden';
    el.querySelector('[data-doc-tools]').style.opacity = tab ? '1' : '.4';
    el.querySelectorAll('[data-doc-tools] button').forEach((b) => { b.disabled = !tab; });
    const w = el.querySelector('[data-act="wrap"]');
    const ed = el.querySelector('[data-act="edit"]');
    w.setAttribute('aria-pressed', String(R.wrap));
    ed.setAttribute('aria-pressed', String(R.edit));
    ed.style.color = R.edit ? 'var(--accent)' : '';
    if (tab) {
      if (cm.getDoc() !== tab.doc) cm.swapDoc(tab.doc);
      setEditable(cm, R.edit);
      const sel = tabsEl.querySelector(`[data-tab="${tab.id}"]`);
      if (sel) sel.parentElement.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  }

  async function paste() {
    let text = '';
    try { text = await navigator.clipboard.readText(); } catch { text = ''; }
    if (!text) {
      addTab({ text: '' });
      R.edit = true;
      paint();
      cm.focus();
      toast('Clipboard is empty: paste the text into the new tab');
      return;
    }
    addTab({ text });
    R.edit = false;
    paint();
  }

  async function importFrom() {
    const k = await actionSheet({ title: 'Import', items: [
      { key: 'file', label: 'File from device' },
      { key: 'link', label: 'Gist link or ID, or file URL' }
    ] });
    if (k === 'file') {
      const picked = await pickFiles();
      picked.forEach((p) => addTab({ name: p.name, text: p.text }));
      if (picked.length) { R.edit = false; paint(); }
      return;
    }
    if (k !== 'link') return;
    const value = await promptSheet({ title: 'Import from link', placeholder: 'https://gist.github.com/… or ID', ok: 'Open', type: 'url', hint: 'The text opens here without creating a gist.' });
    if (!value) return;
    const id = api.parseGistId(value);
    try {
      if (id) {
        toast('Downloading gist…');
        const g = await api.getGist(id);
        for (const f of Object.values(g.files)) addTab({ name: f.filename, text: await api.fileContent(f), mime: langInfo(f.filename, f.language).mime });
      } else {
        let url;
        try { url = new URL(value); } catch { toast('Invalid link'); return; }
        const res = await fetch(url.href);
        if (!res.ok) throw new Error('Error ' + res.status);
        const text = await res.text();
        const name = decodeURIComponent(url.pathname.split('/').filter(Boolean).pop() || url.hostname);
        addTab({ name, text });
      }
      R.edit = false;
      paint();
    } catch (e) {
      toast(e instanceof TypeError ? 'This site doesn’t allow downloading the file from here' : e.message, 3200);
    }
  }

  function closeTab(id) {
    const i = R.tabs.findIndex((t) => t.id === id);
    if (i < 0) return;
    R.tabs.splice(i, 1);
    if (R.active === id) {
      const next = R.tabs[i] || R.tabs[i - 1];
      R.active = next ? next.id : null;
    }
    if (!R.tabs.length) cm.swapDoc(newDoc(''));
    paint();
  }

  el.addEventListener('click', async (e) => {
    const t = e.target.closest('[data-tab]');
    if (t) { R.active = Number(t.dataset.tab); paint(); return; }
    const c = e.target.closest('[data-close]');
    if (c) { closeTab(Number(c.dataset.close)); return; }
    const a = e.target.closest('[data-act]');
    if (!a || a.disabled) return;
    const act = a.dataset.act;
    if (act === 'paste') paste();
    if (act === 'import') importFrom();
    if (act === 'wrap') { R.wrap = !R.wrap; cm.setOption('lineWrapping', R.wrap); paint(); }
    if (act === 'edit') { R.edit = !R.edit; paint(); if (R.edit) cm.focus(); }
    if (act === 'copy') {
      const tab = current();
      if (!tab) return;
      const ok = await copyText(tab.doc.getValue());
      a.innerHTML = icon.copy + (ok ? 'Copied' : 'Error');
      setTimeout(() => { if (a.isConnected) a.innerHTML = icon.copy + 'Copy'; }, 1400);
    }
  });

  paint();
  return () => { cm.swapDoc(newDoc('')); };
}
