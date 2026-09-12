/**
 * Streak Engine (SERVER-SIDE ONLY)
 *
 * All streak calculations use the SERVER's clock converted to the user's
 * stored timezone — never a client-reported timestamp.
 * This prevents streak manipulation via device clock changes.
 *
 * A "streak day" is a calendar date in the user's timezone during which
 * at least one task was completed. Missing one full calendar day resets the
 * streak (unless a Streak Freeze is applied).
 */

import { STREAK_MILESTONE_BONUS } from "./rewards";

/**
 * Returns the current date string (YYYY-MM-DD) in the given IANA timezone,
 * computed from the server's UTC clock.
 */
export function getTodayInTimezone(timezone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/**
 * Returns yesterday's date string (YYYY-MM-DD) in the given timezone.
 */
export function getYesterdayInTimezone(timezone: string): string {
  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(yesterday);
}

export interface StreakUpdateResult {
  newCurrentStreak: number;
  newLongestStreak: number;
  lastCompletedDate: string;
  milestoneBonus: number; // XP bonus if a streak milestone was crossed
  milestoneCrossed: number | null; // e.g., 7, 30, 100, 365
  wasResetByFreeze: boolean;
}

interface CurrentStreakState {
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string | null;
  freezesAvailable: number;
  frozenDates: string[];
}

/**
 * Core streak update logic called after each task completion.
 *
 * Rules:
 * 1. If lastCompletedDate == today → same-day completion, no streak change.
 * 2. If lastCompletedDate == yesterday → streak continues (+1).
 * 3. If lastCompletedDate was 2 days ago AND a freeze is available → use it.
 * 4. Otherwise → streak resets to 1.
 */
export function computeStreakUpdate(
  state: CurrentStreakState,
  userTimezone: string
): {
  result: StreakUpdateResult;
  consumedFreeze: boolean;
  newFrozenDates: string[];
} {
  const today = getTodayInTimezone(userTimezone);
  const yesterday = getYesterdayInTimezone(userTimezone);

  let newCurrentStreak = state.currentStreak;
  let consumedFreeze = false;
  const newFrozenDates = [...state.frozenDates];
  let milestoneBonus = 0;
  let milestoneCrossed: number | null = null;
  let wasResetByFreeze = false;

  if (state.lastCompletedDate === today) {
    // Already completed today — no change to streak
    return {
      result: {
        newCurrentStreak: state.currentStreak,
        newLongestStreak: state.longestStreak,
        lastCompletedDate: state.lastCompletedDate,
        milestoneBonus: 0,
        milestoneCrossed: null,
        wasResetByFreeze: false,
      },
      consumedFreeze: false,
      newFrozenDates,
    };
  }

  if (state.lastCompletedDate === yesterday) {
    // Consecutive day — increment
    newCurrentStreak = state.currentStreak + 1;
  } else if (state.lastCompletedDate !== null) {
    // Missed at least one day
    // Check if a freeze can cover exactly one missed day
    const twoDaysAgo = getDateNDaysAgoInTimezone(2, userTimezone);
    if (
      state.lastCompletedDate === twoDaysAgo &&
      state.freezesAvailable > 0 &&
      !newFrozenDates.includes(yesterday)
    ) {
      // Use freeze: yesterday is protected, streak continues
      newFrozenDates.push(yesterday);
      consumedFreeze = true;
      wasResetByFreeze = true;
      newCurrentStreak = state.currentStreak + 1;
    } else {
      // Streak broken
      newCurrentStreak = 1;
    }
  } else {
    // First completion ever
    newCurrentStreak = 1;
  }

  // Check streak milestones
  const milestones = Object.keys(STREAK_MILESTONE_BONUS)
    .map(Number)
    .sort((a, b) => a - b);

  for (const milestone of milestones) {
    if (
      newCurrentStreak >= milestone &&
      state.currentStreak < milestone
    ) {
      milestoneBonus += STREAK_MILESTONE_BONUS[milestone];
      milestoneCrossed = milestone; // Report the highest milestone hit
    }
  }

  const newLongestStreak = Math.max(state.longestStreak, newCurrentStreak);

  return {
    result: {
      newCurrentStreak,
      newLongestStreak,
      lastCompletedDate: today,
      milestoneBonus,
      milestoneCrossed,
      wasResetByFreeze,
    },
    consumedFreeze,
    newFrozenDates,
  };
}

function getDateNDaysAgoInTimezone(n: number, timezone: string): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}
