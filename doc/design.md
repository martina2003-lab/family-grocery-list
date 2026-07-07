# App Spesa Famiglia — Architettura

## Panoramica

```
┌─────────────────────────────────────────────────────────┐
│                  USER INTERFACE                         │
│         HTML5 + JavaScript (Responsive)                 │
│         Mobile · Tablet · Desktop                       │
└─────────────────────┬───────────────────────────────────┘
                      │ @supabase/supabase-js (client diretto)
┌─────────────────────▼───────────────────────────────────┐
│                   SUPABASE                               │
│         Database Postgres · Realtime · Auth (non usata) │
└─────────────────────────────────────────────────────────┘
```

Due livelli, non tre: **niente backend scritto da noi**. Il frontend parla
direttamente con Supabase tramite il client JS ufficiale — non ci sono rotte
REST proprietarie, non c'è un server Python da mantenere online. Questo era
il piano originale (vedi la sezione "Storia" in fondo), abbandonato perché
Supabase copre già tutto il necessario con molto meno lavoro.

---

## Livello 1 — User Interface

### Tecnologie
- **HTML5** — struttura pagine e componenti
- **CSS3** — layout responsive, tema dark/light, animazioni
- **JavaScript Vanilla** — logica UI, chiamate a Supabase, aggiornamento DOM
- **PWA** — installabile su iPhone/Android come app nativa

### Responsività
| Dispositivo | Breakpoint | Layout |
|-------------|------------|--------|
| Mobile      | < 480px    | Single column, FAB, nav bottom |
| Tablet      | 480–1024px | Single column largo |
| Desktop     | > 1024px   | Single column, centrato (max-width) |

### Schermate
- **Lista Spesa** — lista prodotti condivisa, aggiunta rapida, swipe per eliminare
- **Preferiti** — prodotti salvati per membro, aggiunta rapida alla lista
- **Grafici (Dashboard)** — top prodotti, torta categorie, podio spese completate
- **Profilo** — foto/nome personalizzati, statistiche personali, storyboard
  settimanale, Zona Amministratore (solo JackJack)

### File JS principali (`source/js/`)
| File | Responsabilità |
|------|-----------------|
| `storage.js` | Client Supabase: init, realtime, get/set generico, CRUD prodotti riga-per-riga |
| `categorie.js` | Le 17 categorie e il dizionario di riconoscimento automatico |
| `famiglia.js` | I 6 membri, ruolo admin, avatar |
| `lista.js` | Logica lista spesa: aggiungi/elimina/spunta/fine spesa |
| `preferiti.js` | Prodotti preferiti per membro |
| `dashboard.js` | Grafici (top prodotti, torta categorie, podio) |
| `app.js` | Navigazione, modali, profilo, tema, reset giornaliero |
| `init-immagini.js` | Cache locale (base64) di avatar e sfondi tema |

---

## Livello 2 — Supabase

### Perché Supabase e non un backend proprio
- Nessun server da scrivere, ospitare o tenere online
- Sincronizzazione realtime tra i dispositivi della famiglia già inclusa
  (canali Postgres Changes)
- Piano gratuito sufficiente per l'uso di una famiglia di 6 persone

### Tabelle

#### `stato`
Chiave/valore generico: qui vive tutto **tranne** i prodotti della lista
(preferiti per membro, storico acquisti, foto/nomi personalizzati, tema
di chi sta facendo la spesa, contatori statistiche...).
```sql
CREATE TABLE stato (
  chiave  TEXT PRIMARY KEY,
  valore  JSONB
);
```

#### `prodotti`
Una riga per prodotto della lista condivisa — non un blob unico. Così due
persone che aggiungono o modificano prodotti diversi nello stesso istante
non si sovrascrivono a vicenda (il vecchio bug dei "prodotti spariti").
```sql
CREATE TABLE prodotti (
  id              TEXT PRIMARY KEY,
  nome            TEXT NOT NULL,
  quantita        INT DEFAULT 1,
  unita           TEXT DEFAULT 'pz',
  categoria       TEXT,
  nota            TEXT DEFAULT '',
  per_chi         TEXT,
  aggiunto_da     TEXT,
  spuntato        BOOLEAN DEFAULT FALSE,
  non_acquistato  BOOLEAN DEFAULT FALSE,
  data_aggiunta   TIMESTAMPTZ DEFAULT now()
);
```

### Realtime
Due canali Postgres Changes aperti da `Storage.init()`:
- `stato-changes` — su INSERT/UPDATE/DELETE della tabella `stato`, aggiorna
  `localStorage` sul dispositivo e ridisegna le viste interessate
- `prodotti-changes` — su INSERT/UPDATE/DELETE della tabella `prodotti`,
  applica la modifica riga per riga alla lista in memoria (mai una
  sovrascrittura totale)

### Sicurezza
La chiave usata nel client (`SUPABASE_KEY` in `storage.js`) è pubblica per
natura (tipo `anon`/`publishable`): può stare nel codice frontend. Chi
protegge davvero i dati sono le **Row Level Security policy** configurate
sul progetto Supabase — vanno verificate periodicamente, non il codice qui.

### Cosa NON usiamo di Supabase
- **Auth** — la selezione del profilo è locale, senza password (per design:
  è un'app di famiglia, non serve autenticazione)
- **Storage (file)** — le foto profilo sono salvate come base64 dentro la
  tabella `stato`, non nel bucket Storage di Supabase

---

## Nessun reset automatico
C'era un reset giornaliero lato client (svuotava la lista alla prima
apertura dell'app dopo mezzanotte), rimosso: cancellava tutta la lista
ogni notte anche nei giorni in cui la famiglia non era andata a fare la
spesa, con solo un salvataggio di backup mai esposto in UI. Oggi un
prodotto resta in lista finché non viene comprato (esce da solo, tramite
`fineSpesa`) o cancellato apposta con lo swipe — che mostra anche da
quando il prodotto è in lista ("Oggi" / "Ieri" / data), tramite
`etichettaGiornoAggiunta()` in `lista.js`.

---

## Deployment

### Sviluppo locale
```
UI → python -m http.server 3456 --directory source/
```
Supabase è sempre lo stesso progetto in cloud: non esiste un "ambiente
locale" separato per il backend.

### Produzione
```
UI       → Netlify (drag & drop di source/)
Supabase → progetto cloud già attivo (nessun deploy da fare)
```

---

## Storia: il piano originale (Flask + MySQL)

Il progetto era partito con un'architettura a tre livelli — UI, backend
Flask con REST API, database MySQL — con schema tabelle ed endpoint già
disegnati. Non è mai stato costruito: si è deciso di usare Supabase, che
copre database e sincronizzazione realtime senza dover scrivere e ospitare
un backend proprio. Si potrebbe tornare su Flask+MySQL in futuro per
smettere di dipendere da un servizio terzo, ma richiederebbe di riscrivere
da zero la sincronizzazione realtime oggi gratuita — al momento non è
un problema che l'app abbia, quindi si resta su Supabase.
