// SUPABASE_URL e SUPABASE_KEY arrivano da js/config.js (non incluso in git,
// vedi js/config.example.js per il modello da copiare e compilare)

// Chiavi che restano solo sul dispositivo (non sincronizzate).
// fotoCustom NON è qui: le foto profilo devono essere visibili a tutta la
// famiglia su ogni dispositivo, quindi si sincronizzano come tutto il resto.
const LOCAL_ONLY = new Set(['membroAttivo', 'tema']);

const Storage = {
  _client:   null,
  _ready:    false,
  _onready:  [],
  demoMode:  false,

  // ── Inizializzazione ─────────────────────────────────────────
  // Se manca js/config.js (SUPABASE_URL/KEY non definite), l'app parte in
  // "modalità demo": nessuna connessione a Supabase, tutto resta solo in
  // localStorage su questo dispositivo/browser. Tutte le funzioni di
  // scrittura qui sotto già controllano `if (!this._client) return` prima
  // di parlare con Supabase, quindi non serve nessun altro cambiamento:
  // l'app funziona subito, senza dover configurare nulla.
  async init() {
    if (typeof SUPABASE_URL === 'undefined' || typeof SUPABASE_KEY === 'undefined') {
      this.demoMode = true;
      if (!localStorage.getItem('lista')) this._seedDemo();
      this._ready = true;
      this._onready.forEach(fn => fn());
      this._onready = [];
      return;
    }

    const { createClient } = supabase;
    this._client = createClient(SUPABASE_URL, SUPABASE_KEY);

    // Carica stato iniziale dal server (tutto tranne i prodotti della lista,
    // che vivono nella tabella "prodotti" con una riga ciascuno)
    const { data } = await this._client.from('stato').select('chiave, valore');
    if (data) {
      data.forEach(({ chiave, valore }) => {
        localStorage.setItem(chiave, JSON.stringify(valore));
      });
    }

    // Carica i prodotti della lista (una riga per prodotto)
    const { data: prodotti, error: erroreProdotti } = await this._client
      .from('prodotti').select('*').order('data_aggiunta', { ascending: false });
    if (erroreProdotti) {
      console.error('Caricamento prodotti fallito:', erroreProdotti.message);
    } else if (prodotti && typeof _prodottoDaRigaDb === 'function') {
      localStorage.setItem('lista', JSON.stringify(prodotti.map(_prodottoDaRigaDb)));
    }

    // Ascolta modifiche in tempo reale sullo stato generico (chiave/valore)
    this._client
      .channel('stato-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stato' }, (payload) => {
        const { chiave, valore } = payload.new;
        localStorage.setItem(chiave, JSON.stringify(valore));
        Storage._trigger(chiave);
      })
      .subscribe();

    // Ascolta modifiche in tempo reale sui prodotti (riga per riga: un
    // inserimento/modifica/eliminazione alla volta, mai un sovrascrittura totale)
    this._client
      .channel('prodotti-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'prodotti' }, (payload) => {
        if (typeof applicaInserimentoProdotto === 'function') applicaInserimentoProdotto(payload.new);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'prodotti' }, (payload) => {
        if (typeof applicaAggiornamentoProdotto === 'function') applicaAggiornamentoProdotto(payload.new);
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'prodotti' }, (payload) => {
        if (typeof applicaEliminazioneProdotto === 'function') applicaEliminazioneProdotto(payload.old.id);
      })
      .subscribe();

    this._ready = true;
    this._onready.forEach(fn => fn());
    this._onready = [];
  },

  onReady(fn) {
    if (this._ready) fn();
    else this._onready.push(fn);
  },

  // Qualche prodotto di esempio così un visitatore vede subito la lista
  // popolata, invece che vuota, al primo avvio in modalità demo.
  _seedDemo() {
    const ora = Date.now();
    const demo = [
      { nome: 'Latte',   categoria: 'latticini', aggiuntoDa: 'Elastigirl',      dataAggiunta: ora },
      { nome: 'Pane',    categoria: 'pane',       aggiuntoDa: 'Mr. Incredibile', dataAggiunta: ora },
      { nome: 'Banane',  categoria: 'frutta',     aggiuntoDa: 'Dash',            dataAggiunta: ora },
      { nome: 'Detersivo piatti', categoria: 'pulizia', aggiuntoDa: 'Violet',    dataAggiunta: ora },
      { nome: 'Crocchette cane',  categoria: 'animali', aggiuntoDa: 'Pluto',     dataAggiunta: ora },
    ].map((p, i) => ({
      id: 'demo_' + ora + '_' + i, quantita: 1, unita: 'pz', nota: '',
      perChi: null, spuntato: false, nonAcquistato: false, ...p,
    }));
    localStorage.setItem('lista', JSON.stringify(demo));
  },

  // Aggiorna le viste quando arriva un aggiornamento da un altro dispositivo.
  // Nota: 'lista' non passa più da qui — i prodotti si sincronizzano riga per
  // riga tramite applicaInserimentoProdotto/applicaAggiornamentoProdotto/
  // applicaEliminazioneProdotto (vedi il canale "prodotti-changes" in init()).
  _trigger(key) {
    if (key === 'chiStaFacendoLaSpesa') {
      if (typeof aggiornaBannerSpesa === 'function') aggiornaBannerSpesa();
      if (typeof renderLista === 'function') renderLista();
    }
    if (key.startsWith('preferiti_')) {
      if (typeof renderPreferiti === 'function') renderPreferiti();
      if (typeof renderLista === 'function') renderLista();
    }
    if (key === 'storicoSpese' || key === 'speseFatte') {
      // storicoSpese/speseFatte alimentano sia lo storyboard del Profilo sia
      // Podio/Torta categorie/Top prodotti della Dashboard (vedi
      // getSpeseFiltrate in dashboard.js) — un altro dispositivo che finisce
      // una spesa deve aggiornare entrambe le schermate, non solo il Profilo.
      if (typeof renderProfilo === 'function') renderProfilo();
      if (typeof renderDashboard === 'function') renderDashboard();
    }
    if (key === 'storico') {
      // Usato solo dalle statistiche personali del Profilo ("prodotti questo
      // mese/in totale") — la Dashboard non legge più da qui.
      if (typeof renderProfilo === 'function') renderProfilo();
    }
    if (key === 'fotoCustom') {
      // La foto di un membro appare in più punti dell'app: aggiorna tutto
      // quello che potrebbe mostrarla, sul dispositivo che l'ha ricevuta.
      if (typeof aggiornaHeaderMembro === 'function') aggiornaHeaderMembro();
      if (typeof renderLista === 'function') renderLista();
      if (typeof renderProfilo === 'function') renderProfilo();
      if (typeof renderDashboard === 'function') renderDashboard();
    }
  },

  // ── API Storage ──────────────────────────────────────────────
  get(key, fallback = null) {
    try {
      const v = localStorage.getItem(key);
      return v !== null ? JSON.parse(v) : fallback;
    } catch { return fallback; }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}

    if (LOCAL_ONLY.has(key) || !this._client) return;

    // Upsert su Supabase (insert o update). Se fallisce (es. vincolo del database),
    // lo segnaliamo in console invece di ignorarlo silenziosamente: un errore muto qui
    // lascia il valore "vecchio" bloccato sul server, mai sincronizzato agli altri.
    this._client.from('stato').upsert({ chiave: key, valore: value }).then(({ error }) => {
      if (error) console.error(`Storage.set('${key}') fallito:`, error.message);
    });
  },

  // ── Prodotti della lista (una riga per prodotto) ────────────────
  // A differenza delle altre chiavi, i prodotti NON sono un blocco unico:
  // ogni operazione tocca solo la propria riga, cosi' due persone che
  // aggiungono/modificano prodotti diversi nello stesso istante non si
  // sovrascrivono più a vicenda (il bug che causava prodotti spariti).
  getLista: () => Storage.get('lista', []),

  async inserisciProdotto(prodotto) {
    if (!this._client) return;
    const { error } = await this._client.from('prodotti').insert({
      id: prodotto.id, nome: prodotto.nome, quantita: prodotto.quantita, unita: prodotto.unita,
      categoria: prodotto.categoria, nota: prodotto.nota || '', per_chi: prodotto.perChi,
      aggiunto_da: prodotto.aggiuntoDa, spuntato: !!prodotto.spuntato,
      non_acquistato: !!prodotto.nonAcquistato, data_aggiunta: prodotto.dataAggiunta,
    });
    if (error) console.error('inserisciProdotto fallito:', error.message);
  },

  async aggiornaProdotto(id, campi) {
    if (!this._client) return;
    const mappa = { nome: 'nome', quantita: 'quantita', spuntato: 'spuntato', nonAcquistato: 'non_acquistato' };
    const riga = {};
    for (const [k, v] of Object.entries(campi)) if (mappa[k]) riga[mappa[k]] = v;
    const { error } = await this._client.from('prodotti').update(riga).eq('id', id);
    if (error) console.error('aggiornaProdotto fallito:', error.message);
  },

  async eliminaProdottoRemoto(id) {
    if (!this._client) return;
    const { error } = await this._client.from('prodotti').delete().eq('id', id);
    if (error) console.error('eliminaProdottoRemoto fallito:', error.message);
  },

  // Riconcilia l'intera tabella con l'array fornito: elimina le righe che non
  // ci sono più, inserisce/aggiorna il resto. Usato SOLO dalle operazioni "in
  // blocco" (fine spesa, annulla, svuota lista, ripristina, reset giornaliero)
  // che sostituiscono l'intera lista in un colpo solo — non dalle aggiunte
  // e modifiche quotidiane di un singolo prodotto (quelle usano i metodi sopra).
  async setLista(v) {
    localStorage.setItem('lista', JSON.stringify(v));
    if (!this._client) return;
    const idsAttuali = v.map(p => p.id);
    const { data: righe, error: erroreLettura } = await this._client.from('prodotti').select('id');
    if (erroreLettura) { console.error('setLista (lettura) fallita:', erroreLettura.message); return; }
    const idsDaEliminare = (righe || []).map(r => r.id).filter(id => !idsAttuali.includes(id));
    if (idsDaEliminare.length) {
      const { error } = await this._client.from('prodotti').delete().in('id', idsDaEliminare);
      if (error) console.error('setLista (pulizia) fallita:', error.message);
    }
    if (v.length) {
      const { error } = await this._client.from('prodotti').upsert(v.map(p => ({
        id: p.id, nome: p.nome, quantita: p.quantita, unita: p.unita,
        categoria: p.categoria, nota: p.nota || '', per_chi: p.perChi,
        aggiunto_da: p.aggiuntoDa, spuntato: !!p.spuntato,
        non_acquistato: !!p.nonAcquistato, data_aggiunta: p.dataAggiunta,
      })));
      if (error) console.error('setLista (upsert) fallita:', error.message);
    }
  },

  getPreferiti: () => {
    const membro = Storage.getMembroAttivo();
    return Storage.get('preferiti_' + membro, []);
  },
  setPreferiti: (v) => {
    const membro = Storage.getMembroAttivo();
    Storage.set('preferiti_' + membro, v);
  },

  getStorico:      () => Storage.get('storico', []),
  setStorico:      (v) => Storage.set('storico', v),

  getMembroAttivo: () => Storage.get('membroAttivo', 'Elastigirl'),
  setMembroAttivo: (v) => Storage.set('membroAttivo', v),

  getTema:         () => Storage.get('tema', 'dark'),
  setTema:         (v) => Storage.set('tema', v),
};
