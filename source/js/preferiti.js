let preferiti = [];

function caricaPreferiti() {
  preferiti = Storage.getPreferiti();
  renderPreferiti();
}

function salvaPreferito(prodotto) {
  const esiste = preferiti.find(p => p.nome.toLowerCase() === prodotto.nome.toLowerCase());
  if (esiste) return;
  const pref = {
    id: 'pref_' + Date.now(),
    nome: prodotto.nome,
    quantita: prodotto.quantita,
    unita: prodotto.unita,
    categoria: prodotto.categoria,
    nota: prodotto.nota || '',
  };
  preferiti.unshift(pref);
  Storage.setPreferiti(preferiti);
  renderPreferiti();
}

function rimuoviPreferito(id) {
  preferiti = preferiti.filter(p => p.id !== id);
  Storage.setPreferiti(preferiti);
  renderPreferiti();
}

function aggiungiPreferitoInLista(pref) {
  aggiungiProdotto({
    nome: pref.nome,
    quantita: pref.quantita,
    unita: pref.unita,
    categoria: pref.categoria,
    nota: pref.nota,
    perChi: Storage.getMembroAttivo(),
  });
  // Flash feedback
  mostraToast(`${pref.nome} aggiunto alla lista ✓`);
}

function aggiungiTuttiPreferiti() {
  if (!preferiti.length) return;
  preferiti.forEach(p => aggiungiProdotto({
    nome: p.nome, quantita: p.quantita, unita: p.unita,
    categoria: p.categoria, nota: p.nota, perChi: Storage.getMembroAttivo(),
  }));
  mostraToast(`${preferiti.length} preferiti aggiunti alla lista ✓`);
}

function renderPreferiti() {
  const container = document.getElementById('preferiti-lista');
  if (!container) return;

  if (!preferiti.length) {
    container.innerHTML = `
      <div class="lista-vuota">
        <div class="lista-vuota-icon">⭐</div>
        <p>Nessun preferito</p>
        <span>Salva un prodotto con ⭐ per ritrovarlo qui</span>
      </div>`;
    return;
  }

  container.innerHTML = preferiti.map(p => {
    const cat = getCategoriaById(p.categoria);
    return `
      <div class="preferito-item">
        <button class="pref-stella-btn" onclick="rimuoviPreferito('${p.id}')">⭐</button>
        <div class="preferito-info">
          <div class="preferito-nome"><span class="prodotto-icona">${getIconaProdotto(p.nome, p.categoria)}</span> ${escapeHtml(p.nome.charAt(0).toUpperCase() + p.nome.slice(1))}</div>
        </div>
        <div class="preferito-actions">
          <button class="pref-aggiungi-btn" onclick="aggiungiPreferitoInLista(preferiti.find(x=>x.id==='${p.id}'))">+ Lista</button>
        </div>
      </div>`;
  }).join('');
}
