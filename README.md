# 🛒 Family Grocery List

A grocery list app for family use: everyone shares the same list in real
time, each with their own profile.

This is a **demo version** of the project: same code as the app used daily,
with names and avatars replaced by fictional characters so no real data is
exposed.

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

## Running the project locally

1. Create a project on [Supabase](https://supabase.com) with the `stato`
   (key/value) and `prodotti` tables (see `doc/design.md` for the schema)
2. Copy `source/js/config.example.js` to `source/js/config.js` and fill in
   your Supabase project URL and public key
3. Start a static server from the `source/` folder:
   ```bash
   python -m http.server 3456 --directory source/
