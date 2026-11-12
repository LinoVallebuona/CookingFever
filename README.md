# 🍔 Sizzle Shift

A full-stack, **100% free** restaurant time-management game. You run *Sunny's Diner*: customers walk in,
show their orders, and you grill patties, build burgers, fry potatoes, pour sodas and blend milkshakes
before they lose patience.

> **No in-app purchases, no ads, no premium currency, no energy system, no timers.** Every coin is earned
> by playing, and every upgrade and level is unlocked through gameplay.

Sizzle Shift is an original game in the genre of restaurant time-management games. Its name, characters,
art, sound, music, levels and code were all made for this project. All graphics are hand-written SVG and
all audio is synthesized at runtime with the Web Audio API, so there are no third-party asset files.

---

## Contents

- [Features](#features)
- [Quick start](#quick-start)
- [Environment variables](#environment-variables)
- [Scripts](#scripts)
- [Architecture](#architecture)
- [Game design](#game-design)
- [Server-side validation](#server-side-validation)
- [Testing](#testing)
- [Not implemented / known limitations](#not-implemented--known-limitations)

## Features

**Gameplay** (one complete restaurant: the American Diner)
- Real-time play with several customers at once (2–4 counter spots), each with their own patience bar and mood.
- 5 customer types: Regular, Retiree (patient), Office Rusher (impatient, big tips), Big Eater (up to 4 items) and Food Critic.
- 7 menu items: Hamburger, Cheeseburger, Garden Burger, Deluxe Burger, French Fries, Soda and Milkshake.
- Interactive stations:
  - **Grill**: patties cook, then burn if left too long.
  - **Burger station**: buns, cheese, lettuce and tomato go on a plate, layer by layer.
  - **Fryer and warmer**: fries cook, can burn, then move to the warmer.
  - **Soda fountain**: cups pour over time.
  - **Blender**: shakes blend, then melt if not served.
  - **Ingredient bins**: limited stock that you restock by tapping.
  - **Trash**: throw away mistakes.
- Controls: **tap** a station for its default action, or **drag** an item to a specific plate, customer or the trash. Mouse and touch both work.
- Serving several customers in a row builds a combo bonus. Tips depend on remaining patience. Customers walk out if they wait too long.
- Feedback for every action: progress rings, burn warnings, floating coin and tip numbers, food flying to the customer, a shake plus a message on invalid actions, and synthesized sounds.

**Progression**
- **20 handcrafted levels**, which add menu items, customer types, counter spots and faster arrivals as you go.
- 1–3 ★ per level, based on revenue targets plus a bonus objective (satisfaction, no walk-outs, or a combo).
- Coins (the only currency) come from sales, tips, combos, first-clear bonuses and new-star bonuses.
- **7 upgrades × 5 levels** with rising costs: Turbo Grill, Power Fryer, Kitchen Capacity, Prime Ingredients, Cozy Decor, Pantry Stock and Service Training.
- Persistent accounts (register/login/logout) plus **guest mode**. A guest can later sign up and keep all progress.
- Profile with statistics and recent shifts. Settings, including per-category audio mutes, are saved to your account.

**UI/UX**
- Polished, cartoon-style mobile-game look (Tailwind CSS and Framer Motion), with a level map, results screen, pause menu and an animated intro/countdown.
- A fixed 1280×720 game stage scales to any screen. It works on desktop, tablet and phones (landscape recommended).
- Original procedural background music (menu and kitchen tracks) and sound effects, in four mutable categories: music, kitchen SFX, customer voices and UI.

## Quick start

### Prerequisites
- Node.js ≥ 20.19 (developed with Node 22) and npm ≥ 10
- PostgreSQL 14+: either via Docker Compose (recommended) or a local install

### 1. Install dependencies
```bash
npm install
```
This also generates the Prisma client.

### 2. Start PostgreSQL
With Docker:
```bash
docker compose up -d postgres
```
This creates the `sizzle` and `sizzle_test` databases (user/password `postgres`/`postgres` on port 5432).

Without Docker, create the two databases yourself:
```bash
createdb sizzle && createdb sizzle_test
```

### 3. Configure the environment
```bash
cp apps/server/.env.example apps/server/.env
```
Edit `DATABASE_URL` if your database is not the docker-compose default.

### 4. Create the schema and seed game data
```bash
npm run db:deploy
```
```bash
npm run db:seed
```
The seed loads 3 restaurants (1 playable), 20 levels and 35 upgrade tiers, and creates a demo account **`demo` / `demo1234`**.

### 5. Run in development
```bash
npm run dev
```
- Client: http://localhost:5173 (Vite, hot reload, proxies `/api`)
- API: http://localhost:3001

### Production build
```bash
npm run build
```
```bash
NODE_ENV=production npm start
```
`npm run build` type-checks and builds the client into `apps/client/dist` and bundles the server (including the
shared engine) into `apps/server/dist`. In production the API also serves the built client, so a single process
on `PORT` serves the whole app. Run `npm run db:deploy` against the production database before starting.
Remember to set a strong `COOKIE_SECRET`. Cookies are `secure` when `NODE_ENV=production`, which requires HTTPS.

## Environment variables

Defined in `apps/server/.env` (template: `apps/server/.env.example`, also copied to the repository root):

| Variable              | Default                     | Description |
| --------------------- | --------------------------- | ----------- |
| `DATABASE_URL`        | –                           | PostgreSQL connection string (required) |
| `TEST_DATABASE_URL`   | –                           | Database used by the server integration tests (**it gets wiped**) |
| `PORT` / `HOST`       | `3001` / `0.0.0.0`          | API listen address |
| `CORS_ORIGIN`         | `http://localhost:5173`     | Comma-separated allowed browser origins |
| `COOKIE_SECRET`       | dev value                   | Cookie signing secret |
| `SESSION_TTL_DAYS`    | `30`                        | Session lifetime |
| `NODE_ENV`            | `development`               | `development`, `production` or `test` |
| `LOG_LEVEL`           | `info`                      | pino log level |
| `CLIENT_DIST`         | `../client/dist`            | Built client served in production |
| `MIN_REALTIME_FACTOR` | `0.85`                      | Anti speed-hack: minimum real time / simulated time |

Client (optional, `apps/client/.env`): `VITE_API_URL` points the client at an API on a different origin.
`VITE_API_PROXY` changes the dev proxy target.

## Scripts

| Command | What it does |
| ------- | ------------ |
| `npm run dev` | API + client with hot reload |
| `npm run build` / `npm start` | Production build / start |
| `npm test` | Engine unit tests and API integration tests |
| `npm run typecheck` | Type-checks all workspaces |
| `npm run db:migrate` | Create/apply a new migration (dev) |
| `npm run db:deploy` | Apply migrations (prod/CI) |
| `npm run db:seed` | Sync game content + demo user |
| `npm run db:reset` | Drop and recreate the dev database |
| `npm run e2e` | Browser play-through of level 1 (needs `npm run dev` and Playwright with Chromium) |
| `npm run balance -w @sizzle/shared` | Bot simulation report of all 20 levels (balancing aid) |

## Architecture

```
.
├── packages/shared      @sizzle/shared – pure TypeScript, no DOM/Node APIs
│   ├── src/config       menu, customers, upgrades, 20 levels, restaurants
│   ├── src/engine       deterministic game engine (systems below)
│   ├── src/rewards.ts   coin reward calculation
│   ├── src/phases.ts    game state machine (MENU, LEVEL_SELECTION, PLAYING, PAUSED, LEVEL_COMPLETED, LEVEL_FAILED)
│   ├── src/api-types.ts DTOs shared by client and server
│   ├── src/bot.ts       heuristic auto-player (tests/balancing only)
│   └── test/            Vitest unit tests
├── apps/server          @sizzle/server – Fastify 5 + Prisma 7 + PostgreSQL
│   ├── prisma/          schema, migrations, seed
│   └── src/             app, env, plugins (auth), routes, services, generated Prisma client
├── apps/client          @sizzle/client – React 19 + Vite + Tailwind 4 + Framer Motion + Zustand
│   └── src/
│       ├── game/        GameController (loop), GameScreen, station components, input (tap/drag), FX
│       ├── art/         original SVG art (food, customers, diner scene, icons)
│       ├── audio/       Web Audio synthesizer (SFX + music, 4 mute categories)
│       ├── screens/     auth, menu, restaurants, level map, upgrades, profile, settings
│       └── store/       Zustand app store (screen/phase state, player, settings)
├── docs/API.md          REST API reference
├── e2e/                 Playwright play-through script
└── docker-compose.yml   PostgreSQL
```

### Game engine (`packages/shared/src/engine`)
The engine is a **state-driven, fixed-timestep simulation** (60 ticks/s) with no UI dependencies. It is split into systems:

- `customers.ts`: spawning schedule, customer AI (enter → wait/lose patience → leave)
- `orders.ts`: order generation per customer type and level menu
- `kitchen.ts`: stations (grill, plates, fryer, warmer, soda, blender), ingredient bins, restocking, trash, player actions
- `scoring.ts`: serving, payment, tips, combos, satisfaction, stars, objectives
- `GameEngine.ts`: composes the systems. `dispatch(action)` applies input and records it with its tick, `step()` advances one tick.
- `replay.ts`: re-runs a recorded game from seed + actions

All randomness comes from a seeded PRNG, so a run is fully reproducible.

**Why DOM/SVG instead of Phaser?** The scene is a fixed set of interactive stations, not a scrolling world with
physics. React-rendered SVG gives crisp vector art at any resolution, simple accessible hit areas for mouse and
touch, and a much smaller bundle. The important part, the game loop, lives outside React. `GameController` runs
the engine from `requestAnimationFrame` with a fixed-step accumulator, and React only *subscribes* to a version
counter (`useSyncExternalStore`) to redraw. The simulation speed never depends on React render frequency, and the
loop auto-pauses when the tab is hidden.

### Database schema
`User`, `Session`, `PlayerProfile`, `Restaurant`, `PlayerRestaurant`, `Level`, `PlayerLevelProgress`,
`RestaurantUpgrade`, `PlayerUpgrade` and `GameSession`. See `apps/server/prisma/schema.prisma`.

Game content is defined once in `@sizzle/shared` and upserted into `Restaurant`, `Level` (including a JSON
`config` snapshot) and `RestaurantUpgrade` by the seed script and on every server start. Adding a restaurant,
level or upgrade tier therefore needs no schema change. Upgrades are keyed by `(restaurantId, upgradeType, level)`,
so each restaurant can have its own upgrade tree.

### Security
- Passwords are hashed with **scrypt** (N=2^15, random salt) and compared in constant time.
- Sessions are random 256-bit tokens. Only their SHA-256 hash is stored. They are sent as httpOnly, SameSite=Lax cookies (secure in production).
- Input is validated with zod. Auth endpoints are rate limited. Errors are structured and logged (pino).
- Coins, upgrade prices and level results are all decided by the server (see below).

## Game design

| Levels | New content |
| ------ | ----------- |
| 1 | Hamburgers & soda, 2 counter spots |
| 2 | Cheeseburger |
| 3 | French fries (fryer + warmer), 3 spots, Retirees |
| 4–5 | 3-item orders, Office Rushers |
| 6 | Garden Burger (lettuce + tomato) |
| 7 | 4th counter spot |
| 8 | Big Eaters (4-item orders) |
| 9 | Deluxe Burger |
| 10–12 | Rush hours, faster arrivals, restocking pressure |
| 13 | Milkshakes (blender) |
| 14 | Food Critics |
| 15–20 | Longer, denser shifts; final level "Sizzle Master" |

Star targets are derived from the expected value of each level's orders. They were balanced with a bot
(`npm run balance -w @sizzle/shared`). Simulating a player with ~1 s reaction time and no upgrades clears
levels 1–18 reliably and levels 19–20 about 80% of the time; with a few upgrades every level is passable.
A fast player (~0.4 s) can 3-star all 20 levels without upgrades. Failed attempts still pay the coins earned
during the shift, so replaying is always rewarding and there is no hard progression wall.

**Rewards** = coins earned in the shift (sales + tips + combo bonus) + a first-clear bonus (40 + 10 × level)
+ 25 coins for each new best star.

## Server-side validation

The client never reports coins. Each level works like this:

1. `POST .../start`: the server picks a random **seed**, snapshots the player's **upgrades**, and stores both in a `GameSession`.
2. The client plays with the shared engine and records every action with its simulation tick.
3. `POST /sessions/:id/complete`: the server **replays the entire shift** in the same deterministic engine
   and computes revenue, stars and rewards itself. Logs that are out of order, contain actions after the end, are
   malformed, are too large, or claim to have finished faster than real time are rejected. Double submissions
   are blocked by a conditional status update.

Upgrade purchases use database prices with an atomic "spend if `coins >= cost`" update.

## Testing

```bash
npm test
```
- **Engine unit tests** (`packages/shared/test`, 35 tests): RNG, grill/fryer/soda/blender timers and burning,
  burger assembly, bins/restocking, customer patience and walk-outs, orders, stars, rewards, upgrade effects,
  phase transitions, deterministic replay, and **a bot plays all 20 levels** to check each one is winnable.
- **API integration tests** (`apps/server/test`, 13 tests, need `TEST_DATABASE_URL`): register/login/logout,
  password hashing, guest→account conversion, auth guards, level unlocking, server-computed rewards,
  forged/out-of-order/double submissions, other players' sessions, upgrade pricing/limits, settings, config.
- **E2E** (`npm run e2e`): Playwright plays level 1 through the real UI (taps and drags), checks the results
  screen, then reloads to verify persistence. This was also run manually for level 13, and on phone
  (landscape/portrait) and tablet viewports during development.

## Not implemented / known limitations

- **One playable restaurant.** *Nonna Rosa Pizzeria* and *Koi Sushi Bar* appear in restaurant selection
  clearly marked "In development". They have no gameplay and cannot be opened.
- **Daily rewards** are not implemented. They were optional, and a daily login bonus is a time-gated mechanic.
- **No WebSockets.** Nothing in a single-player game needs real-time server push; REST covers it.
- **No password reset or email verification.** Logging out of a *guest* account loses access to it, and the UI warns about this.
- **Portrait phones:** the 16:9 kitchen scales down to fit and the game shows a hint to rotate the device.
- **Docker Compose** is provided for PostgreSQL, but this project was developed and tested against a local
  PostgreSQL 16 because Docker was not available in the development sandbox.
- **Anti-cheat** prevents forged results, but a script that plays the real game through the UI is not
  detectable (true of any client-side game).
- Music and sound effects are synthesized at runtime. They are simple, but original and fully configurable.
- Upgrade naming: the brief's "ingredient capacity" became **Kitchen Capacity** (more grill spots, plates, cup
  slots, fryer baskets and warmer space), and "starting ingredient quantities" became **Pantry Stock** (larger bins).
