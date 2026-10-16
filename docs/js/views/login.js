// Accesso con GitHub (OAuth) o con Personal Access Token.
import { go } from '../state.js';
import * as auth from '../auth.js';
import { esc, icon, toast } from '../ui.js';
import { showInstallGuide } from './profile.js';

const TOKEN_URL = 'https://github.com/settings/tokens/new?scopes=gist&description=Gistario';

export function render(el) {
  const oauth = auth.oauthAvailable();
  el.innerHTML = `
    <div class="scroll" data-scroll>
      <div class="login">
        <div style="display:flex;flex-direction:column;gap:16px;padding:0 4px">
          <div class="logo glass">{ }</div>
          <h1>I tuoi snippet,<br>sempre in tasca.</h1>
          <p class="lead">Collega il tuo account GitHub per leggere, creare e modificare i tuoi gist. L’app usa solo il permesso sui gist.</p>
        </div>

        <div class="card-form glass">
          ${oauth ? `
            <button type="button" class="capsule-btn btn-accent press big-btn" data-act="oauth">${icon.github}Accedi con GitHub</button>
            <button type="button" class="btn-plain" data-act="toggle-token" aria-expanded="false">Usa un token personale</button>` : ''}
          <form data-token-form ${oauth ? 'hidden' : ''} style="display:flex;flex-direction:column;gap:12px">
            <label class="label" for="token" style="margin:0 0 -4px 4px">Personal Access Token</label>
            <div class="field-row" style="position:relative">
              <input id="token" class="field mono" type="password" placeholder="ghp_…" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" style="padding-right:52px">
              <button type="button" class="circle-btn" data-act="eye" aria-label="Mostra token" style="position:absolute;right:2px;color:var(--text-2)">${icon.eye}</button>
            </div>
            <p class="hint">Serve solo il permesso <code class="inline">gist</code>. Il token resta salvato su questo dispositivo.</p>
            <button type="submit" class="capsule-btn ${oauth ? 'glass' : 'btn-accent'} press big-btn" data-submit>Connetti</button>
            <a class="btn-plain" style="display:flex;align-items:center;justify-content:center" href="${esc(TOKEN_URL)}" target="_blank" rel="noopener">Crea un token su GitHub</a>
          </form>
        </div>

        <a class="link-card glass press" href="#/explore">
          ${icon.globe}
          <span class="t"><strong>Esplora senza account</strong><span>Apri gist pubblici o usa il Reader</span></span>
          ${icon.chevronR}
        </a>
        <button type="button" class="btn-plain" data-act="install" style="align-self:center">Come installarla sull’iPhone</button>
      </div>
    </div>`;

  const form = el.querySelector('[data-token-form]');
  const input = el.querySelector('#token');

  el.addEventListener('click', (e) => {
    const a = e.target.closest('[data-act]');
    if (!a) return;
    if (a.dataset.act === 'oauth') { a.disabled = true; auth.startOAuth(); }
    if (a.dataset.act === 'toggle-token') {
      form.hidden = !form.hidden;
      a.setAttribute('aria-expanded', String(!form.hidden));
      if (!form.hidden) setTimeout(() => input.focus(), 50);
    }
    if (a.dataset.act === 'eye') {
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      a.setAttribute('aria-label', show ? 'Nascondi token' : 'Mostra token');
    }
    if (a.dataset.act === 'install') showInstallGuide();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('[data-submit]');
    btn.disabled = true; btn.innerHTML = '<span class="spin"></span>';
    try {
      const user = await auth.loginWithToken(input.value);
      toast('Ciao ' + (user.name || user.login) + '!');
      go('/gists', { replace: true });
    } catch (err) {
      toast(err.status === 401 ? 'Token non valido' : err.message, 3000);
      btn.disabled = false; btn.textContent = 'Connetti';
    }
  });
}
