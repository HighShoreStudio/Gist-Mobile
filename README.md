# Gist Mobile

An installable web app (PWA) to manage your **GitHub Gists** on iPhone, with a Liquid Glass look.

- Read, create, edit, delete, star and fork gists, including multi-file gists and revision history
- **Reader**: temporary tabs where you paste or import text (a file, a gist link, a raw URL) to read, edit and copy it without creating a gist. Tabs live in memory only and disappear when you close the app
- Open external gists by link or ID, or browse a user's public gists
- CodeMirror editor with highlighting for C#, JS/TS, JSON, Python, Shell, HTML/CSS, Markdown, YAML, SQL and more
- Works offline (the interface and the last downloaded data)
- No access to the rest of GitHub: only the `gist` scope is needed

## Structure

```
Gist Mobile/
├─ docs/                ← the web app: GitHub Pages serves this folder
│  ├─ index.html
│  ├─ config.js         ← fill in for OAuth sign-in (optional)
│  ├─ manifest.webmanifest, sw.js, icons/
│  ├─ css/app.css
│  ├─ js/               ← app.js (router), api.js, auth.js, state.js, ui.js, code.js, views/
│  └─ vendor/           ← CodeMirror 5 (bundled, no external dependencies)
└─ worker/              ← Cloudflare Worker for "Sign in with GitHub"
   ├─ worker.js
   └─ wrangler.toml
```

No build step: everything is static files.

## Try it on your PC

Start any local server from the `docs` folder, for example:

```
cd docs
python -m http.server 8080
```

Then open `http://localhost:8080` and sign in with a personal token (see below).

## 1. Publish on GitHub Pages

1. Commit and push this folder to the `HighShoreStudio/Gist-Mobile` repository.
2. On GitHub: **Settings → Pages → Build and deployment → Deploy from a branch**, pick `main` and the **`/docs`** folder.
3. After a minute the app is live at `https://highshorestudio.github.io/Gist-Mobile/`.

The repository code is public, but it contains no personal data: your token stays on your iPhone only.

## 2. Sign-in

### Option A: personal token (works right away, no setup)

1. Open <https://github.com/settings/tokens/new?scopes=gist&description=Gist%20Mobile>.
2. Keep only **gist** selected, pick an expiration and generate the token.
3. In the app, paste it into **Personal Access Token** and tap **Connect**.

### Option B: "Sign in with GitHub" (OAuth)

GitHub doesn't let a browser-only app complete the OAuth sign-in, because it needs a secret that can't live in the web app. A small free Worker acts as the go-between.

1. **Create the OAuth App**: GitHub → Settings → Developer settings → OAuth Apps → **New OAuth App**
   - *Homepage URL*: `https://highshorestudio.github.io/Gist-Mobile/`
   - *Authorization callback URL*: `https://highshorestudio.github.io/Gist-Mobile/` (same address)
   - Save the **Client ID** and generate a **Client Secret**.
2. **Create the Worker** at <https://dash.cloudflare.com> → Workers & Pages → **Create → Worker**:
   - Paste the contents of `worker/worker.js` and **Deploy**.
   - In **Settings → Variables and Secrets** add:
     - `GITHUB_CLIENT_ID` (text): the Client ID
     - `GITHUB_CLIENT_SECRET` (**secret**): the Client Secret
     - `ALLOWED_ORIGINS` (text): `https://highshorestudio.github.io` (origin only, without `/Gist-Mobile`)
   - Or, from the command line in the `worker` folder: fill in `wrangler.toml`, then run `npx wrangler deploy` and `npx wrangler secret put GITHUB_CLIENT_SECRET`.
3. **Fill in `docs/config.js`**:
   ```js
   window.GIST_MOBILE_CONFIG = {
     oauthClientId: "YOUR_CLIENT_ID",
     tokenProxyUrl: "https://gist-mobile-oauth.YOURNAME.workers.dev/token"
   };
   ```
4. Push the updated `config.js`. The sign-in screen will show **Sign in with GitHub**, with the token as an alternative.

## 3. Install it on iPhone

1. Open the app's address in **Safari**.
2. Tap **Share** → **Add to Home Screen** → **Add**.
3. Launch it from the icon: it opens full screen, like an app.

The same guide is in the app under **Profile → Install on iPhone**.

## Notes

- **Where the token is stored**: in the installed app's browser storage (`localStorage`). That's less protected than a native app's Keychain, so use a token with only the `gist` scope and, ideally, an expiration. **Profile → Sign out** removes it.
- **Visibility**: GitHub doesn't allow switching a gist between secret and public after it's created, so the option is locked when editing.
- **Updates**: after publishing a new version, bump `VERSION` in `docs/sw.js` so the iPhone downloads the new files.
- **Reader and external links**: some sites don't allow their files to be downloaded from another page (CORS). In that case copy the text and use **Paste**.
- **GitHub limits**: 60 requests per hour without signing in, 5,000 when signed in.

## Licenses

CodeMirror 5 is distributed under the MIT license (`docs/vendor/CODEMIRROR-LICENSE`).
