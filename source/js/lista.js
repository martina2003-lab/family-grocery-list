let lista = [];

// Nomi prodotto e nomi profilo sono testo libero dell'utente e finiscono in innerHTML:
// senza escape un nome tipo "<img src=x onerror=...>" verrebbe eseguito sul telefono
// di tutta la famiglia (si sincronizza via Supabase).
function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

// Data in formato YYYY-MM-DD nel fuso orario del dispositivo.
// NON usare toISOString() per le date "di giornata": è in UTC, e in Italia
// il giorno cambierebbe all'1–2 di notte (reset giornaliero in ritardo e
// prodotti aggiunti dopo mezzanotte finiti nel giorno sbagliato dei grafici).
function dataLocaleISO(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// "Oggi" / "Ieri" / "3/7" — mostrato nello swipe accanto al cestino, al posto
// del reset automatico giornaliero (rimosso: cancellava tutta la lista ogni
// notte anche se quel giorno nessuno era andato a fare la spesa). Ora un
// prodotto resta finché non viene comprato o cancellato apposta; questa
// etichetta dice solo da quanto è lì.
function etichettaGiornoAggiunta(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const chiave = dataLocaleISO(d);
  if (chiave === dataLocaleISO()) return 'Oggi';
  if (chiave === dataLocaleISO(new Date(Date.now() - 24 * 60 * 60 * 1000))) return 'Ieri';
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

function caricaLista() {
  lista = Storage.getLista();
  renderLista();
}

// ── Sincronizzazione in tempo reale dei prodotti (una riga per prodotto) ──
// Chiamate da Storage.init() quando arriva un INSERT/UPDATE/DELETE dalla
// tabella "prodotti" di un altro dispositivo. Idempotenti: se il prodotto è
// già presente (es. eco della propria stessa modifica) non lo duplicano.
function _prodottoDaRigaDb(r) {
  return {
    id: r.id, nome: r.nome, quantita: r.quantita, unita: r.unita,
    categoria: r.categoria, nota: r.nota || '', perChi: r.per_chi,
    aggiuntoDa: r.aggiunto_da, spuntato: !!r.spuntato,
    nonAcquistato: !!r.non_acquistato, dataAggiunta: r.data_aggiunta,
  };
}

function applicaInserimentoProdotto(riga) {
  const p = _prodottoDaRigaDb(riga);
  if (lista.some(x => x.id === p.id)) return; // già presente (es. eco della propria aggiunta)
  lista.unshift(p);
  renderLista();
}

function applicaAggiornamentoProdotto(riga) {
  const p = _prodottoDaRigaDb(riga);
  const idx = lista.findIndex(x => x.id === p.id);
  if (idx !== -1) lista[idx] = p; else lista.unshift(p);
  renderLista();
}

function applicaEliminazioneProdotto(id) {
  lista = lista.filter(x => x.id !== id);
  renderLista();
  controllaCompletamentoSpesa();
}

// Se un prodotto ancora da spuntare viene eliminato da un ALTRO dispositivo
// (es. qualcuno da casa si accorge che non serve più) e con la sua sparizione
// la lista risulta ora tutta spuntata, la spesa va chiusa anche se chi sta
// facendo la spesa non ha toccato nulla. Scatta solo sul dispositivo di chi
// sta davvero facendo la spesa — gli altri non devono vedersi comparire la
// schermata di fine spesa.
function controllaCompletamentoSpesa() {
  const chiSpesa = Storage.get('chiStaFacendoLaSpesa', null);
  if (!chiSpesa || chiSpesa.nome !== Storage.getMembroAttivo()) return;
  if (lista.length > 0 && lista.every(p => p.spuntato)) fineSpesa();
}

function aggiungiProdotto(dati) {
  if (!dati.nome || !dati.nome.trim()) return null;
  const prodotto = {
    id: Date.now().toString() + '_' + Math.random().toString(36).slice(2),
    nome: dati.nome.trim(),
    quantita: dati.quantita || 1,
    unita: dati.unita || 'pz',
    categoria: dati.categoria || null,
    nota: dati.nota || '',
    perChi: dati.perChi || Storage.getMembroAttivo(),
    aggiuntoDa: Storage.getMembroAttivo(),
    spuntato: false,
    dataAggiunta: new Date().toISOString(),
  };
  lista.unshift(prodotto);
  salvaESalvaStorico(prodotto);
  renderLista();
  return prodotto;
}

function salvaESalvaStorico(prodotto) {
  Storage.inserisciProdotto(prodotto);
  // Registra nel log acquisti per la dashboard
  const storico = Storage.getStorico();
  const oggi = dataLocaleISO();
  storico.push({ ...prodotto, data: oggi });
  // Mantieni max 500 voci
  if (storico.length > 500) storico.splice(0, storico.length - 500);
  Storage.setStorico(storico);
}

function spuntaProdotto(id) {
  const chiSpesa = Storage.get('chiStaFacendoLaSpesa', null);
  if (!chiSpesa) return;
  if (chiSpesa.nome !== Storage.getMembroAttivo()) return;
  const p = lista.find(p => p.id === id);
  if (!p) return;
  p.spuntato = !p.spuntato;
  Storage.aggiornaProdotto(p.id, { spuntato: p.spuntato });
  renderLista();
  controllaCompletamentoSpesa();
}

// Chiude la sessione di spesa (bottone "Fine" del banner, ultimo prodotto
// spuntato, o un prodotto rimasto eliminato da un altro dispositivo): i
// prodotti presi escono dalla lista, quelli non trovati restano marcati
// "non acquistato". Le statistiche NON si scrivono qui ma in
// confermaFineSpesa (✓ nell'overlay): scriverle prima della conferma
// significava che un ✕ di annullo lasciava la spesa già contata, e al secondo
// "Fine" veniva contata due volte.
//
// NON usa Storage.setLista() qui: quella riscrive l'intera riga di OGNI
// prodotto rimasto con la copia locale di questo dispositivo, cancellando in
// silenzio una modifica fatta da un altro membro un attimo prima che il suo
// eco arrivasse qui (es. Pluto cambia la quantità del pane mentre Dash chiude
// la spesa: la riscrittura in blocco riporterebbe "pane" alla quantità
// vecchia). Si tocca un prodotto alla volta, come fanno tutte le altre
// operazioni quotidiane — questo evita anche che un prodotto appena
// aggiornato (spuntaProdotto) venga anche cancellato quasi nello stesso
// istante: un eco fuori ordine tra le due richieste faceva ricomparire il
// prodotto sugli altri dispositivi (vedi applicaAggiornamentoProdotto).
function fineSpesa() {
  const chi = Storage.get('chiStaFacendoLaSpesa', null);
  const snapshot = {
    lista: lista.map(p => ({ ...p })),
    chi,
    // Nome + categoria + quantità di ogni prodotto REALMENTE comprato: è
    // l'unico momento in cui l'app sa con certezza cosa è finito nel
    // carrello. I grafici (Podio, Torta categorie, Top prodotti) leggono da
    // qui — non dal vecchio "storico" scritto quando il prodotto viene
    // aggiunto alla lista, che non sa se verrà comprato davvero né si
    // aggiorna se la quantità cambia dopo.
    spuntati: lista.filter(p => p.spuntato).map(p => ({ nome: p.nome, categoria: p.categoria, quantita: p.quantita })),
  };

  const daTenere = [];
  lista.forEach(p => {
    if (p.spuntato) {
      Storage.eliminaProdottoRemoto(p.id);
    } else {
      if (!p.nonAcquistato) Storage.aggiornaProdotto(p.id, { nonAcquistato: true });
      daTenere.push({ ...p, nonAcquistato: true, spuntato: false });
    }
  });
  lista = daTenere;

  Storage.set('chiStaFacendoLaSpesa', null);
  document.getElementById('banner-spesa')?.classList.add('hidden');
  renderLista();
  if (typeof mostraOverlayFineSpesa === 'function') mostraOverlayFineSpesa(snapshot);
}

// Scrive il contatore spese personale (Profilo), lo storyboard (Profilo) e il
// log usato dai grafici della Dashboard, per una spesa CONFERMATA. Se non è
// stato spuntato nessun prodotto la spesa non conta, come se fosse stata
// annullata. `spuntati` è un array di {nome, categoria, quantita} — non solo
// nomi: è l'unica fonte che sa davvero cosa è stato comprato, a differenza
// del vecchio storico scritto quando i prodotti vengono aggiunti alla lista.
function registraSpesaCompletata(chi, spuntati) {
  if (!chi || !chi.nome || !spuntati || !spuntati.length) return;
  const spese = Storage.get('speseFatte', {});
  spese[chi.nome] = (spese[chi.nome] || 0) + 1;
  Storage.set('speseFatte', spese);
  const log = Storage.get('storicoSpese', []);
  log.unshift({ chi: chi.nome, data: new Date().toISOString(), prodotti: spuntati });
  if (log.length > 100) log.splice(100);
  Storage.set('storicoSpese', log);
}

function eliminaProdotto(id) {
  const p = lista.find(p => p.id === id);
  if (!p || p.aggiuntoDa !== Storage.getMembroAttivo()) return;
  lista = lista.filter(p => p.id !== id);
  Storage.eliminaProdottoRemoto(id);
  renderLista();
}

function renderLista() {
  const container = document.getElementById('lista-prodotti');
  if (!container) return;

  let items = [...lista];

  // Non spuntati prima, spuntati in fondo
  const nonSpuntati = items.filter(p => !p.spuntato);
  const spuntati    = items.filter(p => p.spuntato);
  const ordinati    = [...nonSpuntati, ...spuntati];

  if (ordinati.length === 0) {
    container.innerHTML = `
      <div class="lista-vuota">
        <img src="img/empty-fridge/empty-fridge.png" alt="Frigo vuoto" class="lista-vuota-img">
        <p>La lista è vuota</p>
        <span>Aggiungi il primo prodotto!</span>
      </div>`;
    return;
  }

  const membroAttivo = Storage.getMembroAttivo();
  const chiSpesa      = Storage.get('chiStaFacendoLaSpesa', null);
  // "Sono io lo shopper attivo?" — non "sta facendo la spesa qualcuno?".
  // Solo chi sta effettivamente facendo la spesa vede le spunte ed è bloccato
  // dall'eliminare/modificare: per chiunque altro (nessuno stia facendo la
  // spesa, o la stia facendo un'altra persona) la lista si comporta come al
  // solito, stelle e swipe compresi — non c'è motivo che riguardi loro.
  const sonoIoLoShopper = !!(chiSpesa && chiSpesa.nome === membroAttivo);
  container.innerHTML = ordinati.map(p => {
    const cat    = getCategoriaById(p.categoria);
    const membro = getMembroByNome(p.aggiuntoDa);
    const puoEliminare = p.aggiuntoDa === membroAttivo && !sonoIoLoShopper;
    return `
      <div class="swipe-wrap" data-id="${p.id}">
        ${puoEliminare ? `
        <div class="swipe-actions">
          <button class="swipe-btn sw-elimina" onclick="swipeAzioneElimina('${p.id}')">
            <img src="img/trash-icon.svg" alt="Elimina" style="width:26px;height:26px;">
            <span class="swipe-data">${etichettaGiornoAggiunta(p.dataAggiunta)}</span>
          </button>
        </div>` : ''}
        <div class="prodotto-item ${p.spuntato ? 'spuntato' : ''}${p.nonAcquistato ? ' non-acquistato' : ''}">
          ${sonoIoLoShopper
            ? `<button class="spunta-btn" onclick="spuntaProdotto('${p.id}')" style="--cat-colore:${cat.colore}">${p.spuntato ? '✓' : ''}</button>`
            : `<button class="stella-lista${isPreferitoInLista(p.nome) ? ' attiva' : ''}" onclick="togglePreferitoFromLista('${p.id}')">${isPreferitoInLista(p.nome) ? '★' : '☆'}</button>`
          }
          <div class="prodotto-info">
            <div class="prodotto-nome">
              <span class="prodotto-icona">${getIconaProdotto(p.nome, p.categoria)}</span>
              <span class="prodotto-nome-testo">${escapeHtml(p.nome)}</span>
              <span class="prodotto-qty-inline ${puoEliminare ? 'qty-modificabile' : ''}" ${puoEliminare ? `onclick="apriQtyPickerLista(event,'${p.id}')"` : ''}>${p.quantita}</span>
              <span class="prodotto-membro" style="color:${membro.colore}" title="Aggiunto da ${membro.nome}">${renderAvatarMembro(membro, 'prodotto-membro-avatar')}</span>
            </div>
          </div>
        </div>
      </div>`;
  }).join('');

  inizializzaSwipe();
}

function isPreferitoInLista(nome) {
  return Storage.getPreferiti().some(p => p.nome.toLowerCase() === nome.toLowerCase());
}

function togglePreferitoFromLista(id) {
  const p = lista.find(p => p.id === id);
  if (!p) return;
  if (isPreferitoInLista(p.nome)) {
    const pref = Storage.getPreferiti().find(pf => pf.nome.toLowerCase() === p.nome.toLowerCase());
    if (pref) rimuoviPreferito(pref.id);
  } else {
    salvaPreferito(p);
  }
  renderLista();
}

// ── Swipe ────────────────────────────────────────────────────────
// Larghezza rivelata dallo swipe = quanto del contenuto della card (nome
// prodotto compreso) esce dalla vista quando è aperto — non solo "quanto
// spazio per i bottoni". Per questo l'etichetta data sta IMPILATA dentro lo
// stesso bottone del cestino (vedi .swipe-data in CSS) invece di allargare
// l'area rivelata: 70px resta identico a prima, il nome prodotto non rischia
// di sparire del tutto con nomi corti.
const ACTIONS_W = 70;

// Stato globale swipe attivo
let _sw = null;

document.addEventListener('mousemove', e => {
  if (!_sw || _sw.type !== 'mouse') return;
  const dx = e.clientX - _sw.startX;
  const dy = e.clientY - _sw.startY;
  if (!_sw.locked) {
    if (Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
    _sw.horiz = Math.abs(dx) > Math.abs(dy);
    _sw.locked = true;
  }
  if (!_sw.horiz) { _sw = null; return; }
  _sw.curX = Math.min(0, Math.max(-ACTIONS_W, _sw.baseX + dx));
  _sw.card.style.transform = `translateX(${_sw.curX}px)`;
});

document.addEventListener('mouseup', () => {
  if (!_sw || _sw.type !== 'mouse') return;
  _terminaSwipe();
});

document.addEventListener('touchend', () => {
  if (!_sw || _sw.type !== 'touch') return;
  _terminaSwipe();
});

function _terminaSwipe() {
  const { card, wrap, curX } = _sw;
  _sw = null;
  card.style.transition = 'transform 0.25s ease';
  if (curX < -ACTIONS_W / 3) {
    card.style.transform = `translateX(-${ACTIONS_W}px)`;
    card._swipeOpen = true;
    wrap.classList.add('aperto');
  } else {
    card.style.transform = 'translateX(0)';
    card._swipeOpen = false;
    wrap.classList.remove('aperto');
  }
}

function inizializzaSwipe() {
  document.querySelectorAll('.swipe-wrap').forEach(wrap => {
    const card = wrap.querySelector('.prodotto-item');
    const actions = wrap.querySelector('.swipe-actions');
    if (!actions || card._swipeInit) return;
    card._swipeInit = true;
    card._swipeOpen = false;

    wrap.addEventListener('mousedown', e => {
      if (e.button !== 0) return;
      // ignora click su bottoni azione
      if (e.target.closest('.swipe-actions')) return;
      chiudiTuttiSwipe(card);
      card.style.transition = 'none';
      _sw = { type: 'mouse', card, wrap, startX: e.clientX, startY: e.clientY,
              baseX: card._swipeOpen ? -ACTIONS_W : 0, curX: card._swipeOpen ? -ACTIONS_W : 0,
              locked: false, horiz: false };
    });

    wrap.addEventListener('touchstart', e => {
      if (e.target.closest('.swipe-actions')) return;
      chiudiTuttiSwipe(card);
      card.style.transition = 'none';
      const t = e.touches[0];
      _sw = { type: 'touch', card, wrap, startX: t.clientX, startY: t.clientY,
              baseX: card._swipeOpen ? -ACTIONS_W : 0, curX: card._swipeOpen ? -ACTIONS_W : 0,
              locked: false, horiz: false };
    }, { passive: true });

    wrap.addEventListener('touchmove', e => {
      if (!_sw || _sw.type !== 'touch' || _sw.wrap !== wrap) return;
      const t = e.touches[0];
      const dx = t.clientX - _sw.startX;
      const dy = t.clientY - _sw.startY;
      if (!_sw.locked) {
        if (Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
        _sw.horiz = Math.abs(dx) > Math.abs(dy);
        _sw.locked = true;
      }
      if (!_sw.horiz) { _sw = null; return; }
      e.preventDefault();
      _sw.curX = Math.min(0, Math.max(-ACTIONS_W, _sw.baseX + dx));
      _sw.card.style.transform = `translateX(${_sw.curX}px)`;
    }, { passive: false });

    wrap.addEventListener('touchend', () => {
      if (!_sw || _sw.type !== 'touch' || _sw.wrap !== wrap) return;
      _terminaSwipe();
    });
  });
}

function chiudiTuttiSwipe(escludi) {
  document.querySelectorAll('.swipe-wrap').forEach(wrap => {
    const c = wrap.querySelector('.prodotto-item');
    if (c === escludi) return;
    c.style.transition = 'transform 0.25s ease';
    c.style.transform = 'translateX(0)';
    c._swipeOpen = false;
    wrap.classList.remove('aperto');
  });
}

function apriQtyPickerLista(e, id) {
  e.stopPropagation();
  const p = lista.find(p => p.id === id);
  if (!p) return;

  // Rimuovi picker già aperto
  document.querySelectorAll('.qty-picker-lista').forEach(el => el.remove());

  const badge = e.currentTarget;
  const picker = document.createElement('div');
  picker.className = 'qty-picker qty-picker-lista';
  picker.style.position = 'fixed';

  for (let i = 1; i <= 10; i++) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'qty-btn' + (i === p.quantita ? ' attivo' : '');
    btn.textContent = i;
    btn.addEventListener('click', () => {
      p.quantita = i;
      Storage.aggiornaProdotto(p.id, { quantita: i });
      renderLista();
    });
    picker.appendChild(btn);
  }

  document.body.appendChild(picker);

  // Posiziona sopra/sotto il badge
  const rect = badge.getBoundingClientRect();
  picker.style.left = rect.left + 'px';
  picker.style.top  = (rect.bottom + 6) + 'px';

  // Chiudi cliccando fuori
  setTimeout(() => {
    document.addEventListener('click', function chiudi() {
      picker.remove();
      document.removeEventListener('click', chiudi);
    }, { once: true });
  }, 0);
}

function swipeAzioneElimina(id) {
  chiudiTuttiSwipe();
  eliminaProdotto(id);
}

