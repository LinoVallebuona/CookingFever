# Sizzle Shift REST API

Base URL: `/api` (in development the Vite dev server proxies `/api` to `http://localhost:3001`).

* All bodies are JSON. Authentication uses an **httpOnly session cookie** (`sizzle_session`)
  set by the auth endpoints. API clients may alternatively send `Authorization: Bearer <token>`.
* Errors always have the shape `{ "error": "CODE", "message": "Human readable", "details"?: ... }`.

| Status | `error`            | Meaning                                         |
| ------ | ------------------ | ----------------------------------------------- |
| 400    | `VALIDATION_ERROR` / `BAD_REQUEST` | Invalid input / not enough coins |
| 401    | `UNAUTHORIZED`     | Not logged in / wrong credentials               |
| 403    | `FORBIDDEN`        | Level or restaurant locked                      |
| 404    | `NOT_FOUND`        | Unknown resource                                |
| 409    | `CONFLICT`         | Duplicate username/email, already submitted, upgrade maxed |
| 422    | `UNPROCESSABLE`    | Game result rejected by server-side validation  |
| 429    | —                  | Rate limited                                    |

Types referenced below live in `packages/shared/src/api-types.ts`.

---

## Health

### `GET /api/health`
`200 { ok: true, time }` – also checks the database connection.

## Auth (rate limited: 20 req/min per IP)

### `POST /api/auth/register`
Body `{ username, email, password }` (username 3–20 chars `[A-Za-z0-9_.-]`, password ≥ 8 chars).
If the caller is currently a **guest**, the guest account is converted in place and keeps all progress.
→ `201 PlayerStateDTO` + session cookie.

### `POST /api/auth/login`
Body `{ identifier, password }` – identifier is username **or** email (case-insensitive).
→ `200 PlayerStateDTO` + session cookie.

### `POST /api/auth/guest`
Creates a guest account (`Guest-123456`) with a real, persisted profile. → `201 PlayerStateDTO` + cookie.

### `POST /api/auth/logout`
Deletes the session and clears the cookie. → `200 { ok: true }`

### `GET /api/auth/me` 🔒
→ `200 PlayerStateDTO`

## Game configuration (public)

### `GET /api/config`
→ `GameConfigDTO`: `{ restaurants, levels: { diner: LevelDef[20] }, upgradeCosts: { diner: { grillSpeed: number[5], ... } } }`.
Upgrade costs are read from the `RestaurantUpgrade` table.

### `GET /api/config/upgrades`
Upgrade definitions (names, descriptions, per-level effects, costs).

## Player 🔒

### `GET /api/player/state`
→ `PlayerStateDTO`:
```jsonc
{
  "user": { "id", "username", "email", "isGuest", "createdAt" },
  "profile": {
    "coins", "totalStars", "totalLevelsCompleted",
    "stats": { "totalCoinsEarned", "totalCustomersServed", "totalCustomersLost", "totalGamesPlayed", "bestCombo" },
    "settings": { "audio": { "master", "music", "sfx", "voices", "ui" }, "showHints", "reducedMotion" }
  },
  "restaurants": [{
    "restaurant": RestaurantDef, "unlocked", "stars",
    "upgrades": { "grillSpeed": 0, ... },
    "levels": [{ "levelNumber", "bestStars", "bestRevenue", "completed", "attempts", "unlocked" }]
  }]
}
```

### `PUT /api/player/settings`
Body: full `PlayerSettings`. → saved settings.

### `POST /api/player/upgrades/purchase`
Body `{ restaurantId: "diner", upgradeType: "grillSpeed" | "fryerSpeed" | "capacity" | "foodQuality" | "patience" | "startingStock" | "servingEfficiency" }`.
The price comes from the database; coins are deducted atomically (`coins >= cost` conditional update).
→ `200 { upgradeType, newLevel, cost, player: PlayerStateDTO }` · `400` not enough coins · `409` maxed.

### `GET /api/player/history?limit=10`
Most recent finished shifts: `[{ id, levelNumber, levelName, status, revenue, stars, coinsAwarded, finishedAt }]`.

## Playing a level 🔒

### `POST /api/game/restaurants/:restaurantId/levels/:levelNumber/start`
Checks the level is unlocked, abandons any previous unfinished run, increments `attempts`, and creates a
`GameSession` with a **server-generated random seed** and a **snapshot of the player's upgrades**.
→ `200 StartLevelResponse { sessionId, seed, level: LevelDef, upgrades }`

The client must run the shared deterministic engine with exactly this `level`, `upgrades` and `seed`.

### `POST /api/game/sessions/:sessionId/complete`
Body:
```jsonc
{
  "actions": [ { "t": 154, "a": { "type": "bin", "bin": "patty" } }, ... ],  // ≤ 20 000
  "clientResult": { "revenue": 72, "stars": 3 }  // optional, only logged on mismatch
}
```
`t` is the simulation tick (60 ticks/s) at which the action was applied. Valid actions:

| `type`   | fields                                   |
| -------- | ---------------------------------------- |
| `bin`    | `bin` (ingredient), `plate?`             |
| `grill`  | `slot`, `plate?`                         |
| `plate`  | `plate`, `customer?`                     |
| `fryer`  | `basket`                                 |
| `warmer` | `customer?`                              |
| `cup`    | `slot`, `customer?`                      |
| `shaker` | `slot`, `customer?`                      |
| `discard`| `station` (`plate`/`grill`/`fryer`/`cup`/`shaker`), `index` |

The server **replays** the whole shift with the stored seed and upgrade snapshot and computes the
authoritative result, stars and coin reward. It rejects (422) out-of-order logs, actions after the end
of the level, and runs that finished faster than real time allows (`MIN_REALTIME_FACTOR`).
Submitting twice returns 409.

→ `200 CompleteLevelResponse`:
```jsonc
{
  "result": { "revenue", "sales", "tips", "comboBonus", "served", "lost", "totalCustomers",
              "satisfaction", "maxCombo", "wasted", "itemsServed", "stars", "passed",
              "objectives": [{ "id", "label", "met" }], "ticks", "seconds" },
  "reward": { "levelCoins", "firstClearBonus", "starBonus", "total", "newBestStars" },
  "newlyUnlockedLevel": 2,
  "player": PlayerStateDTO
}
```
