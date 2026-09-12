/**
 * GET /api/user/dashboard
 *
 * Returns all data needed for the main dashboard in a single request:
 * - User profile (level, XP, gold, theme)
 * - Streak data
 * - All 5 attribute levels
 * - Today's tasks (with isCompletedToday flag)
 * - Recent 10 completions (for the activity feed)
 *
 * This single endpoint minimizes round-trips on initial page load.
 */

import { NextRequest } from "next/server";
import connectDB from "@/lib/db/mongoose";
import User from "@/models/User";
import Streak from "@/models/Streak";
import UserAttribute from "@/models/UserAttribute";
import Task from "@/models/Task";
import TaskCompletion from "@/models/TaskCompletion";
import { ok, notFound, serverError, requireAuth } from "@/lib/api-helpers";
import { getTodayInTimezone } from "@/lib/game-engine/streaks";
import { xpWithinCurrentLevel, xpRequiredForLevel } from "@/lib/game-engine/xp";
import { DashboardData } from "@/types";

export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if ("status" in authResult) return authResult;
  const { userId } = authResult;

  try {
    await connectDB();

    // Parallel fetch for performance
    const [user, streak, attributes, tasks] = await Promise.all([
      User.findById(userId).lean(),
      Streak.findOne({ userId }).lean(),
      UserAttribute.find({ userId }).sort({ attribute: 1 }).lean(),
      Task.find({ userId, isArchived: false }).sort({ createdAt: -1 }).lean(),
    ]);

    if (!user) return notFound("User not found");

    const timezone = user.timezone ?? "UTC";
    const today = getTodayInTimezone(timezone);

    // Get "completed today" set
    const taskIds = tasks.map((t) => t._id);
    const completedToday = await TaskCompletion.find({
      userId,
      taskId: { $in: taskIds },
      streakDayDate: today,
    })
      .select("taskId")
      .lean();

    const completedTodaySet = new Set(
      completedToday.map((d) => d.taskId.toString())
    );

    // Recent 10 completions for activity feed
    const recentCompletions = await TaskCompletion.find({ userId })
      .sort({ completedAt: -1 })
      .limit(10)
      .lean();

    const dashboard: DashboardData = {
      user: {
        id: user._id.toString(),
        email: user.email,
        username: user.username,
        level: user.level,
        totalXp: user.totalXp,
        gold: user.gold,
        timezone: user.timezone,
        equippedTheme: user.equippedTheme,
        avatarFrame: user.avatarFrame,
        createdAt: user.createdAt.toISOString(),
        xpProgress: xpWithinCurrentLevel(user.totalXp, user.level),
        xpNeededForNext: xpRequiredForLevel(user.level),
      },
      streak: streak
        ? {
            currentStreak: streak.currentStreak,
            longestStreak: streak.longestStreak,
            lastCompletedDate: streak.lastCompletedDate,
            freezesAvailable: streak.freezesAvailable,
          }
        : {
            currentStreak: 0,
            longestStreak: 0,
            lastCompletedDate: null,
            freezesAvailable: 0,
          },
      attributes: attributes.map((a) => ({
        attribute: a.attribute,
        xp: a.xp,
        level: a.level,
        xpProgress: xpWithinCurrentLevel(a.xp, a.level),
        xpNeededForNext: xpRequiredForLevel(a.level),
      })),
      todayTasks: tasks.map((t) => ({
        id: t._id.toString(),
        userId: t.userId.toString(),
        title: t.title,
        description: t.description ?? "",
        category: t.category,
        difficulty: t.difficulty,
        recurrence: t.recurrence,
        isArchived: t.isArchived,
        isCompletedToday: completedTodaySet.has(t._id.toString()),
        lastCompletedAt: t.lastCompletedAt?.toISOString() ?? null,
        createdAt: t.createdAt.toISOString(),
      })),
      recentCompletions: recentCompletions.map((c) => ({
        id: c._id.toString(),
        taskTitle: c.taskSnapshot.title,
        category: c.taskSnapshot.category as DashboardData["recentCompletions"][0]["category"],
        difficulty: c.taskSnapshot.difficulty as DashboardData["recentCompletions"][0]["difficulty"],
        xpAwarded: c.xpAwarded,
        goldAwarded: c.goldAwarded,
        completedAt: c.completedAt.toISOString(),
      })),
    };

    return ok(dashboard);
  } catch (err) {
    console.error("[GET /api/user/dashboard] error:", err);
    return serverError();
  }
}
