/**
 * Inventory Mongoose Model — User Ownership of Shop Items
 *
 * Records what a user has purchased.
 * Purchases are only created server-side after:
 *  1. The user's Gold balance is verified (inside a session/transaction).
 *  2. The Gold is atomically debited from the User document.
 *  3. This inventory record is inserted.
 *
 * The composite unique index (userId, shopItemId) prevents double-buying
 * non-consumable items (themes, frames, badges). Consumables (streak_freeze)
 * instead increment a counter on the Streak document.
 */

import mongoose, { Schema, Document, Model } from "mongoose";

export interface IInventory extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  shopItemId: mongoose.Types.ObjectId;
  purchasedAt: Date;
  goldPaid: number; // Recorded at purchase time, immutable
}

const InventorySchema = new Schema<IInventory>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    shopItemId: {
      type: Schema.Types.ObjectId,
      ref: "ShopItem",
      required: true,
    },
    purchasedAt: {
      type: Date,
      default: () => new Date(),
    },
    goldPaid: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    versionKey: false,
  }
);

// Prevent duplicate non-consumable purchases
InventorySchema.index({ userId: 1, shopItemId: 1 }, { unique: true });

const Inventory: Model<IInventory> =
  mongoose.models.Inventory ??
  mongoose.model<IInventory>("Inventory", InventorySchema);

export default Inventory;
