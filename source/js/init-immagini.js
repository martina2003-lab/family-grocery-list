// Converte un URL in base64 e lo salva in localStorage
async function fetchToBase64(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch { return null; }
}

const SFONDO_CHIARO_KEY = 'sfondoChiaro_v1';
const SFONDO_SCURO_KEY  = 'sfondoScuro_v1';

// Pulisce tutte le vecchie chiavi sfondo
['sfondoApp','sfondoApp_v2','sfondoApp_v3','sfondoApp_v4',
 'sfondoApp_v5','sfondoApp_v6','sfondoApp_v7','sfondoApp_v8','sfondoApp_v9'
].forEach(k => localStorage.removeItem(k));

async function inizializzaImmagini() {
  // ── Foto utenti ──────────────────────────────────────────────
  const fotoDefault = Storage.get('fotoDefault', {});
  const fotoCustom  = Storage.get('fotoCustom', {});
  let aggiornato = false;

  for (const m of MEMBRI) {
    if (fotoCustom[m.nome]) continue;
    if (fotoDefault[m.nome]) continue;
    const b64 = await fetchToBase64(m.foto);
    if (b64) { fotoDefault[m.nome] = b64; aggiornato = true; }
  }
  if (aggiornato) Storage.set('fotoDefault', fotoDefault);

  // ── Sfondi chiaro e scuro ────────────────────────────────────
  if (!Storage.get(SFONDO_CHIARO_KEY, null)) {
    const b64 = await fetchToBase64('img/backgrounds/light-mode/background.png');
    if (b64) Storage.set(SFONDO_CHIARO_KEY, b64);
  }
  if (!Storage.get(SFONDO_SCURO_KEY, null)) {
    const b64 = await fetchToBase64('img/backgrounds/dark-mode/background.jpg');
    if (b64) Storage.set(SFONDO_SCURO_KEY, b64);
  }

  // Applica sfondo corretto per il tema attuale
  applicaSfondoTema(Storage.getTema());
}

function applicaSfondoTema(tema) {
  const key = tema === 'dark' ? SFONDO_SCURO_KEY : SFONDO_CHIARO_KEY;
  const src = Storage.get(key, null);
  if (src) applicaSfondo(src);
}

function applicaSfondo(src) {
  // Imposta la variabile sulla radice (html): il background dell'elemento radice
  // viene propagato all'intero canvas fisico dello schermo su iOS standalone,
  // riempiendo tutte le safe area senza lasciare strisce vuote in fondo.
  document.documentElement.style.setProperty('--sfondo-url', `url('${src}')`);
}

// Avvia al caricamento della pagina
document.addEventListener('DOMContentLoaded', () => {
  // Applica subito da cache senza aspettare fetch
  applicaSfondoTema(Storage.getTema());
  inizializzaImmagini();
});
