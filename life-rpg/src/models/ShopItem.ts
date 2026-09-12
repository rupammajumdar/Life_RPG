/**
 * ShopItem Mongoose Model — Catalog (admin-defined, not user-created)
 *
 * These documents define what is available to purchase.
 * Gold costs and item metadata are stored server-side only.
 */

import mongoose, { Schema, Document, Model } from "mongoose";

export type ShopItemType =
  | "theme"
  | "avatar_frame"
  | "badge"
  | "streak_freeze";

export interface IShopItem extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  description: string;
  type: ShopItemType;
  goldCost: number;
  /** For themes: 'cyberpunk' | 'pixel-retro'. For others: a key string. */
  itemKey: string;
  /** If set, requires user to be this level to purchase */
  requiredLevel: number | null;
  /** Is this item currently for sale? */
  isActive: boolean;
  previewImageUrl: string | null;
  createdAt: Date;
}

const ShopItemSchema = new Schema<IShopItem>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    type: {
      type: String,
      enum: ["theme", "avatar_frame", "badge", "streak_freeze"],
      required: true,
      index: true,
    },
    goldCost: {
      type: Number,
      required: true,
      min: 0,
    },
    itemKey: {
      type: String,
      required: true,
      unique: true,
    },
    requiredLevel: {
      type: Number,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    previewImageUrl: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

const ShopItem: Model<IShopItem> =
  mongoose.models.ShopItem ??
  mongoose.model<IShopItem>("ShopItem", ShopItemSchema);

export default ShopItem;
