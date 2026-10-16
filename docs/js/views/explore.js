// Esplora: apri un gist esterno o sfoglia i gist pubblici di un utente.
import { S, go, clearRecent, starredIds } from '../state.js';
import * as api from '../api.js';
import { esc, icon, loadingCards, toast } from '../ui.js';
import { cardHtml } from './gists.js';

export function render(el) {
  const E = S.explore;
  el.innerHTML = `
    <div class="scroll pad-bottom" data-scroll>
      <header class="large-header"><h1>Esplora</h1></header>

      <form class="section glass" data-form="open">
        <h2>Apri un gist</h2>
        <label class="sr-only" for="gid">Link o ID del gist</label>
        <div class="field-row">
          <input id="gid" class="field" type="url" inputmode="url" placeholder="Link o ID del gist" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false">
          <button type="submit" class="capsule-btn btn-accent press" style="height:48px;border-radius:24px">Apri</button>
        </div>
        <p class="hint">Funziona con i link di gist.github.com, i link “raw” e gli ID.</p>
      </form>

      <form class="section glass" data-form="user">
        <h2>Gist pubblici di un utente</h2>
        <label class="sr-only" for="uname">Nome utente GitHub</label>
        <div class="field-row">
          <input id="uname" class="field" type="text" placeholder="Nome utente GitHub" value="${esc(E.user)}" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="search">
          <button type="submit" class="capsule-btn glass press" style="height:48px;border-radius:24px" aria-label="Cerca">${icon.search}</button>
        </div>
      </form>
      <div class="cards" data-results></div>

      <div data-recent></div>
    </div>`;

  const resultsEl = el.querySelector('[data-results]');
  const recentEl = el.querySelector('[data-recent]');

  function paintResults() {
    if (E.loading) { resultsEl.innerHTML = loadingCards(3); return; }
    if (E.error) { resultsEl.innerHTML = `<div class="empty"><strong>Nessun risultato</strong><p>${esc(E.error)}</p></div>`; return; }
    if (!E.results) { resultsEl.innerHTML = ''; return; }
    if (!E.results.length) { resultsEl.innerHTML = `<div class="empty"><p>@${esc(E.user)} non ha gist pubblici.</p></div>`; return; }
    const stars = starredIds();
    resultsEl.innerHTML = `<div class="list-meta" style="padding:0 4px"><span>${E.results.length} gist di @${esc(E.user)}</span></div>` +
      E.results.map((g) => cardHtml(g, { stars })).join('');
  }

  function paintRecent() {
    if (!S.recent.length) { recentEl.innerHTML = ''; return; }
    const stars = starredIds();
    recentEl.innerHTML = `
      <div class="list-meta" style="margin-top:18px"><span>Aperti di recente</span><button type="button" data-act="clear">Cancella</button></div>
      <div class="cards">${S.recent.map((g) => cardHtml(g, { stars, showOwner: true })).join('')}</div>`;
  }

  async function searchUser(login) {
    E.user = login; E.loading = true; E.error = null; E.results = null;
    paintResults();
    try {
      const list = await api.userGists(login);
      E.results = list;
    } catch (e) {
      E.error = e.status === 404 ? 'Utente non trovato' : e.message;
    } finally {
      E.loading = false;
      if (el.isConnected) paintResults();
    }
  }

  el.addEventListener('submit', (e) => {
    e.preventDefault();
    const form = e.target.dataset.form;
    if (form === 'open') {
      const v = el.querySelector('#gid').value;
      const id = api.parseGistId(v);
      if (!id) { toast('Link o ID non riconosciuto'); return; }
      go('/gist/' + id);
    }
    if (form === 'user') {
      const v = el.querySelector('#uname').value.trim().replace(/^@/, '');
      if (!v) return;
      el.querySelector('#uname').blur();
      searchUser(v);
    }
  });
  el.addEventListener('click', (e) => {
    if (e.target.closest('[data-act="clear"]')) { clearRecent(); paintRecent(); }
  });

  paintResults();
  paintRecent();
}
