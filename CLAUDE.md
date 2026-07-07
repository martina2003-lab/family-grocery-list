# Family Grocery List — CLAUDE.md

## Project Context
Grocery list management app for family use. Built for a family made up of
Elastigirl, MrIncredibile, Dash, Violet, JackJack, Pluto. Reference
supermarket: Tigre (Rome). They have a dog.

## Architecture
Two layers, no backend written by us:
- **UI** → `source/` — HTML5 + vanilla JavaScript, responsive (mobile/tablet/desktop), PWA
- **Backend & Database** → **Supabase** (managed Postgres + realtime sync), used
  directly from the frontend via `@supabase/supabase-js` — see `source/js/storage.js`.
  `stato` table (key/value, for everything except the list) and `prodotti` table
  (one row per product, so two people adding/editing different products at
  the same instant don't overwrite each other)

Full architecture docs in `doc/design.md`.
Full requirements in `doc/requisiti.md`.

## Folder Structure
```
github demo/
├── source/       ← frontend (HTML, CSS, JS)
├── doc/          ← design.md, requisiti.md
├── test/         ← tests
├── README.md
└── CLAUDE.md
```

## Current Status
- [x] Frontend complete, in daily use by the family
- [x] Folder structure organized
- [x] Architecture documented (aligned with Supabase)
- [x] Requirements documented (aligned with what's actually implemented)
- [x] Git repository initialized
- [x] Product dictionary implemented in `source/js/categorie.js`
- [x] Backend & Database: Supabase, already in production (no Flask/MySQL:
      decided to stay on Supabase, see `doc/design.md`)
- [x] Realtime sync across the family's devices

## Important Rules
- **No financial features** — no budget, no prices, no expenses
- **Only JackJack is admin** — can reset history/stats from the Admin Zone
  in Profile. Other members are equal peers for everything else (deleting a
  product depends on who added it, not on admin role)
- **No automatic reset** — a product stays on the list until it's bought or
  deliberately deleted (swipe). The swipe also shows since when it's been
  there ("Today"/"Yesterday"/date). There used to be a midnight reset, now
  removed: it cleared the whole list every night even on days nobody went
  shopping
- **17 categories** with emoji and color — see the full dictionary in `doc/requisiti.md`
- The **"for whom"** field doesn't exist in the form — the product is
  associated with the active member
- The **"estimated price"** field doesn't exist in the form
- The main button is called **"Vado a fa la spesa"** ("Going grocery
  shopping", in Roman dialect)
- When a member taps "Vado a fa la spesa" a banner appears: **"[Name] sta a
  fa la spesa"** ("[Name] is grocery shopping")

## Product Dictionary
Hundreds of products mapped to 17 categories in `source/js/categorie.js`
(the `DIZIONARIO` object). Used for automatic category recognition when
adding a product — runs entirely in the browser, no network calls.

## Deployment Target
- **Frontend** → Netlify (drag & drop of `source/`)
- **Backend & Database** → Supabase (URL and public key in
  `source/js/config.js`, excluded from git — see `source/js/config.example.js`
  for the template)

## Useful Commands
```bash
# Start local frontend preview
python -m http.server 3456 --directory source/

# Git
git status
git add .
git commit -m "message"
```
