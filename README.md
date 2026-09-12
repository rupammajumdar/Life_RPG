# ⚔️ Life RPG — Turn Your Life into a Character Sheet

> **"Turn your life into a character sheet you actually want to level up."**  
> A full-stack, cheat-resistant, gamified productivity web application built with **Next.js (App Router)**, **MongoDB (Mongoose)**, **NextAuth.js**, **TanStack React Query**, **Framer Motion**, and the **Web Audio API**.

---

## 🌟 Features Overview

### 1. 🛡️ Server-Authoritative Anti-Cheat Game Engine
- **No Client-Supplied Rewards:** The client never submits XP or Gold values. All awards are computed strictly on the backend from immutable reward tables (`Trivial`, `Easy`, `Medium`, `Hard`, `Epic`).
- **Exponential XP Curve:**
  $$\text{XP\_required}(\text{level}) = \lfloor 100 \times (1.15^{\text{level} - 1}) \rfloor$$
  Fast initial leveling that smoothly transitions into long-term RPG mastery.
- **Atomic Multi-Level Resolution:** Large quest completions loop-resolve all level thresholds in a single database transaction and trigger celebratory fanfare sequences.

### 2. ⚡ Tactile Optimistic UI, Offline Outbox & Web Audio Synthesizer
- **Instant Micro-Interactions:** Checkboxes spring to life, floating `+XP` particle bursts arc toward the level bar, and 8-bit chimes play with zero latency.
- **Client Request Idempotency:** Every completion and purchase carries a client-generated UUID v4 `clientRequestId`. MongoDB unique indexes reject replay attacks (HTTP 409).
- **Offline Outbox & Auto-Sync:** When disconnected (`navigator.onLine === false`), actions are queued in a persistent local outbox. When connectivity returns, the queue flushes idempotently.
- **Built-in 8-Bit Synthesizer:** Zero-dependency retro synthesizer utilizing Web Audio API oscillators for level-ups, purchases, and quest completions.

### 3. 🏆 Real-Time Global Leaderboard ("Hall of Heroes")
- **Live Sync Engine:** TanStack React Query background polling every 5 seconds (`refetchInterval: 5000`) with window-focus synchronization and live status indicator.
- **Championship Podium:** Top 3 players featured on 🥇 Gold Grand Champion, 🥈 Silver Vanguard, and 🥉 Bronze Paladin podium cards.
- **Comprehensive Global Roster:** Ranked by Lifetime XP, Streak Masters, or Quests Cleared with personal rank pinning and distance-to-next-rank hints.

### 4. 📱 Full Phone & Mobile Responsiveness
- **Sticky Top Bar:** Compact mobile header with level status pill, sound toggle, theme toggle, and hamburger menu.
- **Fixed Bottom Navigation Bar:** Thumb-friendly dock for one-tap switching between Dashboard, Quests, Ranks, Hero, Shop, and Log.
- **Slide-out Realm Drawer:** Touch-friendly drawer displaying full character stats, XP bar, Gold balance, Streak flame, and sync status.

### 5. 🗺️ 5 Core Attributes & Spider/Radar Chart
- **Attributes:** Strength, Intellect, Discipline, Creativity, Social.
- **Custom SVG Radar Map:** Pure animated SVG polygon chart driven by Framer Motion path animations.

### 6. 🔥 Server-Validated Streaks & Freeze Protection
- **Timezone-Authoritative Clock:** Daily resets convert server UTC time to the user's stored IANA timezone.
- **Streak Freeze Consumables:** Purchase up to 3 Streak Freezes to protect your streak on missed days.
- **Milestone Bonuses:** 7-day (+100 XP), 30-day (+500 XP), and 100-day (+2,000 XP) milestones.

### 7. 🏪 Virtual Bazaar, Wardrobe & Dual Theming
- **Shop Catalog:** Themes (`Cyberpunk Neon`), Avatar Frames (`Golden Dragon`, `Paladin Crest`, `Cyber Ninja`), Badges (`Centurion`, `Scholar`), and `Streak Freezes`.
- **Atomic Transactions:** Purchases run inside Mongoose ACID transactions to prevent double-spending.
- **Dual Themes:** Default **16-bit Pixel Retro** and unlockable **Cyberpunk Neon** toggled in real time.

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | Next.js 16 (App Router), React 19 | SSR/SSG app shell, server actions, route handlers |
| **Styling** | Vanilla CSS Tokens + Tailwind CSS | Pixel art aesthetics, scanlines, responsive grid |
| **Motion** | Framer Motion | Spring physics, layoutId animations, particle bursts |
| **Audio** | Web Audio API | Zero-dependency 8-bit retro synthesizer |
| **State** | TanStack React Query v5 | Optimistic UI mutations, background polling |
| **Database** | MongoDB Atlas via Mongoose | ACID transactions, unique indexes, TTL caches |
| **Authentication** | NextAuth.js v5 (Auth.js) | JWT session tokens, bcrypt password hashing |
| **Validation** | Zod v4 | Strict schema validation on all endpoints |

---

## 📂 Architecture & Directory Layout

```
Life RPG/
├── Life_RPG_PRD.md             # Complete Product Requirements Document
├── package.json                # Root proxy scripts (npm run dev, seed, test:engine)
└── life-rpg/                   # Next.js Application Root
    ├── src/
    │   ├── app/
    │   │   ├── (app)/          # Authenticated application shell
    │   │   │   ├── dashboard/  # Main Realm, stats, radar, today's quests
    │   │   │   ├── tasks/      # Quest Log (search, filters, edit, archive)
    │   │   │   ├── leaderboard/# Real-Time Hall of Heroes
    │   │   │   ├── character/  # Character Sheet, Badges, Wardrobe
    │   │   │   ├── shop/       # Bazaar, themes, frames, freezes
    │   │   │   ├── history/    # Immutable audit journal
    │   │   │   └── layout.tsx  # Responsive desktop sidebar + mobile navigation
    │   │   ├── api/            # Secure REST route handlers
    │   │   │   ├── auth/       # Register & NextAuth handlers
    │   │   │   ├── tasks/      # Task CRUD & [id]/complete anti-cheat
    │   │   │   ├── leaderboard/# Aggregated real-time global rankings
    │   │   │   ├── shop/       # Catalog & /purchase transactions
    │   │   │   ├── user/       # Dashboard, achievements, profile
    │   │   │   └── history/    # Audit log query
    │   │   └── auth/           # Pixel-art Login & Register pages
    │   ├── components/
    │   │   ├── character/      # AttributeRadarChart SVG
    │   │   ├── layout/         # Desktop Sidebar & MobileNav (top/bottom/drawer)
    │   │   ├── tasks/          # TaskCard, CreateTaskModal, EditTaskModal
    │   │   └── ui/             # LevelUpModal, XpBar, XpParticle
    │   ├── hooks/              # useDashboard, useTasks, useLeaderboard, useSyncStatus
    │   ├── lib/
    │   │   ├── game-engine/    # xp.ts, streaks.ts, rewards.ts
    │   │   ├── db/mongoose.ts  # Cached MongoDB singleton with DNS fallback
    │   │   ├── offline-outbox.ts# Reconnection sync engine
    │   │   ├── sound.ts        # 8-bit synthesizer
    │   │   ├── auth.ts         # NextAuth configuration
    │   │   └── validations.ts  # Zod schemas
    │   ├── models/             # Mongoose models (User, Task, Streak, etc.)
    │   └── scripts/
    │       ├── seed.ts         # Shop, Achievement & Hero account seeder
    │       └── test-engine.ts  # Automated verification test suite
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v20 or higher
- **MongoDB**: MongoDB Atlas connection string or local MongoDB instance

### 2. Installation
```bash
git clone https://github.com/rupammajumdar/Life_RPG.git
cd Life_RPG
npm install
```

### 3. Environment Variables
Create `.env.local` inside `life-rpg/` (see `life-rpg/.env.example`):
```env
MONGODB_URI="mongodb+srv://<username>:<password>@<cluster>.mongodb.net/Life_RPG?retryWrites=true&w=majority"
AUTH_SECRET="your-32-character-random-secret"
AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
```

### 4. Database Seeding & Verification
Seed the virtual bazaar, achievements, and realm champions:
```bash
npm run seed
```

Run the anti-cheat verification test suite:
```bash
npm run test:engine
```

### 5. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📜 License
MIT License. Built for heroes leveling up in the real world.
