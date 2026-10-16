// Configurazione di Gistario.
// Lascia vuoti i due campi per usare solo l'accesso con Personal Access Token.
// Per abilitare "Accedi con GitHub" (OAuth) segui il README:
//  - oauthClientId: il Client ID della tua OAuth App su GitHub
//  - tokenProxyUrl: l'URL del Cloudflare Worker, es. "https://gistario-oauth.tuonome.workers.dev/token"
window.GISTARIO_CONFIG = {
  oauthClientId: "",
  tokenProxyUrl: ""
};
