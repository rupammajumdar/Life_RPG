/**
 * Reward Lookup Table (SERVER-SIDE ONLY)
 *
 * Maps task difficulty → { baseXp, baseGold, attributeXp }
 * These values are FIXED on the server. The client NEVER supplies reward amounts.
 * Future rebalancing is done here and deployed — no client update required.
 *
 * Streak multipliers are applied on top of base values at completion time.
 */

import { TaskDifficulty } from "@/models/Task";

export interface RewardConfig {
  baseXp: number;
  baseGold: number;
  /** XP granted to the specific attribute linked to the task category */
  attributeXp: number;
}

/**
 * Server-authoritative reward table.
 * Difficulty → reward values (immutable at runtime).
 */
export const REWARD_TABLE: Record<TaskDifficulty, RewardConfig> = {
  Trivial: { baseXp: 10, baseGold: 2, attributeXp: 5 },
  Easy:    { baseXp: 25, baseGold: 5, attributeXp: 12 },
  Medium:  { baseXp: 50, baseGold: 10, attributeXp: 25 },
  Hard:    { baseXp: 100, baseGold: 20, attributeXp: 50 },
  Epic:    { baseXp: 200, baseGold: 40, attributeXp: 100 },
} as const;

/**
 * Streak milestone bonus XP (added on top of task XP at streak boundaries).
 * Evaluated server-side after streak update.
 */
export const STREAK_MILESTONE_BONUS: Record<number, number> = {
  7: 100,
  30: 500,
  100: 2000,
  365: 10000,
};

/**
 * Returns rewards for a given difficulty, optionally amplified by a
 * streak multiplier (e.g., 1.1 for a 7-day streak).
 */
export function getRewards(
  difficulty: TaskDifficulty,
  streakMultiplier: number = 1.0
): RewardConfig {
  const base = REWARD_TABLE[difficulty];
  return {
    baseXp: Math.round(base.baseXp * streakMultiplier),
    baseGold: Math.round(base.baseGold * streakMultiplier),
    attributeXp: Math.round(base.attributeXp * streakMultiplier),
  };
}

/**
 * Calculates the streak XP multiplier based on current streak length.
 * Max multiplier is capped at 2.0x to avoid runaway rewards.
 */
export function getStreakMultiplier(currentStreak: number): number {
  if (currentStreak >= 100) return 2.0;
  if (currentStreak >= 30) return 1.5;
  if (currentStreak >= 7) return 1.1;
  return 1.0;
}
