/**
 * GET  /api/tasks        — List authenticated user's active tasks
 * POST /api/tasks        — Create a new task
 */

import { NextRequest } from "next/server";
import connectDB from "@/lib/db/mongoose";
import Task from "@/models/Task";
import TaskCompletion from "@/models/TaskCompletion";
import {
  ok,
  created,
  badRequest,
  serverError,
  requireAuth,
  formatZodError,
} from "@/lib/api-helpers";
import { createTaskSchema } from "@/lib/validations";
import { getTodayInTimezone } from "@/lib/game-engine/streaks";
import User from "@/models/User";

// ─── GET /api/tasks ───────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if ("status" in authResult) return authResult;
  const { userId } = authResult;

  try {
    await connectDB();

    // Get user timezone for "completed today" calculation
    const user = await User.findById(userId).select("timezone").lean();
    const timezone = (user as { timezone: string } | null)?.timezone ?? "UTC";
    const today = getTodayInTimezone(timezone);

    // Fetch all non-archived tasks
    const tasks = await Task.find({
      userId,
      isArchived: false,
    })
      .sort({ createdAt: -1 })
      .lean();

    // Determine which tasks were completed today using the audit log
    const taskIds = tasks.map((t) => t._id);
    const completedTodayDocs = await TaskCompletion.find({
      userId,
      taskId: { $in: taskIds },
      streakDayDate: today,
    })
      .select("taskId")
      .lean();

    const completedTodaySet = new Set(
      completedTodayDocs.map((d) => d.taskId.toString())
    );

    const result = tasks.map((t) => ({
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
    }));

    return ok(result);
  } catch (err) {
    console.error("[GET /api/tasks] error:", err);
    return serverError();
  }
}

// ─── POST /api/tasks ──────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const authResult = await requireAuth(req);
  if ("status" in authResult) return authResult;
  const { userId } = authResult;

  try {
    const body = await req.json();
    const parsed = createTaskSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest("Validation failed", formatZodError(parsed.error));
    }

    const { title, description, category, difficulty, recurrence } =
      parsed.data;

    await connectDB();

    const task = await Task.create({
      userId,
      title,
      description,
      category,
      difficulty,
      recurrence,
      isArchived: false,
    });

    return created({
      id: task._id.toString(),
      userId: task.userId.toString(),
      title: task.title,
      description: task.description,
      category: task.category,
      difficulty: task.difficulty,
      recurrence: task.recurrence,
      isArchived: task.isArchived,
      isCompletedToday: false,
      lastCompletedAt: null,
      createdAt: task.createdAt.toISOString(),
    });
  } catch (err) {
    console.error("[POST /api/tasks] error:", err);
    return serverError();
  }
}
