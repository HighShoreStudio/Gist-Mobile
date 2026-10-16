// Explore: open an external gist or browse a user's public gists.
import { S, go, clearRecent, starredIds } from '../state.js';
import * as api from '../api.js';
import { esc, icon, loadingCards, toast } from '../ui.js';
import { cardHtml } from './gists.js';

export function render(el) {
  const E = S.explore;
  el.innerHTML = `
    <div class="scroll pad-bottom" data-scroll>
      <header class="large-header"><h1>Explore</h1></header>

      <form class="section glass" data-form="open">
        <h2>Open a gist</h2>
        <label class="sr-only" for="gid">Gist link or ID</label>
        <div class="field-row">
          <input id="gid" class="field" type="url" inputmode="url" placeholder="Gist link or ID" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false">
          <button type="submit" class="capsule-btn btn-accent press" style="height:48px;border-radius:24px">Open</button>
        </div>
        <p class="hint">Works with gist.github.com links, “raw” links and IDs.</p>
      </form>

      <form class="section glass" data-form="user">
        <h2>A user’s public gists</h2>
        <label class="sr-only" for="uname">GitHub username</label>
        <div class="field-row">
          <input id="uname" class="field" type="text" placeholder="GitHub username" value="${esc(E.user)}" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="search">
          <button type="submit" class="capsule-btn glass press" style="height:48px;border-radius:24px" aria-label="Search">${icon.search}</button>
        </div>
      </form>
      <div class="cards" data-results></div>

      <div data-recent></div>
    </div>`;

  const resultsEl = el.querySelector('[data-results]');
  const recentEl = el.querySelector('[data-recent]');

  function paintResults() {
    if (E.loading) { resultsEl.innerHTML = loadingCards(3); return; }
    if (E.error) { resultsEl.innerHTML = `<div class="empty"><strong>No results</strong><p>${esc(E.error)}</p></div>`; return; }
    if (!E.results) { resultsEl.innerHTML = ''; return; }
    if (!E.results.length) { resultsEl.innerHTML = `<div class="empty"><p>@${esc(E.user)} has no public gists.</p></div>`; return; }
    const stars = starredIds();
    resultsEl.innerHTML = `<div class="list-meta" style="padding:0 4px"><span>${E.results.length} public ${E.results.length === 1 ? "gist" : "gists"} by @${esc(E.user)}</span></div>` +
      E.results.map((g) => cardHtml(g, { stars })).join('');
  }

  function paintRecent() {
    if (!S.recent.length) { recentEl.innerHTML = ''; return; }
    const stars = starredIds();
    recentEl.innerHTML = `
      <div class="list-meta" style="margin-top:18px"><span>Recently opened</span><button type="button" data-act="clear">Clear</button></div>
      <div class="cards">${S.recent.map((g) => cardHtml(g, { stars, showOwner: true })).join('')}</div>`;
  }

  async function searchUser(login) {
    E.user = login; E.loading = true; E.error = null; E.results = null;
    paintResults();
    try {
      const list = await api.userGists(login);
      E.results = list;
    } catch (e) {
      E.error = e.status === 404 ? 'User not found' : e.message;
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
      if (!id) { toast('Link or ID not recognized'); return; }
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
