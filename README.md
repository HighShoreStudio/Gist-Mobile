# Gistario

Webapp installabile (PWA) per gestire i tuoi **GitHub Gist** dall'iPhone, in stile Liquid Glass.

- Leggi, crea, modifica, elimina, metti la stella e fai il fork dei gist, anche con più file e con la cronologia delle revisioni
- **Reader**: schede temporanee in cui incollare o importare testo (file, link a un gist, URL raw) per leggerlo, modificarlo e copiarlo senza creare gist. Le schede restano solo in memoria e spariscono quando chiudi l'app
- Apri gist esterni tramite link o ID, oppure sfoglia i gist pubblici di un utente
- Editor CodeMirror con evidenziazione per C#, JS/TS, JSON, Python, Shell, HTML/CSS, Markdown, YAML, SQL e altri
- Funziona offline (interfaccia e ultimi dati scaricati)
- Nessun accesso ad altre parti di GitHub: serve solo il permesso `gist`

## Struttura

```
Gist Mobile/
├─ docs/                ← la webapp: GitHub Pages pubblica questa cartella
│  ├─ index.html
│  ├─ config.js         ← da compilare per l'accesso OAuth (facoltativo)
│  ├─ manifest.webmanifest, sw.js, icons/
│  ├─ css/app.css
│  ├─ js/               ← app.js (router), api.js, auth.js, state.js, ui.js, code.js, views/
│  └─ vendor/           ← CodeMirror 5 (già incluso, nessuna dipendenza esterna)
└─ worker/              ← Cloudflare Worker per "Accedi con GitHub"
   ├─ worker.js
   └─ wrangler.toml
```

Non serve nessuna build: sono file statici.

## Provarla sul PC

Dalla cartella `docs` avvia un server locale qualsiasi, per esempio:

```
cd docs
python -m http.server 8080
```

Poi apri `http://localhost:8080`. Accedi con un token personale (vedi sotto).

## 1. Pubblicarla su GitHub Pages

1. Fai commit e push di questa cartella sul repository `HighShoreStudio/Gist-Mobile`.
2. Su GitHub: **Settings → Pages → Build and deployment → Deploy from a branch**, scegli `main` e la cartella **`/docs`**.
3. Dopo un minuto l'app è su `https://highshorestudio.github.io/Gist-Mobile/`.

Il codice del repository è pubblico, ma non contiene dati personali: il token resta solo sul tuo iPhone.

## 2. Accesso

### Opzione A: token personale (subito, senza configurare nulla)

1. Apri <https://github.com/settings/tokens/new?scopes=gist&description=Gistario>.
2. Lascia selezionato solo **gist**, scegli la scadenza e genera il token.
3. Nell'app incollalo in **Personal Access Token** e premi **Connetti**.

### Opzione B: "Accedi con GitHub" (OAuth)

GitHub non permette di completare il login OAuth solo dal browser, perché serve un segreto che non può stare nella webapp. Per questo c'è un piccolo Worker gratuito che fa da intermediario.

1. **Crea la OAuth App**: GitHub → Settings → Developer settings → OAuth Apps → **New OAuth App**
   - *Homepage URL*: `https://highshorestudio.github.io/Gist-Mobile/`
   - *Authorization callback URL*: `https://highshorestudio.github.io/Gist-Mobile/` (lo stesso indirizzo)
   - Salva il **Client ID** e genera un **Client Secret**.
2. **Crea il Worker** su <https://dash.cloudflare.com> → Workers & Pages → **Create → Worker**:
   - Incolla il contenuto di `worker/worker.js` e fai **Deploy**.
   - In **Settings → Variables and Secrets** aggiungi:
     - `GITHUB_CLIENT_ID` (testo): il Client ID
     - `GITHUB_CLIENT_SECRET` (**secret**): il Client Secret
     - `ALLOWED_ORIGINS` (testo): `https://highshorestudio.github.io` (solo l'origine, senza `/Gist-Mobile`)
   - In alternativa, da riga di comando nella cartella `worker`: compila `wrangler.toml`, poi `npx wrangler deploy` e `npx wrangler secret put GITHUB_CLIENT_SECRET`.
3. **Compila `docs/config.js`**:
   ```js
   window.GISTARIO_CONFIG = {
     oauthClientId: "IL_TUO_CLIENT_ID",
     tokenProxyUrl: "https://gistario-oauth.TUONOME.workers.dev/token"
   };
   ```
4. Ricarica `config.js` su GitHub Pages. Nella schermata di accesso comparirà **Accedi con GitHub**, con il token come alternativa.

## 3. Installarla sull'iPhone

1. Apri l'indirizzo dell'app in **Safari**.
2. Tocca **Condividi** → **Aggiungi alla schermata Home** → **Aggiungi**.
3. Avviala dall'icona: si apre a schermo intero, come un'app.

La stessa guida è anche nell'app, in **Profilo → Installa sull'iPhone**.

## Note

- **Dove sta il token**: nella memoria del browser dell'app installata (`localStorage`). È meno protetto del Portachiavi di un'app nativa: usa un token con il solo permesso `gist` e, se vuoi, con una scadenza. **Profilo → Esci** lo cancella.
- **Visibilità**: GitHub non permette di cambiare un gist da segreto a pubblico (o viceversa) dopo averlo creato, quindi in modifica l'opzione è bloccata.
- **Aggiornamenti**: dopo aver caricato una nuova versione, aumenta `VERSION` in `docs/sw.js`, così l'iPhone scarica i file nuovi.
- **Reader e link esterni**: alcuni siti non permettono di scaricare i loro file da un'altra pagina (CORS). In quel caso copia il testo e usa **Incolla**.
- **Limiti di GitHub**: senza accesso puoi fare 60 richieste l'ora; con l'accesso, 5.000.

## Licenze

CodeMirror 5 è distribuito con licenza MIT (`docs/vendor/CODEMIRROR-LICENSE`).
