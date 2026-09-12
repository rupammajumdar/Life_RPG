/**
 * GET  /api/user/profile   — Get current user's profile
 * PATCH /api/user/profile  — Update timezone or equipped theme/avatar
 *
 * Importantly: level, totalXp, and gold are NOT patchable here.
 * Those are only mutated by the game engine.
 */

import { NextRequest } from "next/server";
import connectDB from "@/lib/db/mongoose";
import User from "@/models/User";
import ShopItem from "@/models/ShopItem";
import Inventory from "@/models/Inventory";
import {
  ok,
  badRequest,
  notFound,
  serverError,
  requireAuth,
} from "@/lib/api-helpers";
import { z } from "zod";

const updateProfileSchema = z.object({
  timezone: z
    .string()
    .refine((tz) => {
      try {
        Intl.DateTimeFormat(undefined, { timeZone: tz });
        return true;
      } catch {
        return false;
      }
    }, "Invalid IANA timezone")
    .optional(),
  equippedTheme: z.enum(["pixel-retro", "cyberpunk"]).optional(),
  avatarFrame: z.string().nullable().optional(),
});

export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if ("status" in authResult) return authResult;
  const { userId } = authResult;

  try {
    await connectDB();
    const user = await User.findById(userId).lean();
    if (!user) return notFound("User not found");

    return ok({
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
    });
  } catch (err) {
    console.error("[GET /api/user/profile] error:", err);
    return serverError();
  }
}

export async function PATCH(req: NextRequest) {
  const authResult = await requireAuth(req);
  if ("status" in authResult) return authResult;
  const { userId } = authResult;

  try {
    const body = await req.json();
    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Validation failed");
    }

    const { timezone, equippedTheme, avatarFrame } = parsed.data;

    // If switching theme, verify ownership in inventory
    if (equippedTheme && equippedTheme !== "pixel-retro") {
      await connectDB();
      const shopItem = await ShopItem.findOne({
        itemKey: `theme_${equippedTheme}`,
      }).lean();

      if (shopItem) {
        const owned = await Inventory.exists({
          userId,
          shopItemId: shopItem._id,
        });
        if (!owned) {
          return badRequest("You do not own this theme. Purchase it from the shop first.");
        }
      }
    }

    await connectDB();
    const updates: Record<string, unknown> = {};
    if (timezone !== undefined) updates.timezone = timezone;
    if (equippedTheme !== undefined) updates.equippedTheme = equippedTheme;
    if (avatarFrame !== undefined) updates.avatarFrame = avatarFrame;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true }
    ).lean();

    if (!user) return notFound("User not found");

    return ok({
      id: user._id.toString(),
      email: user.email,
      username: user.username,
      level: user.level,
      totalXp: user.totalXp,
      gold: user.gold,
      timezone: user.timezone,
      equippedTheme: user.equippedTheme,
      avatarFrame: user.avatarFrame,
    });
  } catch (err) {
    console.error("[PATCH /api/user/profile] error:", err);
    return serverError();
  }
}
