// ── Navigazione ──────────────────────────────────────────────
let schermataAttiva = 'lista';

function navigaA(id) {
  document.querySelectorAll('.schermata').forEach(s => s.classList.remove('attiva'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('attivo'));
  const el = document.getElementById('schermata-' + id);
  if (el) el.classList.add('attiva');
  const nb = document.querySelector(`.nav-btn[data-schermata="${id}"]`);
  if (nb) nb.classList.add('attivo');
  schermataAttiva = id;

  if (id === 'dashboard') renderDashboard();
  if (id === 'preferiti') renderPreferiti();
  if (id === 'lista') renderLista();
  if (id === 'profilo') renderProfilo();
}

// ── Vado a fa la spesa ───────────────────────────────────────
// Se un altro membro sta già facendo la spesa, non scavalcarlo in silenzio:
// probabilmente è stato un tocco per sbaglio (bottone dello stesso posto della
// lista). Si chiede conferma prima di sostituirlo. Se invece è la stessa
// persona già attiva (es. un secondo dispositivo), si parte diretti.
function vadoAFaLaSpesa() {
  const chiSpesa = Storage.get('chiStaFacendoLaSpesa', null);
  const membroAttivo = Storage.getMembroAttivo();
  if (chiSpesa && chiSpesa.nome && chiSpesa.nome !== membroAttivo) {
    apriConfermaSubentroSpesa(chiSpesa);
    return;
  }
  avviaSpesa();
}

function avviaSpesa() {
  const nome   = Storage.getMembroAttivo();
  const membro = getMembroByNome(nome);
  Storage.set('chiStaFacendoLaSpesa', {
    nome, emoji: membro.emoji, colore: membro.colore, foto: membro.foto || null,
    iniziata: new Date().toISOString(),
  });
  aggiornaBannerSpesa();
  renderLista();
}

// "da 5 minuti" / "da 2 ore" ecc. Ritorna '' se manca il timestamp (sessioni
// salvate prima di questa funzionalità: si omette la parte "da quanto").
function formattaTempoTrascorso(iso) {
  if (!iso) return '';
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1)  return 'da pochi secondi';
  if (min < 60) return `da ${min} minut${min === 1 ? 'o' : 'i'}`;
  const ore = Math.round(min / 60);
  return `da ${ore} or${ore === 1 ? 'a' : 'e'}`;
}

function apriConfermaSubentroSpesa(chiSpesa) {
  const testoEl = document.getElementById('modal-subentro-testo');
  if (testoEl) {
    const fa = formattaTempoTrascorso(chiSpesa.iniziata);
    testoEl.textContent = `${getDisplayNome(chiSpesa.nome)} sta già facendo la spesa${fa ? ' ' + fa : ''}. Vuoi prendere il suo posto?`;
  }
  document.getElementById('modal-conferma-subentro')?.classList.remove('hidden');
}

function chiudiConfermaSubentro() {
  document.getElementById('modal-conferma-subentro')?.classList.add('hidden');
}

function confermaSubentroSpesa() {
  chiudiConfermaSubentro();
  avviaSpesa();
}

function aggiornaBannerSpesa() {
  const banner = document.getElementById('banner-spesa');
  if (!banner) return;
  let chi = Storage.get('chiStaFacendoLaSpesa', null);
  if (chi && typeof chi !== 'object') chi = null;
  const testoEl  = document.getElementById('banner-spesa-testo');
  const azioniEl = document.getElementById('banner-spesa-azioni');

  if (chi && chi.nome) {
    banner.style.setProperty('--mc', chi.colore || '#0ea5e9');

    const avatarHtml = chi.foto
      ? `<img class="banner-avatar" src="${chi.foto}" alt="${chi.nome}">`
      : `<div class="banner-avatar-emoji">${chi.emoji || '👤'}</div>`;

    // Ricostruisci contenuto banner (prima dei bottoni azioni)
    banner.innerHTML = `
      <img class="banner-anim" src="/img/go-shopping-icon/animation.webp" alt="">
      ${avatarHtml}
      <span id="banner-spesa-testo" class="banner-testo">sta a fa la spesa</span>
      <div id="banner-spesa-azioni" class="hidden">
        <button class="banner-btn fine"   onclick="fineSpesa()">Fine</button>
        <button class="banner-btn annulla" onclick="annullaSpesa()">✕</button>
      </div>`;

    banner.classList.remove('hidden');

    const sonoIo = chi.nome === Storage.getMembroAttivo();
    document.getElementById('banner-spesa-azioni')?.classList.toggle('hidden', !sonoIo);

  } else {
    banner.classList.add('hidden');
  }
}

// Stato salvato prima di chiudere la spesa. NB: fineSpesa vive in lista.js
// (opera sull'array lista ed è condivisa col completamento automatico);
// qui c'è solo l'overlay di conferma/annullo.
//
// Vive su Storage (sincronizzato su Supabase), NON in una semplice variabile
// JS: la lista era già stata aggiornata a questo punto (prodotti spuntati
// eliminati, resto marcato "non acquistato"), ma le statistiche si scrivono
// solo alla conferma con ✓ — se l'app si ricarica o viene chiusa da iOS
// mentre l'overlay è aperto, una variabile in memoria sparirebbe e quella
// spesa non verrebbe MAI contata, senza che nessuno se ne accorga. Con
// Storage, al prossimo avvio dell'app la conferma in sospeso viene
// ripresentata (vedi ripristinaConfermaFineSpesa in fondo al file).
function mostraOverlayFineSpesa(snapshot) {
  Storage.set('spesaInAttesaConferma', snapshot || null);
  document.getElementById('overlay-fine-spesa')?.classList.remove('hidden');
}

function confermaFineSpesa() {
  // La spesa viene contata SOLO qui, alla conferma con ✓: se prima si
  // annulla con ✕ non c'è nessun conteggio da disfare.
  const snapshot = Storage.get('spesaInAttesaConferma', null);
  if (snapshot) {
    registraSpesaCompletata(snapshot.chi, snapshot.spuntati);
  }
  Storage.set('spesaInAttesaConferma', null);
  document.getElementById('overlay-fine-spesa')?.classList.add('hidden');
}

function annullaFineSpesa() {
  // Ripristina lista e sessione spesa
  const snapshot = Storage.get('spesaInAttesaConferma', null);
  if (snapshot) {
    lista = snapshot.lista;
    Storage.setLista(lista);
    Storage.set('chiStaFacendoLaSpesa', snapshot.chi);
    Storage.set('spesaInAttesaConferma', null);
    renderLista();
    aggiornaBannerSpesa();
  }
  document.getElementById('overlay-fine-spesa')?.classList.add('hidden');
}

// All'avvio dell'app: se c'è una conferma di fine spesa rimasta in sospeso
// (l'app si è ricaricata/chiusa prima che si toccasse ✓ o ✕), la ripropone —
// ma SOLO a chi ha fatto quella spesa, non a tutta la famiglia.
function ripristinaConfermaFineSpesa() {
  const snapshot = Storage.get('spesaInAttesaConferma', null);
  if (snapshot && snapshot.chi && snapshot.chi.nome === Storage.getMembroAttivo()) {
    document.getElementById('overlay-fine-spesa')?.classList.remove('hidden');
  }
}

function annullaSpesa() {
  // Ripristina tutto: deSpunta i prodotti e cancella la sessione
  lista = lista.map(p => ({ ...p, spuntato: false, nonAcquistato: false }));
  Storage.setLista(lista);
  Storage.set('chiStaFacendoLaSpesa', null);
  document.getElementById('banner-spesa')?.classList.add('hidden');
  renderLista();
}

// ── Profilo utente ────────────────────────────────────────────
function getFotoAttiva(membro) {
  const custom = Storage.get('fotoCustom', {});
  return custom[membro.nome] || membro.foto || null;
}

function renderProfilo() {
  const nomeBase = Storage.getMembroAttivo();
  const membro   = getMembroByNome(nomeBase);
  const nomeDisplay = getDisplayNome(nomeBase);
  const fotoSrc = getFotoAttiva(membro);

  // Avatar grande cliccabile
  const avatarWrap = document.getElementById('profilo-avatar-wrap');
  if (avatarWrap) {
    const imgHtml = fotoSrc
      ? `<img src="${fotoSrc}" alt="${escapeHtml(nomeDisplay)}" class="profilo-avatar-img" style="border-color:${membro.colore}">`
      : `<div class="profilo-avatar-emoji" style="border-color:${membro.colore}">${membro.emoji}</div>`;
    avatarWrap.innerHTML = `
      <div class="profilo-avatar-click" onclick="document.getElementById('profilo-file-input').click()">
        ${imgHtml}
        <div class="profilo-avatar-overlay">📷</div>
      </div>
      <input type="file" id="profilo-file-input" accept="image/*" style="display:none" onchange="cambiaFotoProfilo(this)">`;
  }

  // Saluto (solo il nome)
  const salutoEl = document.getElementById('profilo-saluto');
  if (salutoEl) salutoEl.textContent = nomeDisplay;

  // Stats
  const storico = Storage.getStorico();
  const mese = new Date().getMonth(), anno = new Date().getFullYear();
  const totale = storico.filter(s => s.aggiuntoDa === nomeBase).length;
  const questoMese = storico.filter(s => {
    if (s.aggiuntoDa !== nomeBase) return false;
    const d = new Date(s.data || s.dataAggiunta);
    return d.getMonth() === mese && d.getFullYear() === anno;
  }).length;

  const speseFatte = Storage.get('speseFatte', {})[nomeBase] || 0;

  const statsEl = document.getElementById('profilo-stats');
  if (statsEl) {
    statsEl.innerHTML = `
      <div class="profilo-stat"><span class="profilo-stat-val" style="color:${membro.colore}">${questoMese}</span><span class="profilo-stat-label">prodotti questo mese</span></div>
      <div class="profilo-stat"><span class="profilo-stat-val" style="color:${membro.colore}">${totale}</span><span class="profilo-stat-label">prodotti in totale</span></div>
      <div class="profilo-stat"><span class="profilo-stat-val" style="color:${membro.colore}">${speseFatte}</span><span class="profilo-stat-label">spese completate</span></div>`;
  }

  // Zona amministratore: visibile solo a chi ha admin:true
  document.getElementById('profilo-sezione-admin')?.classList.toggle('hidden', !membro.admin);

  // Storyboard settimanale
  const sbEl = document.getElementById('profilo-storyboard');
  if (!sbEl) return;
  const sette = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const log = Storage.get('storicoSpese', []).filter(s => s.chi === nomeBase && new Date(s.data).getTime() >= sette);
  if (!log.length) {
    sbEl.innerHTML = `<p class="storyboard-vuoto">Nessuna spesa questa settimana</p>`;
    return;
  }
  const giorni = ['Dom','Lun','Mar','Mer','Gio','Ven','Sab'];
  sbEl.innerHTML = log.map(s => {
    const d = new Date(s.data);
    const label = `${giorni[d.getDay()]} ${d.getDate()}/${d.getMonth()+1}`;
    // Le voci vecchie (prima di questa modifica) sono semplici stringhe;
    // quelle nuove sono {nome, categoria, quantita} — qui serve solo il nome.
    const prodotti = s.prodotti.length
      ? s.prodotti.map(raw => {
          const nome = typeof raw === 'string' ? raw : raw.nome;
          return `<li>${escapeHtml(nome.charAt(0).toUpperCase() + nome.slice(1))}</li>`;
        }).join('')
      : '<li style="opacity:0.5">Nessun prodotto spuntato</li>';
    return `
      <div class="story-card">
        <div class="story-header" style="color:${membro.colore}">
          <span class="story-nome">${escapeHtml(nomeDisplay)}</span>
          <span class="story-data">${label}</span>
        </div>
        <ul class="story-prodotti">${prodotti}</ul>
      </div>`;
  }).join('');
}

function toggleStoryboardProfilo() {
  const contenuto = document.getElementById('profilo-storyboard');
  const freccia   = document.getElementById('profilo-storyboard-freccia');
  if (!contenuto) return;
  const aperto = !contenuto.classList.contains('hidden');
  contenuto.classList.toggle('hidden', aperto);
  freccia?.classList.toggle('aperta', !aperto);
}

// ── Zona amministratore: azzeramento totale storico/statistiche ──
function apriConfermaAzzeramento() {
  document.getElementById('modal-conferma-reset')?.classList.remove('hidden');
}

function chiudiConfermaAzzeramento() {
  document.getElementById('modal-conferma-reset')?.classList.add('hidden');
}

function confermaAzzeramentoTotale() {
  // Solo l'admin puo' davvero eseguire l'azzeramento (il bottone che porta qui
  // è già nascosto agli altri, ma controlliamo di nuovo per sicurezza).
  const membro = getMembroByNome(Storage.getMembroAttivo());
  if (!membro.admin) { chiudiConfermaAzzeramento(); return; }

  // Sezione lista: svuota la lista condivisa e l'eventuale spesa in corso.
  lista = [];
  Storage.setLista([]);
  Storage.set('chiStaFacendoLaSpesa', null);
  document.getElementById('banner-spesa')?.classList.add('hidden');

  // Sezione grafici e profilo: storico prodotti (statistiche settimana/mese/
  // anno), storyboard e contatore spese completate. NON tocca preferiti_*,
  // fotoCustom o nomiCustom.
  Storage.setStorico([]);
  Storage.set('storicoSpese', []);
  Storage.set('speseFatte', {});

  chiudiConfermaAzzeramento();
  renderLista();
  renderProfilo();
  if (typeof renderDashboard === 'function') renderDashboard();
  if (typeof mostraToast === 'function') mostraToast('Storico azzerato ✓');
}

function apriModificaNomeProfilo() {
  const saluto   = document.getElementById('profilo-saluto');
  const input    = document.getElementById('profilo-input-nome');
  const matita   = document.getElementById('profilo-matita-btn');
  const conferma = document.getElementById('profilo-conferma-btn');
  if (!saluto || !input) return;
  input.value = saluto.textContent;
  saluto.classList.add('hidden');
  matita?.classList.add('hidden');
  input.classList.remove('hidden');
  conferma?.classList.remove('hidden');
  input.focus();
  input.select();
}

function salvaNomeProfilo() {
  const nomeBase  = Storage.getMembroAttivo();
  const input     = document.getElementById('profilo-input-nome');
  const saluto    = document.getElementById('profilo-saluto');
  const matita    = document.getElementById('profilo-matita-btn');
  const conferma  = document.getElementById('profilo-conferma-btn');
  const nuovoNome = input?.value.trim();
  if (nuovoNome) {
    setDisplayNome(nomeBase, nuovoNome);
    aggiornaHeaderMembro();
    if (saluto) saluto.textContent = nuovoNome;
    if (typeof mostraToast === 'function') mostraToast('Nome aggiornato!');
  }
  input?.classList.add('hidden');
  conferma?.classList.add('hidden');
  saluto?.classList.remove('hidden');
  matita?.classList.remove('hidden');
}

function cambiaFotoProfilo(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => apriModalCrop(e.target.result);
  reader.readAsDataURL(file);
  input.value = ''; // permette di riselezionare in seguito lo stesso file
}

// ── Ritaglia foto profilo: zoom (pizzico a due dita o slider) +
// trascinamento, con finestra circolare guida — come WhatsApp/Instagram.
// Usa i Pointer Events: unificano touch (iPhone) e mouse (PC) nello stesso
// codice, cosi' funziona identico su entrambi senza rami separati.
let _cropState = null;
const _cropPointers = new Map();
let _cropDragStart = null;
let _cropPinchStartDist = null;
let _cropPinchStartZoom = 1;

function apriModalCrop(dataUrl) {
  const modal  = document.getElementById('modal-crop-foto');
  const img    = document.getElementById('crop-img');
  const slider = document.getElementById('crop-zoom');
  if (!modal || !img) return;
  // Mostra il modal PRIMA di caricare l'immagine: cosi' quando l'onload
  // misura le dimensioni dell'area, questa è già visibile (non display:none).
  modal.classList.remove('hidden');
  img.onload = () => {
    const area = document.getElementById('crop-area');
    const containerSize = area.getBoundingClientRect().width;
    const baseScale = containerSize / Math.min(img.naturalWidth, img.naturalHeight);
    _cropState = {
      containerSize, baseScale,
      naturalW: img.naturalWidth, naturalH: img.naturalHeight,
      zoom: 1, panX: 0, panY: 0, maxZoom: 3,
    };
    if (slider) slider.value = 1;
    aggiornaTransformCrop();
  };
  img.src = dataUrl;
}

function aggiornaTransformCrop() {
  const img = document.getElementById('crop-img');
  if (!img || !_cropState) return;
  const { baseScale, zoom, naturalW, naturalH, containerSize } = _cropState;
  const scale = baseScale * zoom;
  const displayedW = naturalW * scale;
  const displayedH = naturalH * scale;

  // Non lasciar scoprire il bordo: il pan è limitato a quanto l'immagine
  // "avanza" oltre l'area visibile su ciascun asse.
  const maxPanX = Math.max(0, (displayedW - containerSize) / 2);
  const maxPanY = Math.max(0, (displayedH - containerSize) / 2);
  _cropState.panX = Math.min(maxPanX, Math.max(-maxPanX, _cropState.panX));
  _cropState.panY = Math.min(maxPanY, Math.max(-maxPanY, _cropState.panY));

  img.style.width  = displayedW + 'px';
  img.style.height = displayedH + 'px';
  img.style.transform = `translate(-50%, -50%) translate(${_cropState.panX}px, ${_cropState.panY}px)`;
}

function chiudiModalCrop() {
  document.getElementById('modal-crop-foto')?.classList.add('hidden');
  _cropState = null;
  _cropPointers.clear();
  _cropDragStart = null;
  _cropPinchStartDist = null;
}

function _cropDistanzaPunti() {
  const pts = [..._cropPointers.values()];
  return Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
}

function _cropFineTocco(e) {
  _cropPointers.delete(e.pointerId);
  if (_cropPointers.size < 2) _cropPinchStartDist = null;
  if (_cropPointers.size === 1 && _cropState) {
    const rimasto = [..._cropPointers.values()][0];
    _cropDragStart = { x: rimasto.x, y: rimasto.y, panX: _cropState.panX, panY: _cropState.panY };
  } else if (_cropPointers.size === 0) {
    _cropDragStart = null;
  }
}

function confermaCropFoto() {
  if (!_cropState) return;
  const img = document.getElementById('crop-img');
  const { baseScale, zoom, containerSize, panX, panY } = _cropState;
  const scale = baseScale * zoom;
  const displayedW = img.naturalWidth * scale;
  const displayedH = img.naturalHeight * scale;

  // Finestra visibile in pixel "reali" dell'immagine originale
  const visLeft = (displayedW - containerSize) / 2 - panX;
  const visTop  = (displayedH - containerSize) / 2 - panY;
  const sx = visLeft / scale;
  const sy = visTop / scale;
  const sSize = containerSize / scale;

  const outputSize = 300;
  const canvas = document.createElement('canvas');
  canvas.width = outputSize; canvas.height = outputSize;
  canvas.getContext('2d').drawImage(img, sx, sy, sSize, sSize, 0, 0, outputSize, outputSize);
  const base64 = canvas.toDataURL('image/jpeg', 0.86);

  const nomeBase = Storage.getMembroAttivo();
  const custom = Storage.get('fotoCustom', {});
  custom[nomeBase] = base64;
  Storage.set('fotoCustom', custom);

  chiudiModalCrop();
  renderProfilo();
  aggiornaHeaderMembro();
  if (typeof mostraToast === 'function') mostraToast('Foto aggiornata!');
}


// ── Modal Aggiungi Prodotto ───────────────────────────────────
function apriModalAggiungi() {
  document.getElementById('modal-aggiungi').classList.remove('hidden');
  // Focus solo su dispositivi senza touch (evita apertura tastiera automatica su mobile)
  const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
  if (!isTouch) document.getElementById('input-nome').focus();
}

function chiudiModalAggiungi() {
  document.getElementById('modal-aggiungi').classList.add('hidden');
  document.getElementById('form-aggiungi').reset();
  // Ripristina dropdown autocomplete e select automatica
  const dd = document.getElementById('autocomplete-dropdown');
  if (dd) dd.classList.add('hidden');
  // Reset lista provvisoria
  _provvisoria = [];
  renderProvvisoria();
  // Reset qty picker a 1
  impostaQty(1);
  document.getElementById('qty-chip')?.classList.remove('aperto');
  document.getElementById('qty-picker')?.classList.add('hidden');
}

function inviaFormAggiungi(e) {
  e.preventDefault();
  const nomeInput = document.getElementById('input-nome').value.trim();

  // Se c'è ancora qualcosa nel campo nome, aggiungilo alla provvisoria prima
  if (nomeInput) aggiungiAProvvisoria();

  // Niente da aggiungere
  if (!_provvisoria.length) return;

  const nAggiunto = _provvisoria.length;

  // Aggiunge tutti gli item provvisori alla lista reale
  _provvisoria.forEach(item => {
    const prodotto = aggiungiProdotto({
      nome:      item.nome,
      quantita:  item.qty,
      unita:     'pz',
      categoria: riconosciCategoria(item.nome) || null,
      nota: '',
      perChi:    Storage.getMembroAttivo(),
    });
    if (item.preferito && prodotto) salvaPreferito(prodotto);
  });

  chiudiModalAggiungi();
  navigaA('lista');
  mostraToast(nAggiunto === 1 ? `Prodotto aggiunto ✓` : `${nAggiunto} prodotti aggiunti ✓`);
}

// ── Toast ─────────────────────────────────────────────────────
function mostraToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('visibile');
  setTimeout(() => t.classList.remove('visibile'), 2500);
}

// ── Tema ──────────────────────────────────────────────────────
function toggleTema() {
  const tema = Storage.getTema() === 'dark' ? 'light' : 'dark';
  Storage.setTema(tema);
  applicaTema(tema);
}

function applicaTema(tema) {
  document.documentElement.setAttribute('data-tema', tema);
  const btn = document.getElementById('btn-tema');
  if (btn) btn.textContent = tema === 'dark' ? '☀️' : '🌙';
  if (typeof applicaSfondoTema === 'function') applicaSfondoTema(tema);
}

// Imposta la quantità (chip, hidden input, evidenziazione nel picker), min 1
function impostaQty(val) {
  const v = Math.max(1, val || 1);
  const hiddenQty = document.getElementById('input-qty');
  if (hiddenQty) hiddenQty.value = v;
  const chip = document.getElementById('qty-chip');
  if (chip) chip.textContent = v;
  document.querySelectorAll('.qty-btn').forEach(b => b.classList.toggle('attivo', b.dataset.val === String(v)));
}

// ── Lista provvisoria ─────────────────────────────────────────
let _provvisoria = [];

function aggiungiAProvvisoria() {
  const input = document.getElementById('input-nome');
  const nome  = input?.value.trim();
  if (!nome) return;
  const qty = parseInt(document.getElementById('input-qty')?.value) || 1;
  _provvisoria.push({ nome, qty, preferito: false });
  renderProvvisoria();
  // Reset campo nome e qty
  input.value = '';
  document.getElementById('autocomplete-dropdown')?.classList.add('hidden');
  impostaQty(1);
  input.focus();
}

function renderProvvisoria() {
  const container = document.getElementById('lista-provvisoria');
  if (!container) return;
  if (!_provvisoria.length) { container.classList.add('hidden'); return; }
  container.classList.remove('hidden');
  container.innerHTML = _provvisoria.map((item, i) => `
    <div class="prov-item">
      <button type="button" class="prov-stella ${item.preferito ? 'attiva' : ''}" onclick="togglePreferitoProvvisoria(${i})">★</button>
      <div class="prov-testo">
        <span class="prov-nome">${escapeHtml(item.nome)}</span>
        <span class="prov-qty">×${item.qty}</span>
      </div>
      <button type="button" class="prov-rimuovi" onclick="rimuoviDaProvvisoria(${i})"><img src="/img/trash-icon.svg" alt="Elimina" style="width:20px;height:20px;"></button>
    </div>`).join('');
}

function rimuoviDaProvvisoria(i) {
  _provvisoria.splice(i, 1);
  renderProvvisoria();
}

function togglePreferitoProvvisoria(i) {
  _provvisoria[i].preferito = !_provvisoria[i].preferito;
  renderProvvisoria();
}

// ── Autocomplete ──────────────────────────────────────────────
function evidenziaMatch(testo, query) {
  const idx = testo.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return testo;
  return testo.slice(0, idx)
    + '<strong>' + testo.slice(idx, idx + query.length) + '</strong>'
    + testo.slice(idx + query.length);
}

function setupAutocomplete() {
  const input    = document.getElementById('input-nome');
  const dropdown = document.getElementById('autocomplete-dropdown');
  if (!input || !dropdown) return;

  let selectedIndex = -1;

  function mostraSuggerimenti() {
    const q = input.value.trim();
    if (q.length < 2) { dropdown.classList.add('hidden'); return; }
    const sug = getProdottiSuggeriti(q);
    if (!sug.length) { dropdown.classList.add('hidden'); return; }

    dropdown.innerHTML = sug.map((s, i) => {
      const cat = getCategoriaById(s.categoria);
      return `<div class="ac-item" data-idx="${i}" data-nome="${s.nome}">
        <span class="ac-nome">${evidenziaMatch(s.nome, q)}</span>
        <span class="ac-cat" style="color:${cat.colore}">${getIconaProdotto(s.nome, s.categoria)} ${cat.nome}</span>
      </div>`;
    }).join('');
    dropdown.classList.remove('hidden');
    selectedIndex = -1;

    dropdown.querySelectorAll('.ac-item').forEach(item => {
      item.addEventListener('mousedown', e => {
        e.preventDefault();
        selezionaSuggerimento(item);
      });
    });
  }

  function selezionaSuggerimento(item) {
    input.value = item.dataset.nome;
    dropdown.classList.add('hidden');
    selectedIndex = -1;
  }

  input.addEventListener('input', mostraSuggerimenti);

  input.addEventListener('keydown', e => {
    const items = dropdown.querySelectorAll('.ac-item');
    if (dropdown.classList.contains('hidden') || !items.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
      items.forEach((it, i) => it.classList.toggle('selezionato', i === selectedIndex));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIndex = Math.max(selectedIndex - 1, -1);
      items.forEach((it, i) => it.classList.toggle('selezionato', i === selectedIndex));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      selezionaSuggerimento(items[selectedIndex]);
    } else if (e.key === 'Escape') {
      dropdown.classList.add('hidden');
    }
  });

  input.addEventListener('blur', () => {
    setTimeout(() => dropdown.classList.add('hidden'), 150);
  });
}

// ── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Il tema è locale — lo applichiamo subito senza aspettare il server
  applicaTema(Storage.getTema());

  // Avvia connessione Supabase, poi inizializza l'app
  Storage.init().then(() => {
    caricaLista();
    caricaPreferiti();
    aggiornaHeaderMembro();

    // Ripristina banner spesa se era attivo
    aggiornaBannerSpesa();

    // Ripropone la conferma di fine spesa se era rimasta in sospeso
    ripristinaConfermaFineSpesa();

    // Mostra selezione membro se mai scelto
    if (!localStorage.getItem('membroAttivo')) {
      renderSelezioneMembroAvvio();
    }

  // Form aggiungi
  document.getElementById('form-aggiungi').addEventListener('submit', inviaFormAggiungi);

  // Modifica nome profilo: invio per salvare, esc per annullare
  document.getElementById('profilo-input-nome')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') salvaNomeProfilo();
    if (e.key === 'Escape') {
      const saluto   = document.getElementById('profilo-saluto');
      const matita   = document.getElementById('profilo-matita-btn');
      const conferma = document.getElementById('profilo-conferma-btn');
      e.target.classList.add('hidden');
      conferma?.classList.add('hidden');
      saluto?.classList.remove('hidden');
      matita?.classList.remove('hidden');
    }
  });

  // Cropper foto profilo: slider zoom + trascinamento/pizzico sull'area
  document.getElementById('crop-zoom')?.addEventListener('input', e => {
    if (!_cropState) return;
    _cropState.zoom = parseFloat(e.target.value);
    aggiornaTransformCrop();
  });

  const cropArea = document.getElementById('crop-area');
  if (cropArea) {
    cropArea.addEventListener('pointerdown', e => {
      if (!_cropState) return;
      cropArea.setPointerCapture(e.pointerId);
      _cropPointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (_cropPointers.size === 1) {
        _cropDragStart = { x: e.clientX, y: e.clientY, panX: _cropState.panX, panY: _cropState.panY };
      } else if (_cropPointers.size === 2) {
        _cropPinchStartDist = _cropDistanzaPunti();
        _cropPinchStartZoom = _cropState.zoom;
      }
    });

    cropArea.addEventListener('pointermove', e => {
      if (!_cropState || !_cropPointers.has(e.pointerId)) return;
      _cropPointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (_cropPointers.size === 1 && _cropDragStart) {
        _cropState.panX = _cropDragStart.panX + (e.clientX - _cropDragStart.x);
        _cropState.panY = _cropDragStart.panY + (e.clientY - _cropDragStart.y);
        aggiornaTransformCrop();
      } else if (_cropPointers.size === 2 && _cropPinchStartDist) {
        const rapporto = _cropDistanzaPunti() / _cropPinchStartDist;
        _cropState.zoom = Math.min(_cropState.maxZoom, Math.max(1, _cropPinchStartZoom * rapporto));
        const slider = document.getElementById('crop-zoom');
        if (slider) slider.value = _cropState.zoom;
        aggiornaTransformCrop();
      }
    });

    cropArea.addEventListener('pointerup', _cropFineTocco);
    cropArea.addEventListener('pointercancel', _cropFineTocco);
  }

  setupAutocomplete();

  // Bottone "+ Aggiungi" → lista provvisoria
  document.getElementById('btn-aggiungi-prov')?.addEventListener('click', aggiungiAProvvisoria);

  // Enter sul campo nome → lista provvisoria (non submittare il form)
  document.getElementById('input-nome')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); aggiungiAProvvisoria(); }
  });

  // Qty picker
  const qtyChip   = document.getElementById('qty-chip');
  const qtyPicker = document.getElementById('qty-picker');

  qtyChip?.addEventListener('click', e => {
    e.stopPropagation();
    const aperto = !qtyPicker.classList.contains('hidden');
    qtyPicker.classList.toggle('hidden', aperto);
    qtyChip.classList.toggle('aperto', !aperto);
  });

  qtyPicker?.querySelectorAll('.qty-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.qty-btn').forEach(b => b.classList.remove('attivo'));
      btn.classList.add('attivo');
      document.getElementById('input-qty').value = btn.dataset.val;
      qtyChip.textContent = btn.dataset.val;
      qtyPicker.classList.add('hidden');
      qtyChip.classList.remove('aperto');
    });
  });

  // Chiudi picker cliccando fuori
  document.addEventListener('click', () => {
    qtyPicker?.classList.add('hidden');
    qtyChip?.classList.remove('aperto');
  });

  // Frecce su/giù per aumentare/diminuire la quantità
  document.getElementById('qty-su')?.addEventListener('click', e => {
    e.stopPropagation();
    impostaQty((parseInt(document.getElementById('input-qty')?.value) || 1) + 1);
  });
  document.getElementById('qty-giu')?.addEventListener('click', e => {
    e.stopPropagation();
    impostaQty((parseInt(document.getElementById('input-qty')?.value) || 1) - 1);
  });

  }); // fine Storage.init
});
