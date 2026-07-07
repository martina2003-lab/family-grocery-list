# App Spesa Famiglia — CLAUDE.md

## Contesto del Progetto
App di gestione lista della spesa per uso familiare. Sviluppata per la famiglia
composta da Elastigirl, MrIncredibile, Dash, Violet, JackJack, Pluto. Supermercato di
riferimento: Tigre (Roma). Hanno un cane.

## Architettura
Due livelli, nessun backend scritto da noi:
- **UI** → `source/` — HTML5 + JavaScript vanilla, responsive (mobile/tablet/desktop), PWA
- **Backend & Database** → **Supabase** (Postgres gestito + sync realtime), usato
  direttamente dal frontend via `@supabase/supabase-js` — vedi `source/js/storage.js`.
  Tabella `stato` (chiave/valore, per tutto tranne la lista) e tabella `prodotti`
  (una riga per prodotto, per evitare che due persone che aggiungono/modificano
  prodotti diversi nello stesso istante si sovrascrivano a vicenda)

Documentazione completa in `doc/design.md`.
Requisiti completi in `doc/requisiti.md`.

## Struttura Cartelle
```
github demo/
├── source/       ← frontend (HTML, CSS, JS)
├── doc/          ← design.md, requisiti.md
├── test/         ← test
├── README.md
└── CLAUDE.md
```

## Stato Attuale
- [x] Frontend completo, in uso quotidiano dalla famiglia
- [x] Struttura cartelle organizzata
- [x] Architettura documentata (allineata a Supabase)
- [x] Requisiti documentati (allineati a ciò che è davvero implementato)
- [x] Repository git inizializzato
- [x] Dizionario prodotti implementato in `source/js/categorie.js`
- [x] Backend & Database: Supabase, già in produzione (niente Flask/MySQL:
      deciso di restare su Supabase, vedi `doc/design.md`)
- [x] Sincronizzazione realtime tra i dispositivi della famiglia

## Regole Importanti
- **Nessuna funzionalità finanziaria** — no budget, no prezzi, no spese
- **Solo JackJack è amministratore** — può azzerare storico/statistiche dalla Zona
  Amministratore nel Profilo. Gli altri membri sono alla pari per tutto il resto
  (eliminare un prodotto dipende da chi lo ha aggiunto, non dal ruolo admin)
- **Nessun reset automatico** — un prodotto resta in lista finché non viene
  comprato o cancellato apposta (swipe). Lo swipe mostra anche da quando è lì
  ("Oggi"/"Ieri"/data). Il reset a mezzanotte c'era ma è stato tolto: cancellava
  tutta la lista ogni notte anche nei giorni in cui nessuno andava a fare la spesa
- **17 categorie** con emoji e colore — vedere dizionario completo in `doc/requisiti.md`
- Il campo **"per chi"** non esiste nel form — il prodotto è associato al membro attivo
- Il campo **"prezzo stimato"** non esiste nel form
- Il pulsante principale si chiama **"Vado a fa la spesa"** (romano)
- Quando un membro clicca "Vado a fa la spesa" compare banner **"[Nome] sta a fa la spesa"**

## Dizionario Prodotti
Centinaia di prodotti mappati su 17 categorie in `source/js/categorie.js`
(oggetto `DIZIONARIO`). Usato per il riconoscimento automatico della categoria
quando si aggiunge un prodotto — gira interamente nel browser, nessuna
chiamata di rete.

## Deployment Target
- **Frontend** → Netlify (drag & drop di `source/`)
- **Backend & Database** → Supabase (URL e chiave pubblica in `source/js/config.js`,
  escluso da git — vedi `source/js/config.example.js` per il modello)

## Comandi Utili
```bash
# Avvia preview locale frontend
python -m http.server 3456 --directory source/

# Git
git status
git add .
git commit -m "messaggio"
```
