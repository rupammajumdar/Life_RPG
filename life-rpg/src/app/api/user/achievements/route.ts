/**
 * GET /api/user/achievements
 * Returns all achievement definitions with the user's unlock status and progress.
 */

import { NextRequest } from "next/server";
import connectDB from "@/lib/db/mongoose";
import {
  AchievementDefinition,
  UserAchievement,
} from "@/models/Achievement";
import User from "@/models/User";
import Streak from "@/models/Streak";
import UserAttribute from "@/models/UserAttribute";
import TaskCompletion from "@/models/TaskCompletion";
import { ok, serverError, requireAuth } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if ("status" in authResult) return authResult;
  const { userId } = authResult;

  try {
    await connectDB();

    const [definitions, userAchievements, user, streak, attributes] =
      await Promise.all([
        AchievementDefinition.find({}).sort({ xpBonus: 1 }).lean(),
        UserAchievement.find({ userId }).lean(),
        User.findById(userId).select("level").lean(),
        Streak.findOne({ userId }).select("currentStreak longestStreak").lean(),
        UserAttribute.find({ userId }).lean(),
      ]);

    const unlockedMap = new Map<string, Date>();
    for (const ua of userAchievements) {
      unlockedMap.set(ua.achievementId.toString(), ua.unlockedAt);
    }

    // Counts cache for criteria evaluations
    const userLevel = (user as { level: number } | null)?.level ?? 1;
    const maxStreak = Math.max(
      streak?.currentStreak ?? 0,
      streak?.longestStreak ?? 0
    );

    const attrLevelMap = new Map<string, number>();
    for (const attr of attributes) {
      attrLevelMap.set(attr.attribute, attr.level);
    }

    // Total tasks cache
    const totalTasksCount = await TaskCompletion.countDocuments({ userId });

    // Category tasks cache
    const categoryCountMap = new Map<string, number>();
    const categoryCounts = await TaskCompletion.aggregate([
      { $match: { userId } },
      { $group: { _id: "$taskSnapshot.category", count: { $sum: 1 } } },
    ]);
    for (const c of categoryCounts) {
      if (c._id) categoryCountMap.set(c._id, c.count);
    }

    const items = definitions.map((def) => {
      const defId = def._id.toString();
      const isUnlocked = unlockedMap.has(defId);
      const unlockedAt = isUnlocked
        ? unlockedMap.get(defId)?.toISOString() ?? null
        : null;

      let current = 0;
      const threshold = def.criteria.threshold;

      switch (def.criteria.type) {
        case "global_level":
          current = userLevel;
          break;
        case "streak_milestone":
          current = maxStreak;
          break;
        case "task_count":
          if (def.criteria.category) {
            current = categoryCountMap.get(def.criteria.category) ?? 0;
          } else {
            current = totalTasksCount;
          }
          break;
        case "attribute_level":
          current = attrLevelMap.get(def.criteria.attribute ?? "") ?? 1;
          break;
      }

      const percentage = isUnlocked
        ? 100
        : Math.min(100, Math.round((current / threshold) * 100));

      return {
        id: defId,
        key: def.key,
        title: def.title,
        description: def.description,
        iconUrl: def.iconUrl,
        xpBonus: def.xpBonus,
        isGoldExclusive: def.isGoldExclusive,
        unlocked: isUnlocked,
        unlockedAt,
        criteria: def.criteria,
        progress: {
          current: Math.min(current, threshold),
          threshold,
          percentage,
        },
      };
    });

    return ok(items);
  } catch (err) {
    console.error("[GET /api/user/achievements] error:", err);
    return serverError();
  }
}
