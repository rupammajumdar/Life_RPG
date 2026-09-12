/**
 * GET /api/leaderboard
 *
 * Real-time Global Leaderboard Endpoint
 * Returns all user accounts ranked by Lifetime XP, Streak, or Completed Quests.
 * Protected by NextAuth authentication guard.
 */

import { NextRequest } from "next/server";
import connectDB from "@/lib/db/mongoose";
import User from "@/models/User";
import Streak from "@/models/Streak";
import TaskCompletion from "@/models/TaskCompletion";
import { ok, serverError, requireAuth } from "@/lib/api-helpers";
import { AppTheme, LeaderboardEntry, LeaderboardResponse, LeaderboardSortOption } from "@/types";

export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if ("status" in authResult) return authResult;
  const { userId } = authResult;

  const { searchParams } = new URL(req.url);
  const sortParam = (searchParams.get("sort") ?? "xp") as LeaderboardSortOption;
  const validSort: LeaderboardSortOption =
    sortParam === "streak" || sortParam === "quests" ? sortParam : "xp";

  try {
    await connectDB();

    // Parallel fetch: All users, all streaks, and total completion counts per user
    const [users, streaks, completionCounts] = await Promise.all([
      User.find({})
        .select("_id username level totalXp gold avatarFrame equippedTheme createdAt")
        .lean(),
      Streak.find({})
        .select("userId currentStreak longestStreak")
        .lean(),
      TaskCompletion.aggregate([
        {
          $group: {
            _id: "$userId",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const streakMap = new Map(
      streaks.map((s) => [s.userId.toString(), s])
    );
    const countMap = new Map(
      completionCounts.map((c) => [c._id.toString(), c.count as number])
    );

    // Map into LeaderboardEntry shapes
    const entries: LeaderboardEntry[] = users.map((u) => {
      const s = streakMap.get(u._id.toString());
      const completedTasksCount = countMap.get(u._id.toString()) ?? 0;
      const isCurrentUser = u._id.toString() === userId;

      return {
        rank: 0, // Assigned after sorting
        userId: u._id.toString(),
        username: u.username,
        level: u.level ?? 1,
        totalXp: u.totalXp ?? 0,
        gold: u.gold ?? 0,
        currentStreak: s?.currentStreak ?? 0,
        longestStreak: s?.longestStreak ?? 0,
        completedTasksCount,
        avatarFrame: u.avatarFrame ?? null,
        equippedTheme: (u.equippedTheme as AppTheme) ?? "pixel-retro",
        joinedAt: u.createdAt
          ? new Date(u.createdAt).toISOString()
          : new Date().toISOString(),
        isCurrentUser,
      };
    });

    // Sort according to selected criteria
    if (validSort === "streak") {
      entries.sort(
        (a, b) =>
          b.currentStreak - a.currentStreak ||
          b.longestStreak - a.longestStreak ||
          b.totalXp - a.totalXp ||
          b.level - a.level
      );
    } else if (validSort === "quests") {
      entries.sort(
        (a, b) =>
          b.completedTasksCount - a.completedTasksCount ||
          b.totalXp - a.totalXp ||
          b.level - a.level
      );
    } else {
      // Default: "xp" (Lifetime XP & Performance)
      entries.sort(
        (a, b) =>
          b.totalXp - a.totalXp ||
          b.level - a.level ||
          b.completedTasksCount - a.completedTasksCount
      );
    }

    // Assign 1-indexed ranks
    entries.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    // Current user rank summary
    const currentUserEntry = entries.find((e) => e.isCurrentUser);
    const currentUserRank = currentUserEntry
      ? {
          rank: currentUserEntry.rank,
          totalXp: currentUserEntry.totalXp,
          level: currentUserEntry.level,
          totalUsers: entries.length,
        }
      : null;

    const response: LeaderboardResponse = {
      leaderboard: entries,
      currentUserRank,
      sort: validSort,
      lastUpdated: new Date().toISOString(),
    };

    return ok(response);
  } catch (err) {
    console.error("GET /api/leaderboard error:", err);
    return serverError("Failed to fetch leaderboard data");
  }
}
