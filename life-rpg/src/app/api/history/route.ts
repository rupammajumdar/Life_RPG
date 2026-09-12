/**
 * GET  /api/history         — Paginated completion history (read-only audit log)
 * The history is sourced directly from the immutable TaskCompletion collection.
 * It cannot be edited, rewritten, or deleted.
 */

import { NextRequest } from "next/server";
import connectDB from "@/lib/db/mongoose";
import TaskCompletion from "@/models/TaskCompletion";
import { ok, serverError, requireAuth } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if ("status" in authResult) return authResult;
  const { userId } = authResult;

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20", 10));
  const skip = (page - 1) * limit;

  try {
    await connectDB();

    const [completions, total] = await Promise.all([
      TaskCompletion.find({ userId })
        .sort({ completedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      TaskCompletion.countDocuments({ userId }),
    ]);

    return ok({
      items: completions.map((c) => ({
        id: c._id.toString(),
        taskTitle: c.taskSnapshot.title,
        category: c.taskSnapshot.category,
        difficulty: c.taskSnapshot.difficulty,
        xpAwarded: c.xpAwarded,
        goldAwarded: c.goldAwarded,
        completedAt: c.completedAt.toISOString(),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + limit < total,
      },
    });
  } catch (err) {
    console.error("[GET /api/history] error:", err);
    return serverError();
  }
}
