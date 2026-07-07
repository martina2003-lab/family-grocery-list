# 🛒 Family Grocery List

**Open it here:** https://martina2003-lab.github.io/family-grocery-list/

Runs right in your browser — nothing to install, nothing to set up. Just
open the link above. A few sample products are already in the list, and
everything you change is saved only in your own browser (that's what the
"DEMO" badge in the header means: nothing is sent anywhere).

A grocery list app for family use: everyone shares the same list in real
time, each with their own profile.

This repository is a **public showcase** of the project: same code as the
app used daily by a real family, with names and avatars replaced by
fictional characters so no real data is exposed.

## Features

- Shared grocery list, synced in real time across devices
- Automatic product category detection (17 categories, with hundreds of
  products already mapped) plus a product-specific icon/emoji
- Favorite products for adding them to the list with one tap
- "Is shopping now" banner when a member starts shopping
- Charts and stats (most bought products, trends over time)
- Multiple profiles with customizable avatars, one admin for managing history
- Installable PWA on mobile, light/dark theme

## Tech stack

- **Frontend**: HTML5 + vanilla JavaScript, no framework — see `source/`
- **Backend & Database**: [Supabase](https://supabase.com) (managed
  Postgres + realtime sync), used directly from the frontend

Architecture details in [`doc/design.md`](doc/design.md), full requirements
in [`doc/requisiti.md`](doc/requisiti.md).

## Folder structure

```
├── source/   ← frontend (HTML, CSS, JS)
├── doc/      ← design.md, requisiti.md
└── test/     ← tests
```
