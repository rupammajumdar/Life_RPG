/**
 * Shared TypeScript types for Life RPG.
 * These types are safe to import on both client and server.
 * Do NOT import any server-only modules (mongoose, bcrypt, etc.) here.
 */

// ─── Enums ────────────────────────────────────────────────────────────────────

export type TaskCategory =
  | "Strength"
  | "Intellect"
  | "Discipline"
  | "Creativity"
  | "Social";

export type TaskDifficulty = "Trivial" | "Easy" | "Medium" | "Hard" | "Epic";

export type TaskRecurrence = "One-Off" | "Daily" | "Weekly";

export type AppTheme = "pixel-retro" | "cyberpunk";

// ─── API Response shapes ──────────────────────────────────────────────────────

export interface ApiError {
  error: string;
  code?: string;
  details?: Record<string, string[]>;
}

export interface ApiSuccess<T> {
  data: T;
  message?: string;
}

// ─── Client-facing data shapes (safe to expose) ───────────────────────────────

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  level: number;
  totalXp: number;
  gold: number;
  timezone: string;
  equippedTheme: AppTheme;
  avatarFrame: string | null;
  createdAt: string;
}

export interface AttributeData {
  attribute: TaskCategory;
  xp: number;
  level: number;
  xpProgress: number;      // XP accumulated within current level
  xpNeededForNext: number; // XP needed to reach next level
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string | null;
  freezesAvailable: number;
}

export interface TaskData {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: TaskCategory;
  difficulty: TaskDifficulty;
  recurrence: TaskRecurrence;
  isArchived: boolean;
  isCompletedToday: boolean;
  lastCompletedAt: string | null;
  createdAt: string;
}

export interface CompletionResult {
  taskId: string;
  xpAwarded: number;
  goldAwarded: number;
  attributeXpAwarded: number;
  levelUps: number[]; // Array of new levels reached (sequentially played)
  newTotalXp: number;
  newLevel: number;
  xpProgress: number; // XP within current level
  xpNeededForNext: number;
  newGold: number;
  newStreak: StreakData;
  milestoneCrossed: number | null;
  milestoneBonus: number;
  newAchievements: AchievementData[];
}

export interface AchievementData {
  id: string;
  key: string;
  title: string;
  description: string;
  iconUrl: string | null;
  xpBonus: number;
  unlockedAt: string;
}

export interface AchievementCatalogItem {
  id: string;
  key: string;
  title: string;
  description: string;
  iconUrl: string | null;
  xpBonus: number;
  isGoldExclusive: boolean;
  unlocked: boolean;
  unlockedAt: string | null;
  criteria: {
    type: string;
    threshold: number;
    category?: string;
    attribute?: string;
  };
  progress: {
    current: number;
    threshold: number;
    percentage: number;
  };
}

export interface ShopItemData {
  id: string;
  name: string;
  description: string;
  type: "theme" | "avatar_frame" | "badge" | "streak_freeze";
  goldCost: number;
  itemKey: string;
  requiredLevel: number | null;
  previewImageUrl: string | null;
  owned: boolean; // Computed server-side for the current user
}

export interface HistoryEntry {
  id: string;
  taskTitle: string;
  category: TaskCategory;
  difficulty: TaskDifficulty;
  xpAwarded: number;
  goldAwarded: number;
  completedAt: string;
}

// ─── Optimistic UI types ──────────────────────────────────────────────────────

/** Sent by client to complete a task. No reward values — server computes them. */
export interface CompleteTaskRequest {
  taskId: string;
  clientRequestId: string; // UUID v4, for idempotency
}

/** Sent by client to create a task */
export interface CreateTaskRequest {
  title: string;
  description?: string;
  category: TaskCategory;
  difficulty: TaskDifficulty;
  recurrence: TaskRecurrence;
}

/** Sent by client to buy a shop item */
export interface PurchaseRequest {
  shopItemId: string;
  clientRequestId: string; // UUID v4, for idempotency
}

// ─── Dashboard summary (single GET for initial page load) ────────────────────

export interface DashboardData {
  user: UserProfile & {
    xpProgress: number;
    xpNeededForNext: number;
  };
  streak: StreakData;
  attributes: AttributeData[];
  todayTasks: TaskData[];
  recentCompletions: HistoryEntry[];
}

// ─── Leaderboard types ────────────────────────────────────────────────────────

export type LeaderboardSortOption = "xp" | "streak" | "quests";

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  level: number;
  totalXp: number;
  gold: number;
  currentStreak: number;
  longestStreak: number;
  completedTasksCount: number;
  avatarFrame: string | null;
  equippedTheme: AppTheme;
  joinedAt: string;
  isCurrentUser: boolean;
}

export interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
  currentUserRank: {
    rank: number;
    totalXp: number;
    level: number;
    totalUsers: number;
  } | null;
  sort: LeaderboardSortOption;
  lastUpdated: string;
}

