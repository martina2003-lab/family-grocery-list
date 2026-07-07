// Solo Jack-Jack è admin: può azzerare storico/statistiche dalla Zona
// Amministratore nel Profilo (vedi confermaAzzeramentoTotale in app.js).
// Gli altri membri restano alla pari per tutto il resto (nessuna gerarchia
// su lista, preferiti o modifica prodotti — quella si basa su chi ha
// aggiunto il prodotto, non sul ruolo admin).
const MEMBRI = [
  { nome: 'Elastigirl',      emoji: '👴', colore: '#fbbf24', admin: false, foto: 'img/user-avatars/Elastigirl.png'    },
  { nome: 'Mr. Incredibile', emoji: '👦', colore: '#0ea5e9', admin: false, foto: 'img/user-avatars/MrIncredibile.png' },
  { nome: 'Dash',            emoji: '👦', colore: '#34d399', admin: false, foto: 'img/user-avatars/Dash.png'          },
  { nome: 'Violet',          emoji: '👩', colore: '#a78bfa', admin: false, foto: 'img/user-avatars/Violet.png'        },
  { nome: 'Jack-Jack',       emoji: '👩', colore: '#f472b6', admin: true,  foto: 'img/user-avatars/JackJack.png'      },
  { nome: 'Pluto',           emoji: '👧', colore: '#fb923c', admin: false, foto: 'img/user-avatars/Pluto.png'         },
];

function getMembroByNome(nome) {
  return MEMBRI.find(m => m.nome === nome) || MEMBRI[0];
}

// Ritorna HTML per l'avatar di un membro (foto se presente, altrimenti emoji)
function getDisplayNome(nomeBase) {
  const custom = Storage.get('nomiCustom', {});
  return custom[nomeBase] || nomeBase;
}

function setDisplayNome(nomeBase, nuovoNome) {
  const custom = Storage.get('nomiCustom', {});
  custom[nomeBase] = nuovoNome;
  Storage.set('nomiCustom', custom);
}

function renderAvatarMembro(m, className) {
  const custom = Storage.get('fotoCustom', {});
  const def    = Storage.get('fotoDefault', {});
  const src    = custom[m.nome] || def[m.nome] || m.foto || null;
  return src
    ? `<img class="${className}" src="${src}" alt="${m.nome}">`
    : `<span class="${className}">${m.emoji}</span>`;
}

function renderSelezioneMembroAvvio() {
  const overlay = document.getElementById('overlay-membro');
  const grid = document.getElementById('grid-membri');
  grid.innerHTML = '';
  MEMBRI.forEach(m => {
    const btn = document.createElement('button');
    btn.className = 'membro-btn';
    btn.style.setProperty('--mc', m.colore);
    const custom = Storage.get('fotoCustom', {});
    const def    = Storage.get('fotoDefault', {});
    const src    = custom[m.nome] || def[m.nome] || m.foto || null;
    const avatarHtml = src
      ? `<img class="m-foto" src="${src}" alt="${m.nome}">`
      : `<span class="m-emoji">${m.emoji}</span>`;
    btn.innerHTML = `${avatarHtml}<span class="m-nome">${m.nome}</span>${m.admin ? '<span class="m-admin">Admin</span>' : ''}`;
    btn.addEventListener('click', () => {
      Storage.setMembroAttivo(m.nome);
      overlay.classList.add('hidden');
      aggiornaHeaderMembro();
      caricaPreferiti();
      renderLista();
      if (typeof renderProfilo === 'function') renderProfilo();
    });
    grid.appendChild(btn);
  });
  overlay.classList.remove('hidden');
}

function aggiornaHeaderMembro() {
  const nome = Storage.getMembroAttivo();
  const m = getMembroByNome(nome);
  const emojiEl = document.getElementById('header-membro-emoji');
  if (emojiEl) {
    const custom = Storage.get('fotoCustom', {});
    const def    = Storage.get('fotoDefault', {});
    const src    = custom[m.nome] || def[m.nome] || m.foto || null;
    if (src) {
      emojiEl.innerHTML = `<img src="${src}" alt="${m.nome}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
    } else {
      emojiEl.textContent = m.emoji;
    }
  }
  const nomeEl = document.getElementById('header-membro-nome');
  if (nomeEl) nomeEl.textContent = getDisplayNome(m.nome);
  const avatarEl = document.getElementById('header-membro-avatar');
  if (avatarEl) avatarEl.style.borderColor = m.colore;
  if (typeof aggiornaBannerSpesa === 'function') aggiornaBannerSpesa();
}
