/**
 * POST /api/auth/register
 *
 * Creates a new user account. All fields validated with Zod server-side.
 * Password is hashed with bcrypt (cost 12) — never stored plaintext.
 * Also creates the user's Streak document and initializes all 5 UserAttributes.
 */

import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/db/mongoose";
import User from "@/models/User";
import Streak from "@/models/Streak";
import UserAttribute from "@/models/UserAttribute";
import { registerSchema } from "@/lib/validations";
import {
  created,
  badRequest,
  conflict,
  serverError,
  formatZodError,
} from "@/lib/api-helpers";
import { TaskCategory } from "@/types";

const ATTRIBUTES: TaskCategory[] = [
  "Strength",
  "Intellect",
  "Discipline",
  "Creativity",
  "Social",
];

export async function POST(req: NextRequest) {
  try {
    // 1. Parse & validate body
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest("Validation failed", formatZodError(parsed.error));
    }

    const { email, password, username, timezone } = parsed.data;

    await connectDB();

    // 2. Check for existing email / username
    const existing = await User.findOne({
      $or: [{ email }, { username }],
    }).lean();

    if (existing) {
      const field =
        (existing as { email: string; username: string }).email === email
          ? "email"
          : "username";
      return conflict(
        `An account with this ${field} already exists`
      );
    }

    // 3. Hash password (cost factor 12 — good security/performance balance)
    const passwordHash = await bcrypt.hash(password, 12);

    // 4. Create user
    const user = await User.create({
      email,
      passwordHash,
      username,
      timezone,
      level: 1,
      totalXp: 0,
      gold: 0,
    });

    // 5. Initialize Streak document
    await Streak.create({
      userId: user._id,
      currentStreak: 0,
      longestStreak: 0,
      lastCompletedDate: null,
      freezesAvailable: 0,
      frozenDates: [],
    });

    // 6. Initialize all 5 UserAttribute documents (level 1, 0 XP)
    await UserAttribute.insertMany(
      ATTRIBUTES.map((attr) => ({
        userId: user._id,
        attribute: attr,
        xp: 0,
        level: 1,
      }))
    );

    // 7. Return safe user object (no passwordHash)
    return created(
      {
        id: user._id.toString(),
        email: user.email,
        username: user.username,
        level: user.level,
        totalXp: user.totalXp,
        gold: user.gold,
        timezone: user.timezone,
        equippedTheme: user.equippedTheme,
        createdAt: user.createdAt,
      },
      "Account created successfully"
    );
  } catch (err) {
    console.error("[register] error:", err);
    return serverError();
  }
}
