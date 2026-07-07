# 🛒 App Spesa Famiglia

App di gestione lista della spesa pensata per l'uso familiare: più persone
condividono la stessa lista in tempo reale, ognuno con il proprio profilo.

Questa è una **versione dimostrativa** del progetto: stesso codice dell'app
usata quotidianamente, con nomi e avatar sostituiti da personaggi di fantasia
per non esporre dati reali.

## Funzionalità

- Lista della spesa condivisa e sincronizzata in tempo reale tra dispositivi
- Riconoscimento automatico della categoria del prodotto (17 categorie, con
  centinaia di prodotti già mappati) e icona/emoji specifica per prodotto
- Prodotti preferiti per aggiungerli alla lista con un tap
- Banner "sta a fa la spesa" quando un membro inizia gli acquisti
- Grafici e statistiche (prodotti più comprati, andamento per periodo)
- Profili multipli con avatar personalizzabili, uno amministratore per la
  gestione dello storico
- PWA installabile su mobile, tema chiaro/scuro

## Stack tecnico

- **Frontend**: HTML5 + JavaScript vanilla, nessun framework — vedi `source/`
- **Backend & Database**: [Supabase](https://supabase.com) (Postgres gestito
  + sincronizzazione realtime), usato direttamente dal frontend

Dettagli di architettura in [`doc/design.md`](doc/design.md), requisiti
completi in [`doc/requisiti.md`](doc/requisiti.md).

## Avviare il progetto in locale

1. Crea un progetto su [Supabase](https://supabase.com) con le tabelle
   `stato` (chiave/valore) e `prodotti` (vedi `doc/design.md` per lo schema)
2. Copia `source/js/config.example.js` in `source/js/config.js` e inserisci
   URL e chiave pubblica del tuo progetto Supabase
3. Avvia un server statico dalla cartella `source/`:
   ```bash
   python -m http.server 3456 --directory source/
   ```
4. Apri `http://localhost:3456`

`source/js/config.js` non viene incluso nel repository (vedi `.gitignore`):
ogni chi lo esegue in locale usa le proprie credenziali.

## Struttura cartelle

```
├── source/   ← frontend (HTML, CSS, JS)
├── doc/      ← design.md, requisiti.md
└── test/     ← test
```
