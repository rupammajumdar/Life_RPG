/**
 * Streak Mongoose Model
 *
 * One document per user. Streak state is computed server-side from
 * the TaskCompletion audit log — never from a client-reported date.
 * The server's clock (UTC, then converted to user's stored timezone)
 * is the authority for which calendar day a completion counts toward.
 */

import mongoose, { Schema, Document, Model } from "mongoose";

export interface IStreak extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  currentStreak: number;
  longestStreak: number;
  /** ISO date string (YYYY-MM-DD) in the user's stored timezone */
  lastCompletedDate: string | null;
  freezesAvailable: number;
  /** Dates protected by a Streak Freeze (YYYY-MM-DD), so they don't break streak */
  frozenDates: string[];
  updatedAt: Date;
}

const StreakSchema = new Schema<IStreak>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // One streak doc per user
      index: true,
    },
    currentStreak: {
      type: Number,
      default: 0,
      min: 0,
    },
    longestStreak: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastCompletedDate: {
      type: String, // Stored as YYYY-MM-DD string for timezone-safe comparison
      default: null,
    },
    freezesAvailable: {
      type: Number,
      default: 0,
      min: 0,
    },
    frozenDates: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: { createdAt: false, updatedAt: true },
  }
);

const Streak: Model<IStreak> =
  mongoose.models.Streak ?? mongoose.model<IStreak>("Streak", StreakSchema);

export default Streak;
