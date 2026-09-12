/**
 * Shared API utilities — response helpers, auth guard, error handling.
 * Import these in every route handler for consistent API behavior.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ZodError } from "zod";
import { ApiError } from "@/types";

// ─── Response Helpers ─────────────────────────────────────────────────────────

export function ok<T>(data: T, message?: string, status = 200) {
  return NextResponse.json({ data, ...(message && { message }) }, { status });
}

export function created<T>(data: T, message?: string) {
  return ok(data, message, 201);
}

export function badRequest(error: string, details?: Record<string, string[]>) {
  const body: ApiError = { error, code: "BAD_REQUEST", ...(details && { details }) };
  return NextResponse.json(body, { status: 400 });
}

export function unauthorized(error = "Authentication required") {
  const body: ApiError = { error, code: "UNAUTHORIZED" };
  return NextResponse.json(body, { status: 401 });
}

export function forbidden(error = "You do not have permission to do this") {
  const body: ApiError = { error, code: "FORBIDDEN" };
  return NextResponse.json(body, { status: 403 });
}

export function notFound(error = "Resource not found") {
  const body: ApiError = { error, code: "NOT_FOUND" };
  return NextResponse.json(body, { status: 404 });
}

export function conflict(error: string) {
  const body: ApiError = { error, code: "CONFLICT" };
  return NextResponse.json(body, { status: 409 });
}

export function paymentRequired(error: string) {
  const body: ApiError = { error, code: "INSUFFICIENT_GOLD" };
  return NextResponse.json(body, { status: 402 });
}

export function serverError(error = "Internal server error") {
  const body: ApiError = { error, code: "SERVER_ERROR" };
  return NextResponse.json(body, { status: 500 });
}

// ─── Auth Guard ───────────────────────────────────────────────────────────────

/**
 * Extracts the authenticated user's ID from the session.
 * Returns { userId } on success or a NextResponse error to return immediately.
 *
 * Usage:
 *   const authResult = await requireAuth();
 *   if (authResult instanceof NextResponse) return authResult;
 *   const { userId } = authResult;
 */
export async function requireAuth(
  _req?: NextRequest
): Promise<{ userId: string } | NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return unauthorized();
  }
  return { userId: session.user.id };
}

// ─── Zod Error Formatter ──────────────────────────────────────────────────────

export function formatZodError(err: ZodError): Record<string, string[]> {
  const details: Record<string, string[]> = {};
  for (const issue of err.issues) {
    const key = issue.path.join(".") || "root";
    details[key] = details[key] ?? [];
    details[key].push(issue.message);
  }
  return details;
}

// ─── UUID Validation ──────────────────────────────────────────────────────────

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUuidV4(value: string): boolean {
  return UUID_REGEX.test(value);
}

// ─── MongoDB ObjectId Validation ──────────────────────────────────────────────

const OBJECT_ID_REGEX = /^[a-f\d]{24}$/i;

export function isValidObjectId(value: string): boolean {
  return OBJECT_ID_REGEX.test(value);
}
