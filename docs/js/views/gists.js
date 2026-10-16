// My gists and starred gists.
import { S, LS, setGists, setStarred, starredIds, go } from '../state.js';
import * as api from '../api.js';
import { esc, icon, relTime, langInfo, firstFile, fileCount, actionSheet, avatarHtml, loadingCards, toast } from '../ui.js';

const FILTERS = [['all', 'All'], ['star', 'Starred'], ['pub', 'Public'], ['sec', 'Secret']];
const SORTS = { updated: 'Last updated', created: 'Date created', name: 'Name (A–Z)' };

export function cardHtml(g, { stars, showOwner = false } = {}) {
  const f = firstFile(g);
  const lang = langInfo(f.filename, f.language);
  const starred = stars && stars.has(g.id);
  const meta = [
    `<span class="lang"><span class="dot" style="--c:${lang.color}"></span>${esc(lang.name)}</span>`,
    `<span>${fileCount(g)}</span>`,
    showOwner && g.owner ? `<span>@${esc(g.owner.login)}</span>` : `<span>${g.public ? 'Public' : 'Secret'}</span>`,
    `<span class="when">${esc(relTime(g.updated_at))}</span>`
  ].join('');
  return `<a class="card" href="#/gist/${esc(g.id)}">
    <div class="card-top"><span class="card-name">${esc(f.filename)}</span>${starred ? icon.starSmall : ''}</div>
    ${g.description ? `<p class="card-desc">${esc(g.description)}</p>` : ''}
    <div class="card-meta">${meta}</div>
  </a>`;
}

function matches(g, q) {
  if (!q) return true;
  const hay = [g.description || '', ...Object.values(g.files || {}).map((f) => f.filename + ' ' + (f.language || '')), g.owner ? g.owner.login : ''].join(' ').toLowerCase();
  return q.toLowerCase().split(/\s+/).every((w) => hay.includes(w));
}

function sortList(list, sort) {
  const arr = list.slice();
  if (sort === 'name') arr.sort((a, b) => firstFile(a).filename.localeCompare(firstFile(b).filename, 'en', { sensitivity: 'base' }));
  else if (sort === 'created') arr.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
  else arr.sort((a, b) => (b.updated_at || '').localeCompare(a.updated_at || ''));
  return arr;
}

export function render(el, { mode }) {
  const mine = mode === 'mine';
  const st = mine ? S.list : S.starList;
  let loading = false; let error = null;

  el.innerHTML = `
    <div class="scroll pad-bottom" data-scroll>
      <div class="ptr" data-ptr><span class="spin"></span></div>
      <header class="large-header">
        <h1>${mine ? 'Gists' : 'Starred'}</h1>
        <a class="avatar glass press" href="#/profile" aria-label="Profile and account">${avatarHtml(S.user, 44)}</a>
      </header>
      <div class="searchbar glass">
        ${icon.search}
        <label class="sr-only" for="q">Search</label>
        <input id="q" type="search" enterkeyhint="search" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" placeholder="Search name, description, language" value="${esc(st.query)}">
      </div>
      ${mine ? `<div class="chips" role="group" aria-label="Filters">${FILTERS.map(([k, l]) => `<button type="button" class="chip press" data-filter="${k}" aria-pressed="${st.filter === k}">${l}</button>`).join('')}</div>` : ''}
      <div class="list-meta"><span data-count></span>
        <button type="button" data-act="sort">${esc(SORTS[S.list.sort])}${icon.chevron}</button>
      </div>
      <div class="cards" data-cards></div>
    </div>
    ${mine ? `<a class="fab btn-accent press" href="#/new" aria-label="New gist">${icon.plus}</a>` : ''}`;

  const cardsEl = el.querySelector('[data-cards]');
  const countEl = el.querySelector('[data-count]');
  const scroller = el.querySelector('[data-scroll]');

  function paint() {
    const source = mine ? S.gists : S.starred;
    if (!source) {
      countEl.textContent = '';
      cardsEl.innerHTML = error ? errorHtml(error) : loadingCards();
      return;
    }
    const stars = starredIds();
    let list = source.filter((g) => matches(g, st.query));
    if (mine) {
      if (st.filter === 'star') list = (S.starred || []).filter((g) => matches(g, st.query));
      else if (st.filter === 'pub') list = list.filter((g) => g.public);
      else if (st.filter === 'sec') list = list.filter((g) => !g.public);
    }
    list = sortList(list, S.list.sort);
    countEl.textContent = list.length === 1 ? '1 gist' : list.length + ' gists';
    if (!list.length) {
      cardsEl.innerHTML = `<div class="empty">${st.query ? '<strong>No results</strong><p>Try a different word.</p>'
        : mine ? '<strong>No gists yet</strong><p>Tap + to create one.</p>'
          : '<strong>No starred gists</strong><p>Open a gist and tap the star to find it here.</p>'}</div>`;
      return;
    }
    const showOwner = !mine || st.filter === 'star';
    cardsEl.innerHTML = list.map((g) => cardHtml(g, { stars, showOwner })).join('');
  }

  function errorHtml(msg) {
    return `<div class="empty"><strong>Couldn’t load</strong><p>${esc(msg)}</p><button type="button" class="capsule-btn glass press" data-act="retry">Try again</button></div>`;
  }

  async function load() {
    if (loading) return;
    loading = true; error = null;
    try {
      const [own, stars] = await Promise.all([
        mine ? api.listGists() : Promise.resolve(null),
        api.listStarred().catch((e) => { if (!mine) throw e; return null; })
      ]);
      if (own) setGists(own);
      if (stars) setStarred(stars);
    } catch (e) {
      error = e.message;
      if (e.status === 401) toast('Session expired: please sign in again', 3000);
      else if ((mine ? S.gists : S.starred)) toast(e.message);
    } finally {
      loading = false;
      if (el.isConnected) paint();
    }
  }

  el.addEventListener('input', (e) => {
    if (e.target.id === 'q') { st.query = e.target.value; paint(); }
  });
  el.addEventListener('click', async (e) => {
    const f = e.target.closest('[data-filter]');
    if (f) {
      st.filter = f.dataset.filter;
      el.querySelectorAll('[data-filter]').forEach((b) => b.setAttribute('aria-pressed', String(b === f)));
      paint();
      return;
    }
    const act = e.target.closest('[data-act]');
    if (!act) return;
    if (act.dataset.act === 'retry') { paint(); load(); }
    if (act.dataset.act === 'sort') {
      const k = await actionSheet({ title: 'Sort by', items: Object.entries(SORTS).map(([key, label]) => ({ key, label: (S.list.sort === key ? '✓ ' : '') + label })) });
      if (k) {
        S.list.sort = k; LS.set('sort', k);
        act.innerHTML = esc(SORTS[k]) + icon.chevron;
        paint();
      }
    }
  });

  // Pull down to refresh
  const ptr = el.querySelector('[data-ptr]');
  let startY = null; let pulled = false;
  scroller.addEventListener('touchstart', (e) => { startY = scroller.scrollTop <= 0 ? e.touches[0].clientY : null; pulled = false; }, { passive: true });
  scroller.addEventListener('touchmove', (e) => {
    if (startY == null) return;
    const dy = e.touches[0].clientY - startY;
    if (dy > 80 && !pulled) { pulled = true; ptr.classList.add('on'); }
  }, { passive: true });
  scroller.addEventListener('touchend', async () => {
    if (pulled) { await load(); ptr.classList.remove('on'); }
    startY = null; pulled = false;
  });

  paint();
  load();
}

// used by other views to open a gist
export function openGist(id) { go('/gist/' + id); }
