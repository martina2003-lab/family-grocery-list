# App Spesa Famiglia — Requisiti

## Informazioni Generali
- **Nome app:** Spesa Famiglia
- **Famiglia:** Elastigirl, MrIncredibile, Dash, Violet, JackJack (Admin), Pluto
- **Animale domestico:** un cane
- **Supermercato di riferimento:** Tigre (Roma)

---

## Architettura

- Due livelli: User Interface · Supabase (database + sync realtime)
- **UI:** HTML5 + JavaScript vanilla, responsive (mobile, tablet, desktop)
- **Backend & Database:** Supabase — nessun server proprio da scrivere/ospitare
  (dettagli completi in `doc/design.md`)
- Deployment: UI su Netlify, Supabase è un progetto cloud già attivo

---

## Requisiti Funzionali

### Lista della Spesa
- [x] Aggiunta prodotti con nome e quantità (unità/nota/categoria manuale NON sono nel form: vedi sotto)
- [x] Riconoscimento automatico della categoria dal nome del prodotto (dizionario locale)
- [x] Spunta prodotti durante la spesa (checkbox), solo da chi sta facendo la spesa
- [x] Prodotti spuntati si spostano in fondo automaticamente
- [x] Eliminazione prodotto (solo da chi lo ha aggiunto)
- [x] Nessun reset automatico: un prodotto resta in lista finché non viene
      comprato o cancellato apposta. Lo swipe (a sinistra del cestino) mostra
      da quando è in lista ("Oggi" / "Ieri" / data)
- [x] Campo "per chi" rimosso dal form — il prodotto viene associato al membro attivo
- [x] Campo "prezzo stimato" assente (nessuna funzionalità finanziaria)

**Deciso di NON implementare** (codice scritto e poi rimosso, o mai iniziato — non sono in programma):
- Categoria modificabile manualmente e "memoria" delle correzioni dell'utente
- Ricerca nella lista già aggiunta
- Filtro per categoria (e filtro per membro)
- Contatore prodotti rimasti ("3 di 10")

### Prodotti Preferiti
- [ ] Salvataggio prodotto tra i preferiti dal form di aggiunta
- [ ] Lista preferiti visualizzabile
- [ ] Aggiunta rapida di un preferito alla lista corrente
- [ ] Aggiunta di tutti i preferiti in un click

### Profili Famiglia
- [x] 6 profili: Elastigirl, MrIncredibile, Dash, Violet, JackJack (Admin), Pluto
- [x] Selezione profilo all'avvio dell'app (nessuna password)
- [x] Profilo attivo visibile nell'header
- [x] Cambio profilo rapido dall'header (si tocca l'avatar, che riapre la
      schermata di selezione — non un menu a tendina)
- [x] Ogni prodotto aggiunto mostra l'avatar/emoji del membro che lo ha aggiunto
- [x] Solo JackJack è amministratore: unica ad avere la Zona Amministratore nel
      Profilo, da cui può azzerare storico, statistiche, grafici e storyboard
      di tutta la famiglia (non tocca preferiti, foto o nomi personalizzati)

### Modalità Spesa
- [x] Pulsante centrale "Vado a fa la spesa"
- [x] Alla pressione del pulsante compare un banner sotto con avatar/colore del membro e "sta a fa la spesa"
- [x] Il banner scompare quando la spesa finisce o viene annullata

**Deciso di NON implementare:** vista dedicata a tutto schermo con prodotti raggruppati per corsia e barra di avanzamento propria — si spunta direttamente nella lista normale.

### Dashboard — Storyboard Prodotti
- [x] Nessuna funzionalità finanziaria (no budget, no spese)
- [x] Grafico prodotti più acquistati (barre orizzontali) con toggle Settimana / Mese / Anno
- [x] Grafico a torta/ciambella per categoria
- [x] Podio spese completate per membro (con corona/medaglie)

**Deciso di NON implementare:** classifica membri per prodotti aggiunti; grafico andamento acquisti nel tempo (con drill-down settimana/mese/anno).

### Categorie
- [x] 17 categorie con emoji e colore dedicato (usate per il riconoscimento automatico)

---

## Categorie Dizionario (17)

| # | Emoji | Nome |
|---|-------|------|
| 1 | 🥦 | Frutta & Verdura |
| 2 | 🥩 | Carne |
| 3 | 🐟 | Pesce |
| 4 | 🧀 | Latticini |
| 5 | 🍞 | Pane |
| 6 | 🧃 | Bevande |
| 7 | 🧊 | Surgelati |
| 8 | 🍦 | Gelati |
| 9 | 🍬 | Caramelle & Snack |
| 10 | 🥫 | Salse |
| 11 | 🍅 | Sughi |
| 12 | 🧹 | Pulizia Casa |
| 13 | 🧴 | Igiene |
| 14 | 💊 | Farmacia & Parafarmacia |
| 15 | 🫙 | Condimenti & Spezie |
| 16 | 🍝 | Pasta & Riso |
| 17 | 🐾 | Animali |
| — | 🛒 | Altro (fallback) |

---

## Requisiti Non Funzionali

### Interfaccia
- [x] Tema dark come default
- [x] Toggle tema dark/light
- [x] Design mobile-first, responsive su mobile, tablet e desktop
- [x] Installabile come PWA su iPhone e Android
- [x] Animazioni fluide (prodotti che scorrono, spunte animate)
- [x] Nessun pulsante "Ripristina" o "Svuota" in UI (nessun reset da cui ripristinare: la lista non si svuota mai da sola)
- [x] Pulsante "Vado a fa la spesa" centrato e in evidenza

### Dati & Storage
- [x] Tutti i dati persistiti su Supabase, sincronizzati in tempo reale fra
      i dispositivi della famiglia. `localStorage` resta come cache locale
      (e per le poche chiavi che sono intenzionalmente per-dispositivo:
      tema, membro attivo) — non come unica fonte dei dati
- [x] Storico acquisti conservato per statistiche dashboard
- [x] Massimo 500 voci nello storico (pulizia automatica)

### Deployment
- [x] Frontend pubblicabile su Netlify con drag & drop
- [x] Supabase è un progetto cloud già attivo (nessun backend da deployare)
- [ ] Funziona offline in modalità degradata — **non implementato**: se lo
      script di Supabase non carica (assenza di rete), l'app resta su una
      schermata vuota invece di mostrare l'ultimo stato salvato in cache

---

## Requisiti Futuri (da valutare)

- [x] Sincronizzazione real-time tra dispositivi della famiglia (già fatto, via Supabase)
- [ ] Integrazione AI (Claude API) per riconoscimento prodotti avanzato e suggerimenti
- [ ] Notifiche push quando un membro aggiunge prodotti
- [ ] Lista settimanale ricorrente salvabile
- [ ] Avviso prodotti in scadenza

---

*Ultimo aggiornamento: 6 Luglio 2026 — rimosso il reset automatico giornaliero (sostituito da un'etichetta "da quanto è in lista" nello swipe); riallineato in precedenza: requisiti scartati (ricerca, filtro categoria, contatore, modalità spesa dedicata, andamento, classifica membri), JackJack unica admin, architettura Supabase (non più Flask/MySQL)*
