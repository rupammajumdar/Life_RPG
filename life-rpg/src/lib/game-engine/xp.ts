/**
 * XP & Leveling Engine (SERVER-SIDE ONLY)
 *
 * Implements the non-linear XP curve from the PRD:
 *   XP_required(level) = floor(BASE_XP * (GROWTH_RATE ^ (level - 1)))
 *   BASE_XP = 100, GROWTH_RATE = 1.15
 *
 * All level-up resolution happens here. The client NEVER sends XP amounts.
 * These constants are versioned here; future rebalancing is a server deploy,
 * not a client update.
 */

// ─── Constants (versioned, server-side only) ─────────────────────────────────
const BASE_XP = 100;
const GROWTH_RATE = 1.15;
const MAX_LEVEL = 100; // Soft cap to prevent integer overflow in XP display

/**
 * XP required to advance FROM the given level to the next.
 * level 1 → 2: 100 XP
 * level 5 → 6: ~174 XP
 * level 10 → 11: ~350 XP
 * level 20 → 21: ~1,636 XP
 */
export function xpRequiredForLevel(level: number): number {
  if (level >= MAX_LEVEL) return Infinity;
  return Math.floor(BASE_XP * Math.pow(GROWTH_RATE, level - 1));
}

/**
 * Total cumulative XP needed to reach a given level from level 1.
 * Useful for rendering an XP progress bar.
 */
export function totalXpForLevel(level: number): number {
  let total = 0;
  for (let l = 1; l < level; l++) {
    total += xpRequiredForLevel(l);
  }
  return total;
}

/**
 * XP remaining within the current level (for the progress bar).
 */
export function xpWithinCurrentLevel(totalXp: number, currentLevel: number): number {
  const xpAtCurrentLevel = totalXpForLevel(currentLevel);
  return totalXp - xpAtCurrentLevel;
}

/**
 * Derives the correct level from a totalXp value.
 * The server uses this to detect level-ups and validate the cached `level` field.
 */
export function levelFromTotalXp(totalXp: number): number {
  let level = 1;
  let xpAccumulated = 0;

  while (level < MAX_LEVEL) {
    const needed = xpRequiredForLevel(level);
    if (xpAccumulated + needed > totalXp) break;
    xpAccumulated += needed;
    level++;
  }

  return level;
}

/**
 * Core function used by the task-completion endpoint.
 *
 * Given current totalXp and the XP to add, returns:
 *  - newTotalXp: updated XP balance
 *  - newLevel: updated level (may have jumped multiple levels)
 *  - levelUps: array of levels crossed (e.g. [5, 6] if user went from 4→6)
 *    — the client plays level-up animations sequentially for each entry.
 *  - xpProgress: XP within the new current level (for the progress bar)
 *  - xpNeededForNext: XP required to reach the next level from the new level
 */
export interface LevelUpResult {
  newTotalXp: number;
  newLevel: number;
  levelUps: number[]; // Levels crossed, in order
  xpProgress: number; // XP accumulated within the new current level
  xpNeededForNext: number; // XP to reach next level
}

export function applyXp(
  currentTotalXp: number,
  currentLevel: number,
  xpToAdd: number
): LevelUpResult {
  const newTotalXp = currentTotalXp + xpToAdd;
  const newLevel = levelFromTotalXp(newTotalXp);

  // Collect every level crossed (supports multi-level jumps from big XP grants)
  const levelUps: number[] = [];
  for (let l = currentLevel + 1; l <= newLevel; l++) {
    levelUps.push(l);
  }

  const xpProgress = xpWithinCurrentLevel(newTotalXp, newLevel);
  const xpNeededForNext = xpRequiredForLevel(newLevel);

  return {
    newTotalXp,
    newLevel,
    levelUps,
    xpProgress,
    xpNeededForNext,
  };
}

/**
 * Returns a formatted summary of the XP curve for the first N levels.
 * Useful for admin/debug endpoints.
 */
export function getXpCurveTable(levels: number = 20) {
  return Array.from({ length: levels }, (_, i) => {
    const level = i + 1;
    return {
      level,
      xpToNext: xpRequiredForLevel(level),
      totalXpRequired: totalXpForLevel(level),
    };
  });
}
