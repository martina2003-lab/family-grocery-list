# Family Grocery List — Requirements

## General Information
- **App name:** Family Grocery List
- **Family:** Elastigirl, MrIncredibile, Dash, Violet, JackJack (Admin), Pluto
- **Pet:** a dog
- **Reference supermarket:** Tigre (Rome)

---

## Architecture

- Two layers: User Interface · Supabase (database + realtime sync)
- **UI:** HTML5 + vanilla JavaScript, responsive (mobile, tablet, desktop)
- **Backend & Database:** Supabase — no custom server to write/host
  (full details in `doc/design.md`)
- Deployment: UI on Netlify, Supabase is an already-active cloud project

---

## Functional Requirements

### Grocery List
- [x] Add products with name and quantity (unit/note/manual category are
      NOT in the form: see below)
- [x] Automatic category detection from the product name (local dictionary)
- [x] Check off products while shopping (checkbox), only by whoever is
      currently shopping
- [x] Checked products automatically move to the bottom
- [x] Delete a product (only by whoever added it)
- [x] No automatic reset: a product stays on the list until it's bought or
      deliberately deleted. The swipe (left of the trash icon) shows since
      when it's been on the list ("Today" / "Yesterday" / date)
- [x] "For whom" field removed from the form — the product is associated
      with the active member
- [x] "Estimated price" field absent (no financial features)

**Decided NOT to implement** (code written and then removed, or never
started — not on the roadmap):
- Manually editable category and "memory" of user corrections
- Search within the already-added list
- Filter by category (and filter by member)
- Remaining products counter ("3 of 10")

### Favorite Products
- [ ] Save a product as favorite from the add-product form
- [ ] Viewable favorites list
- [ ] Quick add of a favorite to the current list
- [ ] Add all favorites in one click

### Family Profiles
- [x] 6 profiles: Elastigirl, MrIncredibile, Dash, Violet, JackJack (Admin), Pluto
- [x] Profile selection at app startup (no password)
- [x] Active profile visible in the header
- [x] Quick profile switch from the header (tap the avatar, which reopens
      the selection screen — not a dropdown menu)
- [x] Every added product shows the avatar/emoji of the member who added it
- [x] Only JackJack is admin: the only one with an Admin Zone in Profile,
      from which they can reset history, stats, charts, and storyboard for
      the whole family (doesn't touch favorites, photos, or custom names)

### Shopping Mode
- [x] Central "Vado a fa la spesa" ("Going grocery shopping") button
- [x] Pressing the button shows a banner below with the member's
      avatar/color and "sta a fa la spesa" ("is grocery shopping")
- [x] The banner disappears when shopping finishes or is cancelled

**Decided NOT to implement:** a dedicated full-screen view with products
grouped by aisle and its own progress bar — checking off happens directly
in the normal list.

### Dashboard — Product Storyboard
- [x] No financial features (no budget, no expenses)
- [x] Most-purchased products chart (horizontal bars) with a
      Week / Month / Year toggle
- [x] Pie/donut chart by category
- [x] Completed shopping trips podium per member (with crown/medals)

**Decided NOT to implement:** ranking of members by products added; chart
of purchase trends over time (with week/month/year drill-down).

### Categories
- [x] 17 categories with a dedicated emoji and color (used for automatic
      recognition)

---

## Dictionary Categories (17)

| # | Emoji | Name |
|---|-------|------|
| 1 | 🥦 | Fruit & Vegetables |
| 2 | 🥩 | Meat |
| 3 | 🐟 | Fish |
| 4 | 🧀 | Dairy |
| 5 | 🍞 | Bread |
| 6 | 🧃 | Drinks |
| 7 | 🧊 | Frozen |
| 8 | 🍦 | Ice cream |
| 9 | 🍬 | Candy & Snacks |
| 10 | 🥫 | Sauces |
| 11 | 🍅 | Pasta sauces |
| 12 | 🧹 | Household cleaning |
| 13 | 🧴 | Personal care |
| 14 | 💊 | Pharmacy & Health |
| 15 | 🫙 | Condiments & Spices |
| 16 | 🍝 | Pasta & Rice |
| 17 | 🐾 | Pets |
| — | 🛒 | Other (fallback) |

---

## Non-Functional Requirements

### Interface
- [x] Dark theme as default
- [x] Dark/light theme toggle
- [x] Mobile-first design, responsive on mobile, tablet, and desktop
- [x] Installable as a PWA on iPhone and Android
- [x] Smooth animations (products sliding, animated checkmarks)
- [x] No "Restore" or "Clear" button in the UI (nothing to restore from:
      the list never empties on its own)
- [x] "Vado a fa la spesa" button centered and prominent

### Data & Storage
- [x] All data persisted on Supabase, synced in real time across the
      family's devices. `localStorage` remains a local cache (and for the
      few keys that are intentionally per-device: theme, active member) —
      not the sole source of truth
- [x] Purchase history kept for dashboard stats
- [x] Maximum 500 history entries (automatic cleanup)

### Deployment
- [x] Frontend publishab
