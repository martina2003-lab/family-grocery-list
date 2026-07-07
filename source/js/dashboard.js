let periodoAttivo = 'settimana'; // 'settimana' | 'mese' | 'anno'

function renderDashboard() {
  aggiornaPeriodoBtns();
  renderSpesePodio();
  renderTortaCategorie();
  renderTopProdotti();
}

function setPeriodo(p) {
  periodoAttivo = p;
  renderDashboard();
}

function aggiornaPeriodoBtns() {
  document.querySelectorAll('.periodo-btn').forEach(b => {
    b.classList.toggle('attivo', b.dataset.periodo === periodoAttivo);
  });
}

// Le tre voci della dashboard leggono tutte da qui: SOLO le spese davvero
// CONFERMATE (storicoSpese, scritto da registraSpesaCompletata), filtrate per
// periodo. Non il vecchio "storico" delle aggiunte alla lista — quello non
// sa se un prodotto è stato comprato davvero, e per questo Podio, Torta
// categorie e Top prodotti restavano ciascuno con un pezzo mancante:
// il Podio non seguiva il periodo (il suo vecchio contatore non aveva data),
// gli altri due contavano ogni aggiunta come un acquisto.
function getSpeseFiltrate() {
  const spese = Storage.get('storicoSpese', []);
  const ora = new Date();
  return spese.filter(s => {
    const d = new Date(s.data);
    if (periodoAttivo === 'settimana') {
      const diff = (ora - d) / (1000 * 60 * 60 * 24);
      return diff <= 7;
    } else if (periodoAttivo === 'mese') {
      return d.getMonth() === ora.getMonth() && d.getFullYear() === ora.getFullYear();
    } else {
      return d.getFullYear() === ora.getFullYear();
    }
  });
}

// Le voci di storicoSpese scritte PRIMA di questa modifica sono semplici
// stringhe (solo il nome): per quelle si ricalcola la categoria con lo
// stesso dizionario usato all'aggiunta, e si assume quantità 1 (l'unico
// valore che avevamo). Le voci nuove arrivano già come {nome, categoria,
// quantita} da fineSpesa/registraSpesaCompletata.
function normalizzaProdottoSpesa(raw) {
  if (typeof raw === 'string') {
    return { nome: raw, categoria: riconosciCategoria(raw) || null, quantita: 1 };
  }
  return { nome: raw.nome, categoria: raw.categoria || null, quantita: raw.quantita || 1 };
}

// ─── Grafici ─────────────────────────────────────────────────────────────────

function renderSpesePodio() {
  const container = document.getElementById('spese-podio');
  if (!container) return;

  const conteggi = {};
  getSpeseFiltrate().forEach(s => { conteggi[s.chi] = (conteggi[s.chi] || 0) + 1; });

  const classifica = MEMBRI
    .map(m => ({ m, count: conteggi[m.nome] || 0 }))
    .filter(e => e.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  if (!classifica.length) {
    container.innerHTML = '<p class="dash-vuoto">Nessuna spesa completata in questo periodo.</p>';
    return;
  }

  // Ordine podio: 2° - 1° - 3°
  const podioOrdine = [1, 0, 2].map(i => classifica[i]).filter(Boolean);
  const altezze = [80, 110, 60];
  const medaglie = ['🥇', '🥈', '🥉'];

  const colonne = podioOrdine.map((e, posIdx) => {
    const rankReale = classifica.indexOf(e);
    const h = altezze[posIdx];
    // fotoDefault (cache locale della foto base, per non dipendere dalla
    // rete): stesso ordine di fallback usato da renderAvatarMembro altrove
    // nell'app (header, lista, profilo) — qui mancava.
    const fotoCustom  = Storage.get('fotoCustom', {});
    const fotoDefault = Storage.get('fotoDefault', {});
    const src = fotoCustom[e.m.nome] || fotoDefault[e.m.nome] || e.m.foto || null;
    const avatarHtml = src
      ? `<img src="${src}" class="spese-podio-avatar" style="border-color:${e.m.colore}">`
      : `<div class="spese-podio-avatar spese-podio-emoji" style="border-color:${e.m.colore}">${e.m.emoji}</div>`;
    const nomeDisplay = getDisplayNome(e.m.nome);
    return `
      <div class="podio-col">
        ${rankReale === 0 ? '<span class="podio-corona">👑</span>' : ''}
        ${avatarHtml}
        <span class="podio-nome">${escapeHtml(nomeDisplay)}</span>
        <span class="podio-count">${e.count} spese</span>
        <div class="podio-blocco" style="height:${h}px;background:${e.m.colore}22;border-color:${e.m.colore}">
          <span class="podio-medaglia">${medaglie[rankReale]}</span>
        </div>
      </div>`;
  }).join('');

  container.innerHTML = `<div class="podio">${colonne}</div>`;
}

function renderTopProdotti() {
  const conteggi = {};
  getSpeseFiltrate().forEach(s => {
    (s.prodotti || []).forEach(raw => {
      const p = normalizzaProdottoSpesa(raw);
      const n = p.nome.toLowerCase();
      conteggi[n] = conteggi[n] || { nome: p.nome, cat: p.categoria, count: 0 };
      conteggi[n].count += p.quantita;
    });
  });

  const top = Object.values(conteggi).sort((a, b) => b.count - a.count).slice(0, 5);
  const container = document.getElementById('top-prodotti');
  if (!container) return;

  if (!top.length) {
    container.innerHTML = '<p class="dash-vuoto">Nessun dato ancora — completa una spesa!</p>';
    return;
  }

  const medaglie = ['🥇', '🥈', '🥉'];
  const maxCount = top[0].count || 1;

  container.innerHTML = top.map((p, i) => {
    const cat = getCategoriaById(p.cat);
    const pct = Math.round((p.count / maxCount) * 100);
    return `
      <div class="bar-row">
        <span class="bar-rank">${medaglie[i] || i + 1}</span>
        <span class="bar-label">${getIconaProdotto(p.nome, p.cat)} ${escapeHtml(capitalizza(p.nome))}</span>
        <div class="bar-track">
          <div class="bar-fill" style="width:${pct}%;background:${cat.colore}"></div>
        </div>
        <span class="bar-val">${p.count}x</span>
      </div>`;
  }).join('');
}

function renderTortaCategorie() {
  const conteggi = {};
  getSpeseFiltrate().forEach(s => {
    (s.prodotti || []).forEach(raw => {
      const p = normalizzaProdottoSpesa(raw);
      conteggi[p.categoria] = (conteggi[p.categoria] || 0) + p.quantita;
    });
  });

  const container = document.getElementById('torta-categorie');
  if (!container) return;

  const voci = Object.entries(conteggi)
    .map(([id, n]) => ({ cat: getCategoriaById(id), n }))
    .sort((a, b) => b.n - a.n);

  if (!voci.length) {
    container.innerHTML = '<p class="dash-vuoto">Nessun dato ancora.</p>';
    return;
  }

  const tot = voci.reduce((s, v) => s + v.n, 0);
  let offset = 0;
  const r = 60, cx = 80, cy = 80, stroke = 28;
  const circ = 2 * Math.PI * r;

  const archi = voci.map(v => {
    const pct = v.n / tot;
    const dash = pct * circ;
    const gap  = circ - dash;
    const el = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none"
      stroke="${v.cat.colore}" stroke-width="${stroke}"
      stroke-dasharray="${dash.toFixed(2)} ${gap.toFixed(2)}"
      stroke-dashoffset="${(-offset * circ).toFixed(2)}"
      transform="rotate(-90 ${cx} ${cy})"/>`;
    offset += pct;
    return el;
  }).join('');

  const legenda = voci.slice(0, 5).map(v =>
    `<div class="legenda-item">
      <span class="legenda-dot" style="background:${v.cat.colore}"></span>
      <span class="legenda-nome">${v.cat.emoji} ${v.cat.nome}</span>
      <span class="legenda-pct">${Math.round((v.n / tot) * 100)}%</span>
    </div>`
  ).join('');

  container.innerHTML = `
    <div class="donut-wrap">
      <svg viewBox="0 0 160 160" width="140" height="140">${archi}
        <text x="${cx}" y="${cy - 6}" text-anchor="middle" fill="#e2e8f0" font-size="13" font-weight="700">${tot}</text>
        <text x="${cx}" y="${cy + 10}" text-anchor="middle" fill="#64748b" font-size="9">prodotti</text>
      </svg>
      <div class="legenda">${legenda}</div>
    </div>`;
}

function capitalizza(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
