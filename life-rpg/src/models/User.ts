/**
 * User Mongoose Model
 *
 * Security notes:
 * - `total_xp`, `gold`, and `level` are NEVER updated directly by the client.
 *   They are only mutated by server-side game engine functions.
 * - `password_hash` is selected out (select: false) by default so it never
 *   leaks into API responses.
 */

import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  passwordHash: string;
  username: string;
  level: number;
  totalXp: number;
  gold: number;
  timezone: string;
  equippedTheme: "pixel-retro" | "cyberpunk";
  avatarFrame: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    passwordHash: {
      type: String,
      required: true,
      select: false, // Never returned in queries by default
    },
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [30, "Username must be at most 30 characters"],
    },
    // --- Game stats (server-authoritative, never client-supplied) ---
    level: {
      type: Number,
      default: 1,
      min: 1,
    },
    totalXp: {
      type: Number,
      default: 0,
      min: 0,
    },
    gold: {
      type: Number,
      default: 0,
      min: 0,
    },
    // ----------------------------------------------------------------
    timezone: {
      type: String,
      default: "UTC",
    },
    equippedTheme: {
      type: String,
      enum: ["pixel-retro", "cyberpunk"],
      default: "pixel-retro",
    },
    avatarFrame: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      // Remove sensitive fields when serializing
      transform: (_doc, ret) => {
        const record = ret as Record<string, unknown>;
        delete record.passwordHash;
        return ret;
      },
    },
  }
);

const User: Model<IUser> =
  mongoose.models.User ?? mongoose.model<IUser>("User", UserSchema);

export default User;
