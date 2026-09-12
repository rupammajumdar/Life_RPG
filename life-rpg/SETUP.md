# Life RPG — Developer Setup Guide

## Prerequisites
- Node.js 18+
- npm 9+
- A [MongoDB Atlas](https://cloud.mongodb.com/) account (free tier is fine)

---

## 1. Clone & Install

```bash
cd "Desktop/Life RPG/life-rpg"
npm install
```

---

## 2. Configure Environment Variables

Copy the template and fill in your values:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

| Variable | Where to get it |
|---|---|
| `MONGODB_URI` | MongoDB Atlas → your cluster → **Connect** → **Drivers** → copy the connection string. Replace `<password>` with your DB user password. |
| `AUTH_SECRET` | Run `openssl rand -base64 32` in your terminal, or visit [generate-secret.vercel.app](https://generate-secret.vercel.app/32) |
| `AUTH_URL` | `http://localhost:3000` for local dev |

---

## 3. MongoDB Atlas Setup (if new)

1. Create a **free M0 cluster** at [cloud.mongodb.com](https://cloud.mongodb.com/)
2. Create a **Database User** (Database Access tab) with Read/Write permissions
3. Add your IP to the **Network Access** allowlist (or `0.0.0.0/0` for dev)
4. Copy the connection string to `MONGODB_URI`

---

## 4. Seed the Database

This populates the ShopItem catalog and Achievement definitions:

```bash
npx tsx src/scripts/seed.ts
```

---

## 5. Run the Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/
│   │   ├── auth/           # NextAuth.js handlers
│   │   ├── tasks/          # Task CRUD + completion
│   │   ├── shop/           # Purchase endpoints
│   │   └── user/           # Profile / dashboard data
│   ├── auth/               # Login & Register pages
│   ├── dashboard/          # Main dashboard
│   ├── character/          # Character sheet
│   ├── shop/               # Shop page
│   └── history/            # Completion history
├── lib/
│   ├── db/mongoose.ts      # MongoDB connection singleton
│   ├── auth.ts             # NextAuth.js v5 config
│   └── game-engine/
│       ├── xp.ts           # XP curve & leveling
│       ├── rewards.ts      # Difficulty → XP/Gold lookup
│       └── streaks.ts      # Streak calculation
├── models/                 # Mongoose schemas
│   ├── User.ts
│   ├── Task.ts
│   ├── TaskCompletion.ts   # Immutable audit log
│   ├── UserAttribute.ts
│   ├── Streak.ts
│   ├── ShopItem.ts
│   ├── Inventory.ts
│   └── Achievement.ts      # + XpLedger
├── types/index.ts          # Shared TypeScript types
└── scripts/seed.ts         # DB seed script
```

---

## Anti-Cheat & Security Notes

- **No client-supplied reward values** — `POST /api/tasks/:id/complete` accepts only `taskId` + `clientRequestId`. XP/Gold are computed server-side from the difficulty lookup table.
- **Idempotency** — `clientRequestId` (UUID v4) has a unique index on `TaskCompletion`. Retried requests from the optimistic UI are safe.
- **JWT auth** — short-lived access tokens, verified on every mutating request via NextAuth middleware.
- **Server-authoritative time** — streak calculations use the server's clock converted to the user's stored IANA timezone.
- **passwordHash excluded by default** — Mongoose `select: false` ensures it never appears in API responses.
