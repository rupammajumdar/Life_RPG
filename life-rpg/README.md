# ⚔️ Life RPG — Turn Your Life into a Character Sheet

> **"Turn your life into a character sheet you actually want to level up."**
> A full-stack, cheat-resistant, gamified productivity web application built with **Next.js (App Router)**, **MongoDB (Mongoose)**, **NextAuth.js**, **TanStack React Query**, **Framer Motion**, and **Web Audio API**.

---

## 🌟 Features Overview

### 1. 🛡️ Authoritative Anti-Cheat Game Engine
- **Server-Authoritative Progression:** The client **never** supplies XP, Gold, or Level values. All rewards are computed strictly server-side from immutable lookup tables (`Trivial`, `Easy`, `Medium`, `Hard`, `Epic`).
- **Exponential XP Curve:**
  $$\text{XP\_required}(\text{level}) = \lfloor 100 \times (1.15^{\text{level} - 1}) \rfloor$$
  Fast initial leveling that smoothly transitions into a sustained RPG mastery curve.
- **Multi-Level Resolution:** Huge XP awards loop-resolve all level-ups atomically, returning sequential level-up events for celebratory animations.

### 2. ⚡ Tactile Optimistic UI with Offline Outbox & Idempotency
- **Instant Micro-Interactions:** Checkboxes spring to life, floating `+XP` particles arc towards the level bar, and 8-bit chimes play with zero latency.
- **Client Request Idempotency:** Every completion and purchase carries a client-generated UUID v4 `clientRequestId`. MongoDB unique compound indexes prevent double-awarding during network lag or multi-tab races (HTTP 409).
- **Offline Outbox & Auto-Sync:** When offline (`navigator.onLine === false`), actions are queued in a local persistent outbox. When connectivity is restored, the queue auto-flushes idempotently.
- **Optimistic Rollback:** On server validation errors (4xx/5xx), optimistic state reverts cleanly with toast notifications.

### 3. 🗺️ 5 Core Attributes & Spider/Radar Chart
- **Attributes:** Strength, Intellect, Discipline, Creativity, Social.
- **Custom Radar Map:** Pure SVG animated spider chart driven by Framer Motion path animations.
- Independent XP bars and progression tracks for every attribute.

### 4. 🔥 Server-Validated Streaks & Freeze Protection
- **Server Clock in User Timezone:** Streak calculations convert server UTC time to the user's IANA timezone. Prevents device-clock tampering.
- **Streak Freeze Consumables:** Users can purchase up to 3 Streak Freezes from the shop. Missing a day consumes a freeze automatically and preserves the streak.
- **Milestone Bonuses:** 7-day (+100 XP), 30-day (+500 XP), 100-day (+2,000 XP) milestones.

### 5. 🏪 Virtual Bazaar & Wardrobe
- **Shop Catalog:** Themes (`Cyberpunk Neon`), Avatar Frames (`Golden Dragon`, `Paladin Crest`, `Cyber Ninja`), Badges (`Centurion`, `Scholar`), and `Streak Freeze`.
- **Atomic Double-Spend Protection:** Gold debit and inventory insertion run inside Mongoose ACID transactions.
- **Direct Wardrobe Equipping:** Equip owned themes and avatar frames directly from the Shop or Character Sheet.

### 6. 🏆 Automated Achievements & Audit Log
- **Server-Evaluated Achievements:** Evaluated after every quest completion (`task_count`, `streak_milestone`, `global_level`, `attribute_level`).
- **Immutable Historical Journal:** Read-only audit log of all completed quests and ledger transactions.

### 7. 🔊 8-Bit Web Audio Synthesizer & Dual Theming
- **Zero-Dependency Sound Engine:** Built-in Web Audio API square/triangle synthesizer playing retro chimes, purchase cash register sounds, and level-up fanfares.
- **Dual Themes:** Default **16-bit Pixel Retro** and unlockable **Cyberpunk Neon** toggled via root CSS variables and `data-theme`.

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | Next.js 16 (App Router), React 19 | SSR/SSG app shell, server actions, route handlers |
| **Styling** | Vanilla CSS Tokens + Tailwind CSS | Pixel art aesthetics, scanlines, responsive grid |
| **Motion** | Framer Motion | Spring physics, layoutId animations, particle bursts |
| **Audio** | Web Audio API | Zero-dependency 8-bit retro synthesizer |
| **State** | TanStack React Query v5 | Optimistic UI mutations, cache reconciliation |
| **Database** | MongoDB Atlas via Mongoose | ACID transactions, unique indexes, TTL caches |
| **Authentication** | NextAuth.js v5 (Auth.js) | JWT session tokens, bcrypt password hashing |
| **Validation** | Zod v4 | Strict schema validation on all inputs |

---

## 📂 Architecture & Directory Layout

```
life-rpg/
├── src/
│   ├── app/
│   │   ├── (app)/               # Authenticated application shell
│   │   │   ├── dashboard/       # Main Realm, stats, radar, today's quests
│   │   │   ├── tasks/           # Full Quest Log (filters, edit, archive)
│   │   │   ├── character/       # Character Sheet, Badges, Wardrobe
│   │   │   ├── shop/            # Bazaar, themes, frames, freezes
│   │   │   ├── history/         # Immutable audit journal
│   │   │   └── layout.tsx       # Sidebar + main responsive grid
│   │   ├── api/                 # Secure REST route handlers
│   │   │   ├── auth/            # Register & NextAuth handlers
│   │   │   ├── tasks/           # Task CRUD & [id]/complete anti-cheat
│   │   │   ├── shop/            # Catalog & /purchase transactions
│   │   │   ├── user/            # Dashboard, achievements, profile
│   │   │   └── history/         # Audit log query
│   │   └── auth/                # Pixel-art Login & Register pages
│   ├── components/
│   │   ├── character/           # AttributeRadarChart SVG
│   │   ├── layout/              # Sidebar with live sync & sound controls
│   │   ├── tasks/               # TaskCard, CreateTaskModal, EditTaskModal
│   │   └── ui/                  # LevelUpModal, XpBar, XpParticle
│   ├── hooks/                   # useDashboard, useTasks, useSyncStatus
│   ├── lib/
│   │   ├── game-engine/         # xp.ts, streaks.ts, rewards.ts
│   │   ├── db/mongoose.ts       # Cached MongoDB singleton with DNS fallback
│   │   ├── offline-outbox.ts    # Reconnection sync engine
│   │   ├── sound.ts             # 8-bit synthesizer
│   │   ├── auth.ts              # NextAuth configuration
│   │   └── validations.ts       # Zod schemas
│   ├── models/                  # Mongoose models (User, Task, Streak, etc.)
│   └── scripts/
│       ├── seed.ts              # Shop & Achievement seeder
│       └── test-engine.ts       # Automated verification test suite
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v20 or higher (v24 recommended)
- **MongoDB**: MongoDB Atlas URI or local instance (`mongodb://localhost:27017/Life_RPG`)

### 2. Installation
```bash
git clone <repo-url>
cd life-rpg
npm install
```

### 3. Environment Variables
Create `.env.local` in `life-rpg/`:
```env
MONGODB_URI="mongodb+srv://<user>:<password>@cluster0.zee69ax.mongodb.net/Life_RPG?retryWrites=true&w=majority"
AUTH_SECRET="your-32-character-random-secret"
AUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### 4. Seed Catalog & Run Tests
Seed the Shop catalog and Achievement definitions:
```bash
npm run seed
```

Run the automated game engine and anti-cheat tests:
```bash
npx tsx --env-file=.env.local src/scripts/test-engine.ts
```

### 5. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔒 Anti-Cheat & Security Model (PRD Section 6)

1. **Untrusted Frontend:** The client never submits `xp` or `gold`. The completion route accepts only `{ clientRequestId }` and looks up the reward in a server-side table keyed by the task's stored difficulty.
2. **Idempotent Mutations:** A unique index on `clientRequestId` inside `TaskCompletion` rejects duplicate submissions with HTTP 409.
3. **Atomic Operations:** XP, Gold, Streak, Attributes, Ledger, and Inventory mutations execute within Mongoose sessions to guarantee ACID consistency.
4. **Authoritative Time:** Daily resets and streak evaluations use the server clock converted to the user's registered IANA timezone.
5. **Defense in Depth Validation:** Client-side form constraints (disabling submit on whitespace/empty inputs) are mirrored by strict Zod schema validation on the backend.

---

## 📜 License
MIT License. Built for heroes leveling up in the real world.
