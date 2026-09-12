/**
 * POST /api/tasks/[id]/complete
 *
 * ═══════════════════════════════════════════════════════════════════
 *  ANTI-CHEAT ENDPOINT — READ CAREFULLY BEFORE MODIFYING
 * ═══════════════════════════════════════════════════════════════════
 *
 * This endpoint is the ONLY way XP, Gold, and level data can change.
 * Security guarantees:
 *
 *  1. REWARD VALUES ARE NEVER CLIENT-SUPPLIED.
 *     The request body accepts ONLY { clientRequestId }.
 *     XP and Gold are computed here from the server-side REWARD_TABLE
 *     keyed on the task's difficulty — a field the client cannot forge
 *     (it's stored in MongoDB under the user's own task document, but
 *     the client can only set it at task creation time with valid enum values).
 *
 *  2. IDEMPOTENCY VIA clientRequestId.
 *     The TaskCompletion collection has a unique index on clientRequestId.
 *     If the same UUID is submitted twice (network retry, optimistic UI
 *     duplicate tap, multi-tab race), the second insert throws a duplicate
 *     key error (E11000) and returns 409 — no double award.
 *
 *  3. STREAK USES SERVER CLOCK.
 *     The "today" date is computed from new Date() on the server, converted
 *     to the user's IANA timezone stored in their profile. The client's
 *     reported time is NEVER used.
 *
 *  4. EVERYTHING IN A MONGOOSE SESSION (ACID-LIKE TRANSACTION).
 *     User XP/Gold, UserAttribute, Streak, TaskCompletion, XpLedger — all
 *     written inside a single session. If any step fails, none persist.
 *
 *  5. ACHIEVEMENT EVALUATION IS SERVER-SIDE AND IDEMPOTENT.
 *     The composite unique index on (userId, achievementId) in UserAchievement
 *     prevents double-awarding even if the evaluator runs multiple times.
 *
 * ═══════════════════════════════════════════════════════════════════
 */

import { NextRequest } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db/mongoose";
import Task from "@/models/Task";
import TaskCompletion from "@/models/TaskCompletion";
import User from "@/models/User";
import UserAttribute from "@/models/UserAttribute";
import Streak from "@/models/Streak";
import {
  AchievementDefinition,
  UserAchievement,
  XpLedger,
} from "@/models/Achievement";
import { getRewards, getStreakMultiplier, STREAK_MILESTONE_BONUS } from "@/lib/game-engine/rewards";
import { applyXp } from "@/lib/game-engine/xp";
import { computeStreakUpdate } from "@/lib/game-engine/streaks";
import {
  ok,
  conflict,
  notFound,
  forbidden,
  badRequest,
  serverError,
  requireAuth,
  formatZodError,
  isValidObjectId,
} from "@/lib/api-helpers";
import { completeTaskSchema } from "@/lib/validations";
import { CompletionResult, AchievementData } from "@/types";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: RouteContext) {
  // ── 1. Auth ─────────────────────────────────────────────────────────────────
  const authResult = await requireAuth(req);
  if ("status" in authResult) return authResult;
  const { userId } = authResult;

  // ── 2. Validate route param ─────────────────────────────────────────────────
  const { id: taskId } = await ctx.params;
  if (!isValidObjectId(taskId)) return notFound("Task not found");

  // ── 3. Validate request body (ONLY clientRequestId — no reward fields) ──────
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid JSON body");
  }

  const parsed = completeTaskSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest("Validation failed", formatZodError(parsed.error));
  }
  const { clientRequestId } = parsed.data;

  await connectDB();

  // ── 4. Check idempotency BEFORE starting transaction (fast fail) ─────────────
  const existingCompletion = await TaskCompletion.exists({ clientRequestId });
  if (existingCompletion) {
    return conflict("This action has already been processed (duplicate request ID)");
  }

  // ── 5. Load task & verify ownership ─────────────────────────────────────────
  const task = await Task.findById(taskId).lean();
  if (!task) return notFound("Task not found");
  if (task.userId.toString() !== userId) return forbidden();
  if (task.isArchived) return notFound("Task is archived");

  // ── 6. Load user ─────────────────────────────────────────────────────────────
  const user = await User.findById(userId);
  if (!user) return notFound("User not found");

  // ── 7. Load or init streak ───────────────────────────────────────────────────
  let streak = await Streak.findOne({ userId });
  if (!streak) {
    streak = await Streak.create({
      userId,
      currentStreak: 0,
      longestStreak: 0,
      lastCompletedDate: null,
      freezesAvailable: 0,
      frozenDates: [],
    });
  }

  // ── 8. Compute streak update (uses server clock + user timezone) ─────────────
  const { result: streakResult, consumedFreeze, newFrozenDates } =
    computeStreakUpdate(
      {
        currentStreak: streak.currentStreak,
        longestStreak: streak.longestStreak,
        lastCompletedDate: streak.lastCompletedDate,
        freezesAvailable: streak.freezesAvailable,
        frozenDates: streak.frozenDates,
      },
      user.timezone
    );

  // ── 9. Compute rewards (SERVER-SIDE ONLY — client supplies nothing) ───────────
  const streakMultiplier = getStreakMultiplier(streakResult.newCurrentStreak);
  const rewards = getRewards(task.difficulty, streakMultiplier);

  let totalXpToAdd = rewards.baseXp + streakResult.milestoneBonus;
  const goldToAdd = rewards.baseGold;
  const attributeXpToAdd = rewards.attributeXp;

  // ── 10. Compute XP / level-up result ─────────────────────────────────────────
  const levelResult = applyXp(user.totalXp, user.level, totalXpToAdd);

  // ── 11. Load UserAttribute for this task's category ──────────────────────────
  const userAttr = await UserAttribute.findOne({
    userId,
    attribute: task.category,
  });

  let newAttrLevel = userAttr?.level ?? 1;
  if (userAttr) {
    const attrLevelResult = applyXp(userAttr.xp, userAttr.level, attributeXpToAdd);
    newAttrLevel = attrLevelResult.newLevel;
  }

  // ── 12. Begin Mongoose session for atomic writes ──────────────────────────────
  const session = await mongoose.startSession();
  session.startTransaction();

  let newAchievements: AchievementData[] = [];

  try {
    // 12a. Write TaskCompletion (audit log entry — immutable)
    const completionDoc = await TaskCompletion.create(
      [
        {
          taskId: task._id,
          userId,
          taskSnapshot: {
            title: task.title,
            category: task.category,
            difficulty: task.difficulty,
          },
          xpAwarded: rewards.baseXp,
          goldAwarded: goldToAdd,
          attributeXpAwarded: attributeXpToAdd,
          clientRequestId,
          streakDayDate: streakResult.lastCompletedDate,
          completedAt: new Date(),
        },
      ],
      { session }
    );

    const completionId = completionDoc[0]._id;

    // 12b. Update User — XP, Gold, Level (server-computed only)
    await User.findByIdAndUpdate(
      userId,
      {
        $inc: {
          totalXp: levelResult.newTotalXp - user.totalXp, // net delta
          gold: goldToAdd,
        },
        $set: { level: levelResult.newLevel },
      },
      { session }
    );

    // 12c. Update UserAttribute
    if (userAttr) {
      const attrLevelResult = applyXp(userAttr.xp, userAttr.level, attributeXpToAdd);
      await UserAttribute.findOneAndUpdate(
        { userId, attribute: task.category },
        {
          $inc: { xp: attributeXpToAdd },
          $set: { level: attrLevelResult.newLevel },
        },
        { session }
      );
    }

    // 12d. Update Streak
    await Streak.findOneAndUpdate(
      { userId },
      {
        $set: {
          currentStreak: streakResult.newCurrentStreak,
          longestStreak: streakResult.newLongestStreak,
          lastCompletedDate: streakResult.lastCompletedDate,
          frozenDates: newFrozenDates,
        },
        ...(consumedFreeze && { $inc: { freezesAvailable: -1 } }),
      },
      { session }
    );

    // 12e. Update Task's lastCompletedAt
    await Task.findByIdAndUpdate(
      taskId,
      { $set: { lastCompletedAt: new Date() } },
      { session }
    );

    // 12f. Write XP ledger entry
    await XpLedger.create(
      [
        {
          userId,
          delta: totalXpToAdd,
          reason: "task_completion",
          referenceId: completionId,
          balanceAfter: levelResult.newTotalXp,
          createdAt: new Date(),
        },
      ],
      { session }
    );

    // 12g. Evaluate achievements (idempotent — unique index prevents duplicates)
    newAchievements = await evaluateAchievements(
      userId,
      user,
      levelResult,
      streakResult,
      task.category,
      session
    );

    // Add achievement bonus XP to ledger if any
    const achievementBonusXp = newAchievements.reduce(
      (sum, a) => sum + a.xpBonus,
      0
    );
    if (achievementBonusXp > 0) {
      totalXpToAdd += achievementBonusXp;
      await User.findByIdAndUpdate(
        userId,
        { $inc: { totalXp: achievementBonusXp } },
        { session }
      );
      await XpLedger.create(
        [
          {
            userId,
            delta: achievementBonusXp,
            reason: "achievement_bonus",
            referenceId: null,
            balanceAfter: levelResult.newTotalXp + achievementBonusXp,
            createdAt: new Date(),
          },
        ],
        { session }
      );
    }

    await session.commitTransaction();
  } catch (err: unknown) {
    await session.abortTransaction();

    // E11000 = MongoDB duplicate key — idempotency guard
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: number }).code === 11000
    ) {
      return conflict("This action has already been processed (duplicate request ID)");
    }

    console.error("[POST /api/tasks/[id]/complete] transaction error:", err);
    return serverError();
  } finally {
    await session.endSession();
  }

  // ── 13. Build and return the CompletionResult ─────────────────────────────────
  const response: CompletionResult = {
    taskId,
    xpAwarded: rewards.baseXp,
    goldAwarded: goldToAdd,
    attributeXpAwarded: attributeXpToAdd,
    levelUps: levelResult.levelUps,
    newTotalXp: levelResult.newTotalXp,
    newLevel: levelResult.newLevel,
    xpProgress: levelResult.xpProgress,
    xpNeededForNext: levelResult.xpNeededForNext,
    newGold: user.gold + goldToAdd,
    newStreak: {
      currentStreak: streakResult.newCurrentStreak,
      longestStreak: streakResult.newLongestStreak,
      lastCompletedDate: streakResult.lastCompletedDate,
      freezesAvailable:
        streak.freezesAvailable - (consumedFreeze ? 1 : 0),
    },
    milestoneCrossed: streakResult.milestoneCrossed,
    milestoneBonus: streakResult.milestoneBonus,
    newAchievements,
  };

  return ok(response, "Task completed!");
}

// ─── Achievement Evaluator ────────────────────────────────────────────────────

async function evaluateAchievements(
  userId: string,
  user: { level: number },
  levelResult: { newLevel: number },
  streakResult: { newCurrentStreak: number; milestoneCrossed: number | null },
  taskCategory: string,
  session: mongoose.ClientSession
): Promise<AchievementData[]> {
  const awarded: AchievementData[] = [];

  // Load all achievement definitions
  const definitions = await AchievementDefinition.find({}).lean();

  // Already-earned achievement IDs (to skip re-evaluation)
  const earned = await UserAchievement.find({ userId })
    .select("achievementId")
    .lean();
  const earnedIds = new Set(earned.map((e) => e.achievementId.toString()));

  for (const def of definitions) {
    if (earnedIds.has(def._id.toString())) continue; // Already earned

    let qualifies = false;

    switch (def.criteria.type) {
      case "global_level":
        qualifies = levelResult.newLevel >= def.criteria.threshold;
        break;

      case "streak_milestone":
        qualifies =
          streakResult.newCurrentStreak >= def.criteria.threshold &&
          (streakResult.milestoneCrossed === null ||
            streakResult.newCurrentStreak >= def.criteria.threshold);
        break;

      case "task_count": {
        const query: Record<string, unknown> = { userId };
        if (def.criteria.category) {
          query["taskSnapshot.category"] = def.criteria.category;
        }
        const count = await TaskCompletion.countDocuments(query).session(
          session
        );
        qualifies = count >= def.criteria.threshold;
        break;
      }

      case "attribute_level": {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const attr = await UserAttribute.findOne({
          userId,
          attribute: def.criteria.attribute,
        } as any)
          .session(session)
          .lean();
        qualifies = (attr?.level ?? 1) >= def.criteria.threshold;
        break;
      }
    }

    if (qualifies) {
      try {
        const unlocked = await UserAchievement.create(
          [
            {
              userId,
              achievementId: def._id,
              unlockedAt: new Date(),
            },
          ],
          { session }
        );

        awarded.push({
          id: unlocked[0]._id.toString(),
          key: def.key,
          title: def.title,
          description: def.description,
          iconUrl: def.iconUrl,
          xpBonus: def.xpBonus,
          unlockedAt: unlocked[0].unlockedAt.toISOString(),
        });
      } catch (err: unknown) {
        // Duplicate key = already awarded by a concurrent request — safe to ignore
        if (
          typeof err === "object" &&
          err !== null &&
          "code" in err &&
          (err as { code: number }).code === 11000
        ) {
          continue;
        }
        throw err;
      }
    }
  }

  return awarded;
}
