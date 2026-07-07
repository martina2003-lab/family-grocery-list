# Family Grocery List — Architecture

## Overview

```
┌─────────────────────────────────────────────────────────┐
│                  USER INTERFACE                         │
│         HTML5 + JavaScript (Responsive)                 │
│         Mobile · Tablet · Desktop                       │
└─────────────────────┬───────────────────────────────────┘
                      │ @supabase/supabase-js (direct client)
┌─────────────────────▼───────────────────────────────────┐
│                   SUPABASE                               │
│         Postgres Database · Realtime · Auth (unused)    │
└─────────────────────────────────────────────────────────┘
```

Two layers, not three: **no backend written by us**. The frontend talks
directly to Supabase through the official JS client — there are no
proprietary REST routes, no Python server to keep online. That was the
original plan (see the "History" section at the bottom), abandoned because
Supabase already covers everything needed with far less work.

---

## Layer 1 — User Interface

### Technologies
- **HTML5** — page and component structure
- **CSS3** — responsive layout, dark/light theme, animations
- **Vanilla JavaScript** — UI logic, Supabase calls, DOM updates
- **PWA** — installable on iPhone/Android as a native-like app

### Responsiveness
| Device  | Breakpoint | Layout |
|---------|------------|--------|
| Mobile  | < 480px    | Single column, FAB, bottom nav |
| Tablet  | 480–1024px | Wide single column |
| Desktop | > 1024px   | Single column, centered (max-width) |

### Screens
- **Grocery List** — shared product list, quick add, swipe to delete
- **Favorites** — saved products per member, quick add to the list
- **Charts (Dashboard)** — top products, category pie chart, completed
  shopping trips podium
- **Profile** — custom photo/name, personal stats, weekly storyboard,
  Admin Zone (JackJack only)

### Main JS files (`source/js/`)
| File | Responsibility |
|------|-----------------|
| `storage.js` | Supabase client: init, realtime, generic get/set, row-by-row product CRUD |
| `categorie.js` | The 17 categories and the automatic recognition dictionary |
| `famiglia.js` | The 6 members, admin role, avatars |
| `lista.js` | Grocery list logic: add/delete/check/finish shopping |
| `preferiti.js` | Favorite products per member |
| `dashboard.js` | Charts (top products, category pie chart, podium) |
| `app.js` | Navigation, modals, profile, theme, daily reset |
| `init-immagini.js` | Local (base64) cache of avatars and theme backgrounds |

---

## Layer 2 — Supabase

### Why Supabase instead of a custom backend
- No server to write, host, or keep online
- Realtime sync across the family's devices already included (Postgres
  Changes channels)
- Free tier is enough for a family of 6

### Tables

#### `stato`
Generic key/value store: everything **except** the list products lives
here (favorites per member, purchase history, custom photos/names, theme,
who's currently shopping, stat counters...).
```sql
CREATE TABLE stato (
  chiave  TEXT PRIMARY KEY,
  valore  JSONB
);
```

#### `prodotti`
One row per product in the shared list — not a single blob. This way two
people adding or editing different products at the same instant don't
overwrite each other (the old "vanishing products" bug).
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
Two Postgres Changes channels opened by `Storage.init()`:
- `stato-changes` — on INSERT/UPDATE/DELETE of the `stato` table, updates
  `localStorage` on the device and redraws the affected views
- `prodotti-changes` — on INSERT/UPDATE/DELETE of the `prodotti` table,
  applies the change row-by-row to the in-memory list (never a full
  overwrite)

### Security
The key used in the client (`SUPABASE_KEY` in `storage.js`) is public by
nature (an `anon`/`publishable` key): it's fine for it to live in frontend
code. What actually protects the data are the **Row Level Security
policies** configured on the Supabase project — those need periodic
review, not the code here.

### What we do NOT use from Supabase
- **Auth** — profile selection is local, no password (by design: it's a
  family app, no authentication needed)
- **Storage (files)** — profile photos are saved as base64 inside the
  `stato` table, not in Supabase's Storage bucket

---

## No automatic reset
There used to be a client-side daily reset (cleared the list on first app
open after midnight), now removed: it wiped the whole list every night even
on days the family hadn't gone shopping, with only a backup save never
exposed in the UI. Today a product stays on the list until it's bought
(removed automatically via `fineSpesa`) or deliberately deleted with a
swipe — which also shows since when the product has been on the list
("Today" / "Yesterday" / date), via `etichettaGiornoAggiunta()` in
`lista.js`.

---

## Deployment

### Local development
```
UI → python -m http.server 3456 --directory source/
```
Supabase is always the same cloud project: there's no separate "local
environment" for the backend.

### Production
```
UI       → Netlify (drag & drop of source/)
Supabase → already-active cloud project (nothing to deploy)
```

---

## History: the original plan (Flask + MySQL)

The project originally started with a three-layer architecture — UI, Flask
backend with a REST API, MySQL database — with table schemas and endpoints
already designed. It was never built: the decision was made to use
Supabase instead, which covers the database and realtime sync without
having to write and host a custom backend. It might be worth going back to
Flask+MySQL in the future to stop depending on a third-party service, but
that would mean rewriting from scratch the realtime sync that's currently
free — that's not a problem the app has right now, so it stays on
Supabase.
