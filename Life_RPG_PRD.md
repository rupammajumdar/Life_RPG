# Product Requirements Document: Life RPG
**Problem Statement Reference:** TZPSv2
**Document Owner:** Product & Engineering
**Status:** Draft v1.0
**Last Updated:** September 12, 2026

---

## 1. Executive Summary & Vision

### 1.1 Problem Statement
Traditional productivity tools (to-do lists, habit trackers, calendars) fail because they rely on **delayed, abstract gratification**. Checking a box carries no emotional weight, no sense of growth, and no immediate feedback loop. Video games, by contrast, have solved motivation through decades of iteration on core loops: instant feedback, visible progression, risk/reward, and social status.

**Life RPG** closes this gap by translating real-world actions (workouts, coding sessions, reading, chores) into RPG mechanics — XP, levels, attributes, streaks, and a virtual economy — layered on top of a genuinely persistent, secure, multi-device system. This is not a toy with fake stats stored in the browser; it is a full-stack application where progression is authoritative, auditable, and cheat-resistant, because self-deception defeats the entire purpose of the tool.

### 1.2 Vision Statement
> "Turn your life into a character sheet you actually want to level up."

Life RPG aims to be the system layer between a user's real-world intentions and their long-term identity change, using proven game-design psychology (variable rewards, loss aversion via streaks, mastery curves) without becoming exploitative or addictive in a harmful sense (see Section 6.5 — Ethical Guardrails).

### 1.3 Success Metrics (North Star + Supporting)
| Metric | Target (90 days post-launch) |
|---|---|
| D7 Retention | ≥ 35% |
| Average streak length | ≥ 4 days |
| Tasks logged per active user/week | ≥ 10 |
| Optimistic UI rollback rate (failed syncs) | < 2% of actions |
| API-detected cheat attempts blocked | 100% (0 successful XP forgeries in audit) |

---

## 2. Target Audience & Use Cases

### 2.1 Primary Personas

**Persona A — "The Grinder" (Self-improvement enthusiast, 18–30)**
Already tracks habits in Notion or a spreadsheet but finds it emotionally flat. Wants visible proof of growth. Motivated by numbers going up.

**Persona B — "The Relapsing Optimizer" (25–40)**
Has tried and abandoned 5+ productivity apps. Starts strong, loses motivation within 2 weeks. Needs a system that punishes disengagement gently (streak decay) and rewards consistency disproportionately (exponential XP curve).

**Persona C — "The Multi-Domain Builder" (Student/Developer, 18–28)**
Balances multiple life domains (fitness, coding, learning, social) and wants a unified way to see how effort in one area (Gym → Strength) contributes to an overall sense of character growth, not just isolated checklists.

### 2.2 Core Use Cases
1. As a user, I log a real-world task ("Leg day at gym") and immediately see XP and Strength attribute points animate onto my character sheet.
2. As a user, I see my current Level, XP-to-next-level bar, and active Streaks the moment I open the app on any device.
3. As a user, I spend earned Gold/Points in a shop to unlock a cosmetic theme, avatar frame, or badge.
4. As a user, I complete a task while offline (e.g., subway, gym with no signal); the UI updates instantly and reconciles once connectivity returns.
5. As a returning user, I log in on a new device and see my exact historical XP, levels, and inventory — because progression lives in the database, not the browser.
6. As a malicious/curious user, I attempt to call the API directly to grant myself 999,999 XP; the request is rejected and logged.

### 2.3 Out of Scope (v1)
- Social/multiplayer features (guilds, leaderboards, PvP) — reserved for v2.
- Native mobile apps (this is a responsive web app in v1).
- AI-generated quest suggestions (potential v2/v3 feature).

---

## 3. Core Features & Mechanics

### 3.1 Task System
- **Task Types:** Quick Tasks (one-off, e.g., "Read 20 pages") and Recurring Quests (daily/weekly, e.g., "Gym — Mon/Wed/Fri").
- Each task is tagged with one or more **Categories** (Fitness, Intellect, Creativity, Discipline, Social) that map to Attributes.
- Each task has a **Difficulty Tier** (Trivial / Easy / Medium / Hard / Epic) which determines base XP reward, set via a fixed server-side lookup table — never client-supplied.
- Empty/whitespace-only task titles are rejected client-side (disabled submit button) and server-side (400 Validation Error) — see Section 6.

### 3.2 Leveling System (Non-Linear XP Curve)
To avoid the "flat grind" feeling of linear leveling, XP-to-next-level follows an exponential curve:

```
XP_required(level) = floor(BASE_XP * (GROWTH_RATE ^ (level - 1)))

Where:
BASE_XP = 100
GROWTH_RATE = 1.15

Level 1 → 2:   100 XP
Level 5 → 6:   ~174 XP
Level 10 → 11: ~350 XP
Level 20 → 11: ~1,400 XP
```

This ensures early levels feel fast and rewarding (hooking new users in the first session) while later levels require sustained engagement, mirroring proven RPG retention curves (cf. MMO leveling design). The curve constants are stored server-side and versioned, so future rebalancing does not require a client update.

**Level-up event:** Triggers a full-screen celebratory micro-interaction (see Section 4), unlocks any level-gated cosmetic rewards, and is persisted as an immutable historical log entry.

### 3.3 Attributes System
Five core attributes, each with its own independent XP/level track, derived from task category tags:

| Attribute | Fed By (example categories) |
|---|---|
| Strength | Gym, Sports, Physical Labor |
| Intellect | Coding, Reading, Studying |
| Discipline | Chores, Finance tasks, Habit consistency |
| Creativity | Writing, Art, Music practice |
| Social | Networking, Family time, Social events |

Completing a task grants XP to (a) the global character Level and (b) the specific Attribute(s) tied to its category, in a single atomic transaction. A user's "Character Sheet" visualizes all five attributes as a radar/spider chart alongside the primary level.

### 3.4 Streak System
- A streak increments once per calendar day (user's local timezone, captured at account creation and stored server-side) in which at least one task is completed.
- Missing a full day resets the streak counter to 0, but a **"Streak Freeze"** item (purchasable from the shop, limited quantity) can protect one missed day.
- Streak milestones (7, 30, 100, 365 days) grant bonus XP and exclusive cosmetic badges.
- Streak state is computed server-side from the authoritative task-completion log, not from a client-side counter — preventing manipulation via device clock changes (server uses its own UTC timestamp validated against a reasonable drift window).

### 3.5 Virtual Economy
- **Gold** is earned as a secondary currency alongside XP (rate configurable per difficulty tier).
- Gold is spent in a **Shop** on:
  - Cosmetic Themes (visual reskins of the dashboard — e.g., unlocking "Cyberpunk Neon" if the default theme is Pixel Retro).
  - Avatar frames / character portraits.
  - Badges (also earnable "for free" via achievements, some are Gold-exclusive).
  - Streak Freeze consumables.
- All Gold balances and purchases are validated and mutated server-side inside a single transaction to prevent race conditions (e.g., double-spending via rapid duplicate requests).

### 3.6 Achievements & Badges
Static and dynamic achievement definitions (e.g., "Complete 50 Fitness tasks", "Reach Level 10 Intellect") are evaluated server-side after each task completion and awarded idempotently (a database uniqueness constraint prevents duplicate awards).

---

## 4. UX/UI & Thematic Direction

### 4.1 Thematic Direction (Recommended: Pixel Art Retro, with Cyberpunk as unlockable alt-theme)
The default theme uses a **16-bit Pixel Art RPG** aesthetic — reminiscent of classic JRPG character/stat screens — because it is timeless, performs well with simple sprite-based micro-animations, and is friendly/approachable for a broad audience. A **Cyberpunk Neon** theme is offered as a premium unlockable (via Gold or level-gate) to give power users a customization goal, using neon gradients, glitch-text micro-interactions, and glowing progress bars.

Both themes share the same component structure and CSS-variable-driven design tokens, so switching themes is a pure styling swap with zero logic changes (see Section 5.4).

### 4.2 "Alive and Tactile" Principles
1. **Micro-interactions everywhere:** buttons depress on press (scale 0.96 + shadow reduction), checkboxes "pop" with a spring easing curve, not linear/ease-in-out.
2. **Spring physics over duration-based easing:** all UI motion (XP bar fill, level-up modal, card entrance) uses spring animation (e.g., Framer Motion's `type: "spring"`, stiffness ~300, damping ~20) rather than fixed-duration tweens, so motion feels physically responsive rather than "animated."
3. **Juice on completion:** completing a task triggers, in sequence: (a) instant checkbox/strike-through, (b) a floating "+15 XP" particle that arcs toward the XP bar, (c) XP bar fill animation, (d) a subtle screen-shake or particle burst only on level-up (never on ordinary task completion, to avoid fatigue).
4. **Sound design (optional, togglable):** short 8-bit chime on task completion, a distinct fanfare on level-up.
5. **Empty/loading states are illustrated, not blank** — e.g., a sleeping pixel-art character when there are no tasks for the day.

### 4.3 Optimistic UI (Core UX Requirement)
Every user action that would normally require a round-trip (completing a task, buying a shop item) must **update the UI instantly** using an optimistic local state mutation, while the network request happens in the background. See Section 6.4 for the full technical handling of rollback/reconciliation.

### 4.4 Key Screens
- **Dashboard:** Character summary card (Level, XP bar, streak flame icon), Today's Quests list, Attribute radar chart.
- **Character Sheet:** Full attribute breakdown, equipped cosmetics, achievement gallery.
- **Task/Quest Log:** Create/edit tasks, recurring quest configuration.
- **Shop:** Gold balance, purchasable items grouped by category.
- **History/Journal:** Chronological, read-only log of all completed tasks and XP events (sourced directly from the immutable audit log — see Section 5.5).

---

## 5. Technical Architecture & Data Model

### 5.1 Recommended Stack (selected from the Allowed Technology list)

| Layer | Choice | Justification |
|---|---|---|
| Frontend | **Next.js (React)** | SSR/SSG for fast initial load, file-based routing, strong ecosystem for animation libraries (Framer Motion) and API integration. |
| Backend | **Node.js / Express** | Shares JS/TS language with frontend (reduces context switching), mature ecosystem for JWT auth, rate limiting, and validation middleware. Deployed as a separate service from the Next.js frontend to enforce a hard client/server trust boundary. |
| Database | **PostgreSQL** | Relational integrity is critical here — XP transactions, streak calculations, and shop purchases all require ACID-compliant transactions and foreign-key integrity (e.g., a purchase must atomically debit Gold and insert an inventory row). |
| ORM | Prisma | Type-safe schema, migrations, and transaction support against PostgreSQL. |
| Styling | **Tailwind CSS** | Utility-first approach pairs well with CSS-variable-based theming (Section 4.1) and rapid iteration on micro-interaction states. |
| Animation | Framer Motion (React) | Native spring-physics animation support, required for Section 4.2. |
| Auth | JWT (access + refresh token pattern), bcrypt password hashing | Stateless auth suitable for cross-device sync; refresh tokens stored as httpOnly cookies to mitigate XSS token theft. |
| Deployment | Frontend: Vercel · Backend: Render/Railway · DB: managed PostgreSQL (e.g., Supabase or Railway Postgres) | Free/low-cost tiers sufficient for MVP deployment deliverable. |

**Architectural Principle:** The frontend is treated as **fully untrusted**. All game-logic calculations that affect persisted state (XP amounts, level-up detection, streak logic, Gold balances) are computed and validated exclusively on the backend. The frontend's local "optimistic" state is a *prediction*, never a *source of truth*.

### 5.2 High-Level Architecture Diagram (described)
```
[ Next.js Client ]
      | (HTTPS, JWT in Authorization header)
      v
[ Express API Gateway ]
   ├── Auth Middleware (JWT verify)
   ├── Rate Limiter (per-user, per-endpoint)
   ├── Validation Layer (schema validation, e.g., Zod)
   └── Route Controllers
          ├── /auth        -> Auth Service
          ├── /tasks        -> Task Service --> XP/Level Engine
          ├── /shop         -> Economy Service
          └── /history      -> Audit Log Service
      |
      v
[ PostgreSQL (via Prisma) ]
   Tables: users, tasks, task_completions, attributes,
           user_attributes, streaks, shop_items,
           inventory, xp_ledger, achievements
```

### 5.3 Database Schema (Core Tables)

**`users`**
| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| email | varchar, unique | |
| password_hash | varchar | bcrypt |
| username | varchar, unique | |
| level | int | denormalized cache, recalculated from xp_ledger |
| total_xp | bigint | authoritative sum, server-updated only |
| gold | bigint | authoritative balance, server-updated only |
| timezone | varchar | captured at signup for streak-day calculation |
| created_at | timestamp | |

**`tasks`**
| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| user_id | UUID (FK → users) | |
| title | varchar, not null, min length 1 (trimmed) | |
| category | enum (Strength, Intellect, Discipline, Creativity, Social) | |
| difficulty | enum (Trivial, Easy, Medium, Hard, Epic) | |
| recurrence | enum (One-Off, Daily, Weekly) | |
| is_archived | boolean | |
| created_at | timestamp | |

**`task_completions`** *(immutable audit log — never updated or deleted, only inserted)*
| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| task_id | UUID (FK) | |
| user_id | UUID (FK) | |
| xp_awarded | int | computed server-side at time of completion |
| gold_awarded | int | |
| client_request_id | UUID, unique | idempotency key — see Section 6.2 |
| completed_at | timestamp (server-generated) | |

**`user_attributes`**
| Column | Type | Notes |
|---|---|---|
| user_id | UUID (FK) | |
| attribute | enum | |
| xp | int | |
| level | int | |
| (composite PK: user_id + attribute) | | |

**`streaks`**
| Column | Type | Notes |
|---|---|---|
| user_id | UUID (FK, PK) | |
| current_streak | int | |
| longest_streak | int | |
| last_completed_date | date (server-derived, user's timezone) | |
| freezes_available | int | |

**`shop_items`** / **`inventory`** / **`achievements`**
Standard catalog + ownership join-table pattern; purchases and achievement grants are wrapped in a single DB transaction alongside the corresponding Gold/XP ledger mutation.

### 5.4 Theming Architecture
Themes (Pixel Retro, Cyberpunk) are implemented as sets of CSS custom properties (`--color-primary`, `--font-display`, `--sprite-set`) scoped at the root, toggled via a `data-theme` attribute — allowing Tailwind's `theme()` extension and component logic to remain theme-agnostic.

### 5.5 Idempotency & Audit Trail
Every state-mutating request from the client includes a client-generated `client_request_id` (UUID v4). The server enforces a unique constraint on this field per relevant table, so a retried request (e.g., due to a flaky connection during an optimistic update) never double-awards XP.

---

## 6. Security, Edge Cases & Error Handling

### 6.1 Anti-Cheat: Preventing XP/Gold Manipulation
- **No client-supplied reward values.** The `POST /tasks/:id/complete` endpoint never accepts an `xp` or `gold` field from the client. Rewards are looked up server-side from the task's `difficulty` tier against a fixed, versioned reward table.
- **Rate limiting & anomaly detection:** Per-user rate limits on completion endpoints (e.g., max N completions/minute) with server-side flags raised on statistically implausible activity bursts (e.g., 500 tasks completed in 10 seconds), routed to a review queue rather than silently applied.
- **Server-authoritative time:** Streak-day and "daily task" resets use the server's clock (converted to the user's stored timezone), never a client-reported timestamp, preventing device-clock manipulation.
- **JWT verification on every mutating request**, with short-lived access tokens (15 min) and rotating refresh tokens to limit the blast radius of a leaked token.
- **Direct API calls are treated as a first-class threat model**, not an edge case — all business rules enforced above apply identically whether the request comes from the official UI or a raw `curl`/Postman call.

### 6.2 Idempotency for Optimistic Actions
Because the UI fires requests optimistically (Section 4.3), duplicate submissions are a realistic failure mode (e.g., a user tapping "Complete" twice during lag, or a retried request after a timeout). The `client_request_id` uniqueness constraint (Section 5.5) guarantees exactly-once processing regardless of how many times the same logical action is transmitted.

### 6.3 Input Validation & Empty Submission Handling
- **Client-side:** Submit controls are disabled while the trimmed task title is empty; inline validation message shown on blur.
- **Server-side (defense in depth):** Zod (or equivalent) schema validation rejects empty/whitespace-only titles, over-length titles (e.g., >200 chars), and invalid enum values (category/difficulty) with a `400 Bad Request` and a structured error payload — the client never trusts its own validation as sufficient.

### 6.4 Optimistic UI Rollback Strategy
1. **On user action:** apply the predicted state change immediately to local UI state (e.g., increment local XP bar, mark task complete) and enqueue the API request.
2. **On success response:** reconcile local predicted state with the server's authoritative response (server may return a slightly different XP value if, e.g., a streak bonus applied) — a brief "correction" animation plays if the values differ.
3. **On failure (4xx/5xx) or timeout:** roll back the optimistic UI change (task reappears as incomplete, XP bar reverts) with a non-jarring reverse animation, and surface a toast notification ("Couldn't save — check your connection. Tap to retry.").
4. **On offline detection (`navigator.onLine` / failed fetch):** queue the action in a local outbox (in-memory or IndexedDB for the session) with its `client_request_id` already assigned; display a subtle "syncing" indicator. On reconnect, flush the outbox in order; each request's idempotency key ensures safe replay even if one had actually succeeded before the connection dropped.
5. **Conflict on reconnect:** if the server state has diverged significantly (e.g., completed on another device in the meantime), the client discards its stale optimistic prediction in favor of a fresh authoritative fetch, rather than attempting a manual merge.

### 6.5 Additional Edge Cases
| Edge Case | Handling |
|---|---|
| Duplicate task completion via multi-tab | `client_request_id` + DB unique constraint on completion prevents double-award; second tab reconciles to server state. |
| Timezone change / travel | Streak-day boundary uses the timezone stored at last activity update, with a grace-window rule to avoid unfairly breaking a streak on the transition day. |
| Level-up spanning multiple levels in one action (e.g., a huge XP bonus) | Server loop-resolves all level-ups in the same transaction and returns an array of level-up events; client plays them sequentially. |
| Insufficient Gold at purchase time (race condition) | Purchase endpoint re-checks balance inside the same DB transaction as the debit — rejected with `402`-equivalent structured error if insufficient, regardless of what the optimistic client believed. |
| Malformed/expired JWT | `401 Unauthorized` → client attempts silent refresh via refresh token; on failure, redirect to login without losing unsynced local outbox (persisted until re-auth). |
| Deleted/archived task with pending completion in outbox | Server rejects with `404`/`409`; client discards the queued action and notifies the user. |

### 6.6 Ethical Guardrail
Because the app deliberately uses reward-loop psychology, the design must avoid dark patterns that exploit compulsion loops beyond the point of genuine user benefit (e.g., no artificial streak-anxiety notifications designed purely to manipulate rather than inform, no pay-to-win mechanics since the "currency" is effort, not real money in v1).

---

## 7. Milestones & Deliverables Checklist

### 7.1 Development Milestones
| Phase | Scope | Target Duration |
|---|---|---|
| M1 — Foundation | Auth (signup/login/JWT), DB schema + migrations, base Next.js app shell | Week 1–2 |
| M2 — Core Loop | Task CRUD, completion endpoint, server-side XP/Level engine, basic dashboard UI | Week 3–4 |
| M3 — RPG Depth | Attributes system, streak tracking, exponential leveling curve, achievements | Week 5 |
| M4 — Economy & Polish | Shop, Gold, cosmetics/theming (Pixel Retro + Cyberpunk), micro-interactions/spring animations | Week 6–7 |
| M5 — Robustness | Optimistic UI + offline outbox + rollback, anti-cheat hardening, rate limiting, load/security testing | Week 8 |
| M6 — Launch Prep | Deployment, demo video production, documentation, QA pass | Week 9 |

### 7.2 Final Deliverables Checklist
- [ ] **Public GitHub Repository** — clean commit history, README with setup instructions, `.env.example`, architecture overview.
- [ ] **Live Deployed URL** — frontend + backend + database fully connected in a production environment (not localhost).
- [ ] **Demo Video (90–180 sec, < 100MB)** covering, in sequence:
  1. User authentication (signup or login).
  2. Creating and completing a task, showing the optimistic UI update, XP/attribute animation, and (if triggered) a level-up.
  3. A page refresh (or logout/login) immediately after, demonstrating that Level/XP/Gold/streak state persisted correctly from the database — not from local storage.
  4. (Bonus) A brief glimpse of the Shop and theme switch to showcase the tactile UX direction.
- [ ] **Technical Documentation** — API endpoint reference, database schema diagram, and a short "Anti-Cheat & Reliability" note summarizing Section 6 decisions for reviewers.

---

*End of Document — Life RPG PRD (TZPSv2), v1.0*
