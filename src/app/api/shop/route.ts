/**
 * GET  /api/shop            — List all active shop items (with ownership flag)
 * POST /api/shop/purchase   — Purchase an item
 */

import { NextRequest } from "next/server";
import connectDB from "@/lib/db/mongoose";
import ShopItem from "@/models/ShopItem";
import Inventory from "@/models/Inventory";
import User from "@/models/User";
import { ok, serverError, requireAuth } from "@/lib/api-helpers";

// ─── GET /api/shop ─────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if ("status" in authResult) return authResult;
  const { userId } = authResult;

  try {
    await connectDB();

    const [items, ownedItems, user] = await Promise.all([
      ShopItem.find({ isActive: true }).sort({ goldCost: 1 }).lean(),
      Inventory.find({ userId }).select("shopItemId").lean(),
      User.findById(userId).select("level gold").lean(),
    ]);

    const ownedSet = new Set(
      ownedItems.map((i) => i.shopItemId.toString())
    );

    return ok({
      gold: (user as { gold: number } | null)?.gold ?? 0,
      userLevel: (user as { level: number } | null)?.level ?? 1,
      items: items.map((item) => ({
        id: item._id.toString(),
        name: item.name,
        description: item.description,
        type: item.type,
        goldCost: item.goldCost,
        itemKey: item.itemKey,
        requiredLevel: item.requiredLevel,
        previewImageUrl: item.previewImageUrl,
        owned: ownedSet.has(item._id.toString()),
      })),
    });
  } catch (err) {
    console.error("[GET /api/shop] error:", err);
    return serverError();
  }
}
