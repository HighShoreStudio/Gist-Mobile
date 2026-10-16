// Startup, router and tab bar handling.
import { S, applySettings, go } from './state.js';
import * as auth from './auth.js';
import { toast } from './ui.js';
import * as gists from './views/gists.js';
import * as viewer from './views/viewer.js';
import * as editor from './views/editor.js';
import * as reader from './views/reader.js';
import * as explore from './views/explore.js';
import * as profile from './views/profile.js';
import * as login from './views/login.js';

const app = document.getElementById('app');
const tabbar = document.getElementById('tabbar');
let current = null; // { el, cleanup, path }

const ROUTES = [
  { re: /^\/gists$/, tab: 'gists', render: (el) => gists.render(el, { mode: 'mine' }), auth: true },
  { re: /^\/starred$/, tab: 'starred', render: (el) => gists.render(el, { mode: 'starred' }), auth: true },
  { re: /^\/reader$/, tab: 'reader', render: (el) => reader.render(el) },
  { re: /^\/explore$/, tab: 'explore', render: (el) => explore.render(el) },
  { re: /^\/profile$/, tab: 'profile', render: (el) => profile.render(el) },
  { re: /^\/login$/, render: (el) => login.render(el) },
  { re: /^\/new$/, render: (el) => editor.render(el, {}), auth: true, push: true },
  { re: /^\/edit\/([\w]+)$/, render: (el, m) => editor.render(el, { id: m[1] }), auth: true, push: true },
  { re: /^\/gist\/([\w]+)\/rev\/([\w]+)$/, render: (el, m) => viewer.render(el, { id: m[1], sha: m[2] }), push: true },
  { re: /^\/gist\/([\w]+)$/, render: (el, m) => viewer.render(el, { id: m[1] }), push: true }
];

function currentPath() {
  const h = location.hash.replace(/^#/, '');
  return h || (S.token ? '/gists' : '/login');
}

function route() {
  const path = currentPath();
  let match = null; let r = null;
  for (const candidate of ROUTES) {
    const m = path.match(candidate.re);
    if (m) { match = m; r = candidate; break; }
  }
  if (!r) { go(S.token ? '/gists' : '/login', { replace: true }); return; }
  if (r.auth && !S.token) { go('/login', { replace: true }); return; }
  if (path === '/login' && S.token) { go('/gists', { replace: true }); return; }

  // save the scroll position of the view being closed
  if (current) {
    const sc = current.el.querySelector('[data-scroll]');
    if (sc) S.scroll[current.path] = sc.scrollTop;
    try { current.cleanup && current.cleanup(); } catch (e) { console.error(e); }
    current.el.remove();
  }

  if (r.tab) S.lastTab = path;
  document.body.classList.toggle('no-tabbar', !r.tab);
  tabbar.querySelectorAll('a').forEach((a) => {
    if (a.dataset.tab === r.tab) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });

  const el = document.createElement('section');
  el.className = 'view' + (r.push ? ' push' : '');
  app.appendChild(el);
  let cleanup;
  try { cleanup = r.render(el, match); } catch (e) { console.error(e); toast('Error: ' + e.message); }
  current = { el, cleanup: typeof cleanup === 'function' ? cleanup : null, path };
  const sc = el.querySelector('[data-scroll]');
  if (sc && S.scroll[path]) requestAnimationFrame(() => { sc.scrollTop = S.scroll[path]; });
}

// Real available height (iOS keyboard included)
function syncViewport() {
  const vv = window.visualViewport;
  const h = vv ? vv.height : window.innerHeight;
  document.documentElement.style.setProperty('--app-h', h + 'px');
  const kb = vv ? window.innerHeight - vv.height > 140 : false;
  document.body.classList.toggle('kb-open', kb);
  if (kb) window.scrollTo(0, 0);
}

async function boot() {
  applySettings();
  syncViewport();
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', syncViewport);
    window.visualViewport.addEventListener('scroll', () => window.scrollTo(0, 0));
  }
  window.addEventListener('resize', syncViewport);

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js').catch(() => { /* offline unavailable */ });
  }

  // Return from OAuth sign-in
  if (auth.hasCallback() && auth.oauthAvailable()) {
    app.innerHTML = '<section class="view"><div class="empty" style="flex:1"><span class="spin"></span><strong>Signing in…</strong></div></section>';
    try {
      const user = await auth.finishOAuth();
      toast('Hi ' + (user.name || user.login) + '!');
    } catch (e) {
      toast(e.message, 3200);
      location.replace('#/login');
    }
    app.innerHTML = '';
  }

  window.addEventListener('hashchange', route);
  route();
}

boot();
