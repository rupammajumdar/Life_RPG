/**
 * POST /api/shop/purchase
 *
 * Purchases a shop item. Gold deduction and inventory insertion happen
 * inside a single Mongoose transaction to prevent race conditions
 * (e.g., double-spending via rapid duplicate requests).
 *
 * The server re-checks the Gold balance INSIDE the transaction —
 * the optimistic UI's predicted balance is treated as untrusted.
 */

import { NextRequest } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db/mongoose";
import ShopItem from "@/models/ShopItem";
import Inventory from "@/models/Inventory";
import User from "@/models/User";
import Streak from "@/models/Streak";
import {
  ok,
  badRequest,
  notFound,
  conflict,
  paymentRequired,
  serverError,
  requireAuth,
  formatZodError,
  isValidObjectId,
} from "@/lib/api-helpers";
import { purchaseSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  const authResult = await requireAuth(req);
  if ("status" in authResult) return authResult;
  const { userId } = authResult;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid JSON body");
  }

  // Expect { shopItemId, clientRequestId } in the body
  const bodyWithItem = body as { shopItemId?: string } & typeof body;
  const shopItemId = (bodyWithItem as Record<string, string>).shopItemId;

  if (!shopItemId || !isValidObjectId(shopItemId)) {
    return badRequest("shopItemId must be a valid MongoDB ObjectId");
  }

  const parsed = purchaseSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest("Validation failed", formatZodError(parsed.error));
  }

  await connectDB();

  // 1. Load item
  const item = await ShopItem.findById(shopItemId).lean();
  if (!item || !item.isActive) return notFound("Shop item not found");

  // 2. Load user
  const user = await User.findById(userId).lean();
  if (!user) return notFound("User not found");

  // 3. Level gate check
  if (item.requiredLevel && user.level < item.requiredLevel) {
    return badRequest(
      `This item requires level ${item.requiredLevel}. You are level ${user.level}.`
    );
  }

  // 4. Check Gold (optimistic — will be re-checked in transaction)
  if (user.gold < item.goldCost) {
    return paymentRequired(
      `Insufficient Gold. You have ${user.gold}G but this item costs ${item.goldCost}G.`
    );
  }

  // 5. Transaction: debit Gold + create inventory record
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Re-check Gold INSIDE transaction (prevents double-spend race condition)
    const freshUser = await User.findById(userId).session(session);
    if (!freshUser) throw new Error("User not found in transaction");

    if (freshUser.gold < item.goldCost) {
      await session.abortTransaction();
      return paymentRequired(
        `Insufficient Gold. You have ${freshUser.gold}G but this item costs ${item.goldCost}G.`
      );
    }

    // For consumables (streak_freeze), increment instead of ownership record
    if (item.type === "streak_freeze") {
      await Streak.findOneAndUpdate(
        { userId },
        { $inc: { freezesAvailable: 1 } },
        { session }
      );
    } else {
      // Non-consumable: create ownership record (unique index prevents duplicate buy)
      try {
        await Inventory.create(
          [
            {
              userId,
              shopItemId: item._id,
              purchasedAt: new Date(),
              goldPaid: item.goldCost,
            },
          ],
          { session }
        );
      } catch (err: unknown) {
        if (
          typeof err === "object" &&
          err !== null &&
          "code" in err &&
          (err as { code: number }).code === 11000
        ) {
          await session.abortTransaction();
          return conflict("You already own this item");
        }
        throw err;
      }
    }

    // Debit Gold
    await User.findByIdAndUpdate(
      userId,
      { $inc: { gold: -item.goldCost } },
      { session }
    );

    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();
    console.error("[POST /api/shop/purchase] transaction error:", err);
    return serverError();
  } finally {
    await session.endSession();
  }

  return ok(
    {
      itemId: item._id.toString(),
      itemName: item.name,
      goldSpent: item.goldCost,
      newGold: user.gold - item.goldCost,
    },
    `Successfully purchased "${item.name}"!`
  );
}
