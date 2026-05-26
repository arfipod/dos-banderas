# Dos Banderas

**Dos Banderas** is a short solo/cooperative spiritual combat card game prototype inspired by Catholic spiritual theology, the Ignatian image of the Two Standards, and the idea that life is shaped by small concrete decisions.

This repository contains a playable React + TypeScript + Vite simulator, a typed 90-card prototype deck, print-and-play card views, and complete rules documentation.

## Quick Start

```bash
npm install
npm run dev
```

Then open the URL printed by Vite, usually:

```text
http://localhost:5173
```

## Build

```bash
npm run build
npm run preview
```

## Main Features

- Solo and local cooperative prototype modes.
- Full 90-card prototype deck as typed data.
- Game simulator with:
  - Trial reveal
  - Dark Banner reveal
  - Christ's Banner vs shortcut decision
  - Hand, deck, discard, played cards
  - Light × Fervor scoring
  - Church Row purchases
  - manual balancing controls
  - downloadable playtest logs
- Card library.
- Print & Play view.
- Standalone print HTML at `public/print-and-play.html`.
- Game documentation in `docs/`.

## Project Structure

```text
src/
  App.tsx                  Main app and simulator orchestration
  components/
    CardView.tsx           Shared card rendering component
    RulesReference.tsx     In-app rules reference
  data/
    cards.ts               Full typed 90-card prototype deck
  game/
    rules.ts               Core rules helpers
    state.ts               Game state types
  types/
    cards.ts               Card and runtime card types
  utils/
    download.ts            JSON download helpers
docs/
  GAME_RULES.md
  CARD_SET.md
  PLAYTESTING.md
  BALANCING_NOTES.md
public/
  cards.json
  print-and-play.html
```

## Playtest Workflow

1. Run the app.
2. Start a solo game.
3. Play normally, using manual modifiers when card text requires conditional bonuses.
4. At the end, click **Download Playtest Log**.
5. Share the JSON log for balance analysis.

The log records decisions, draws, plays, purchases, score snapshots, meters, and phase transitions.
