/**
 * GET    /api/tasks/[id]   — Get a single task
 * PATCH  /api/tasks/[id]   — Update a task
 * DELETE /api/tasks/[id]   — Archive (soft-delete) a task
 */

import { NextRequest } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db/mongoose";
import Task from "@/models/Task";
import {
  ok,
  badRequest,
  notFound,
  forbidden,
  serverError,
  requireAuth,
  formatZodError,
  isValidObjectId,
} from "@/lib/api-helpers";
import { updateTaskSchema } from "@/lib/validations";

type RouteContext = { params: Promise<{ id: string }> };

function taskToDto(t: {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  category: string;
  difficulty: string;
  recurrence: string;
  isArchived: boolean;
  lastCompletedAt?: Date | null;
  createdAt: Date;
}) {
  return {
    id: t._id.toString(),
    userId: t.userId.toString(),
    title: t.title,
    description: t.description ?? "",
    category: t.category,
    difficulty: t.difficulty,
    recurrence: t.recurrence,
    isArchived: t.isArchived,
    lastCompletedAt: t.lastCompletedAt?.toISOString() ?? null,
    createdAt: t.createdAt.toISOString(),
  };
}

// ─── GET /api/tasks/[id] ──────────────────────────────────────────────────────

export async function GET(req: NextRequest, ctx: RouteContext) {
  const authResult = await requireAuth(req);
  if ("status" in authResult) return authResult;
  const { userId } = authResult;

  const { id } = await ctx.params;
  if (!isValidObjectId(id)) return notFound();

  try {
    await connectDB();
    const task = await Task.findById(id).lean();

    if (!task) return notFound();
    if (task.userId.toString() !== userId) return forbidden();

    return ok(taskToDto(task));
  } catch (err) {
    console.error("[GET /api/tasks/[id]] error:", err);
    return serverError();
  }
}

// ─── PATCH /api/tasks/[id] ────────────────────────────────────────────────────

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  const authResult = await requireAuth(req);
  if ("status" in authResult) return authResult;
  const { userId } = authResult;

  const { id } = await ctx.params;
  if (!isValidObjectId(id)) return notFound();

  try {
    const body = await req.json();
    const parsed = updateTaskSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest("Validation failed", formatZodError(parsed.error));
    }

    await connectDB();
    const task = await Task.findById(id);

    if (!task) return notFound();
    if (task.userId.toString() !== userId) return forbidden();

    // Apply updates
    Object.assign(task, parsed.data);
    await task.save();

    return ok(taskToDto(task.toObject()));
  } catch (err) {
    console.error("[PATCH /api/tasks/[id]] error:", err);
    return serverError();
  }
}

// ─── DELETE /api/tasks/[id] — Soft archive ────────────────────────────────────

export async function DELETE(req: NextRequest, ctx: RouteContext) {
  const authResult = await requireAuth(req);
  if ("status" in authResult) return authResult;
  const { userId } = authResult;

  const { id } = await ctx.params;
  if (!isValidObjectId(id)) return notFound();

  try {
    await connectDB();
    const task = await Task.findById(id);

    if (!task) return notFound();
    if (task.userId.toString() !== userId) return forbidden();

    task.isArchived = true;
    await task.save();

    return ok({ id: task._id.toString(), isArchived: true }, "Task archived");
  } catch (err) {
    console.error("[DELETE /api/tasks/[id]] error:", err);
    return serverError();
  }
}
