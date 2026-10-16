// Profilo, impostazioni e guida all'installazione.
import { S, ACCENTS, saveSettings, logout, go } from '../state.js';
import * as api from '../api.js';
import { esc, icon, avatarHtml, confirmSheet, infoSheet, toast } from '../ui.js';

const APP_VERSION = '1.0.0';

export function showInstallGuide() {
  const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  return infoSheet({
    title: standalone ? 'App già installata' : 'Installa sull’iPhone',
    html: standalone
      ? '<p class="hint" style="padding:0 20px 18px;text-align:center">Stai già usando Gistario dalla schermata Home.</p>'
      : `<ol class="steps">
          <li>Apri questa pagina in <strong>Safari</strong>.</li>
          <li>Tocca <strong>Condividi</strong> (il quadrato con la freccia).</li>
          <li>Scegli <strong>Aggiungi alla schermata Home</strong>, poi <strong>Aggiungi</strong>.</li>
          <li>Apri Gistario dalla sua icona: si avvia a schermo intero, come un’app.</li>
        </ol>`
  });
}

export function render(el) {
  const u = S.user;
  el.innerHTML = `
    <div class="scroll pad-bottom" data-scroll>
      <header class="large-header"><h1>Profilo</h1></header>
      ${u ? `
        <div class="profile-head">
          <span class="avatar glass">${avatarHtml(u, 88)}</span>
          <h2>${esc(u.name || u.login)}</h2>
          <p>@${esc(u.login)}</p>
        </div>
        <div class="stats glass">
          <div><strong data-stat="pub">${u.public_gists ?? '–'}</strong><span>Pubblici</span></div>
          <div><strong data-stat="priv">${u.private_gists ?? '–'}</strong><span>Segreti</span></div>
          <div><strong>${S.starred ? S.starred.length : '–'}</strong><span>Con stella</span></div>
        </div>` : `
        <div class="section glass">
          <h2>Non hai effettuato l’accesso</h2>
          <p class="hint">Puoi comunque usare il Reader e aprire i gist pubblici da Esplora.</p>
          <a class="capsule-btn btn-accent press big-btn" href="#/login">Accedi</a>
        </div>`}

      <div class="group glass">
        <div class="row"><span class="grow">Colore</span>
          <div class="swatches" role="group" aria-label="Colore di accento">
            ${ACCENTS.map((c) => `<button type="button" class="swatch press" style="--c:${c}" data-accent="${c}" aria-label="Colore ${c}" aria-pressed="${S.settings.accent === c}"></button>`).join('')}
          </div>
        </div>
        <div class="row"><span class="grow">Dimensione codice</span>
          <div class="stepper">
            <button type="button" data-size="-1" aria-label="Riduci">−</button>
            <span data-size-val>${S.settings.codeSize}</span>
            <button type="button" data-size="1" aria-label="Aumenta">+</button>
          </div>
        </div>
        <div class="row"><span class="grow" id="wrap-lbl">A capo automatico</span>
          <button type="button" class="switch" role="switch" aria-labelledby="wrap-lbl" aria-checked="${S.settings.wrap}" data-act="wrap"></button>
        </div>
      </div>

      <div class="group glass">
        <button type="button" class="row press" data-act="install">${icon.phone}<span class="grow">Installa sull’iPhone</span>${icon.chevronR}</button>
        ${u ? `<a class="row" href="${esc(u.html_url || 'https://github.com/' + u.login)}" target="_blank" rel="noopener">${icon.github}<span class="grow">Profilo su GitHub</span>${icon.external}</a>` : ''}
        ${u ? `<button type="button" class="row danger press" data-act="logout">${icon.key}<span class="grow">Esci</span></button>` : ''}
      </div>
      <p class="hint" style="text-align:center;padding:4px 0 0">Gistario ${APP_VERSION} · i dati restano su questo dispositivo</p>
    </div>`;

  el.addEventListener('click', async (e) => {
    const sw = e.target.closest('[data-accent]');
    if (sw) {
      S.settings.accent = sw.dataset.accent; saveSettings();
      el.querySelectorAll('[data-accent]').forEach((b) => b.setAttribute('aria-pressed', String(b === sw)));
      return;
    }
    const sz = e.target.closest('[data-size]');
    if (sz) {
      S.settings.codeSize = Math.max(10, Math.min(20, S.settings.codeSize + Number(sz.dataset.size)));
      saveSettings();
      el.querySelector('[data-size-val]').textContent = S.settings.codeSize;
      return;
    }
    const a = e.target.closest('[data-act]');
    if (!a) return;
    if (a.dataset.act === 'wrap') {
      S.settings.wrap = !S.settings.wrap; saveSettings();
      a.setAttribute('aria-checked', String(S.settings.wrap));
    }
    if (a.dataset.act === 'install') showInstallGuide();
    if (a.dataset.act === 'logout') {
      const ok = await confirmSheet({ title: 'Vuoi uscire?', message: 'Il token verrà rimosso da questo dispositivo.', ok: 'Esci', danger: true });
      if (!ok) return;
      logout();
      toast('Sei uscito');
      go('/login', { replace: true });
    }
  });

  // aggiorna i contatori
  if (u) {
    api.me().then((fresh) => {
      Object.assign(S.user, { public_gists: fresh.public_gists, private_gists: fresh.private_gists, name: fresh.name, avatar_url: fresh.avatar_url });
      const p = el.querySelector('[data-stat="pub"]'); const q = el.querySelector('[data-stat="priv"]');
      if (p) p.textContent = fresh.public_gists; if (q) q.textContent = fresh.private_gists ?? '–';
    }).catch(() => {});
  }
}
