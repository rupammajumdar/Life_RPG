/**
 * Achievement Mongoose Model
 *
 * Two collections:
 *   - AchievementDefinition: static catalog of all possible achievements
 *   - UserAchievement: records when a user unlocked an achievement
 *
 * Achievements are evaluated server-side after every task completion.
 * The unique index on (userId, achievementId) ensures idempotent awarding —
 * the same achievement cannot be granted twice even if the evaluation runs
 * multiple times (e.g., due to retry).
 */

import mongoose, { Schema, Document, Model } from "mongoose";

// ---------- Achievement Definition (catalog) ----------
export interface IAchievementDefinition extends Document {
  _id: mongoose.Types.ObjectId;
  key: string; // e.g., "COMPLETE_50_FITNESS"
  title: string;
  description: string;
  iconUrl: string | null;
  xpBonus: number; // Bonus XP awarded when unlocked
  /** Evaluation criteria stored as structured data for the engine */
  criteria: {
    type:
      | "task_count"
      | "attribute_level"
      | "global_level"
      | "streak_milestone";
    category?: string; // For task_count
    attribute?: string; // For attribute_level
    threshold: number;
  };
  isGoldExclusive: boolean;
}

const AchievementDefinitionSchema = new Schema<IAchievementDefinition>({
  key: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  iconUrl: { type: String, default: null },
  xpBonus: { type: Number, default: 0, min: 0 },
  criteria: {
    type: {
      type: String,
      enum: [
        "task_count",
        "attribute_level",
        "global_level",
        "streak_milestone",
      ],
      required: true,
    },
    category: { type: String },
    attribute: { type: String },
    threshold: { type: Number, required: true },
  },
  isGoldExclusive: { type: Boolean, default: false },
});

// ---------- User Achievement (ownership records) ----------
export interface IUserAchievement extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  achievementId: mongoose.Types.ObjectId;
  unlockedAt: Date;
}

const UserAchievementSchema = new Schema<IUserAchievement>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  achievementId: {
    type: Schema.Types.ObjectId,
    ref: "AchievementDefinition",
    required: true,
  },
  unlockedAt: {
    type: Date,
    default: () => new Date(),
  },
});

// Idempotency: prevents double-awarding the same achievement
UserAchievementSchema.index(
  { userId: 1, achievementId: 1 },
  { unique: true }
);

// ---------- XP Ledger (full audit trail of all XP events) ----------
export interface IXpLedger extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  delta: number; // Positive = earned, negative = future debits (not in v1)
  reason: "task_completion" | "streak_bonus" | "achievement_bonus" | "admin";
  referenceId: mongoose.Types.ObjectId | null; // TaskCompletion or Achievement ID
  balanceAfter: number; // Snapshot of totalXp after this event
  createdAt: Date;
}

const XpLedgerSchema = new Schema<IXpLedger>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  delta: { type: Number, required: true },
  reason: {
    type: String,
    enum: [
      "task_completion",
      "streak_bonus",
      "achievement_bonus",
      "admin",
    ],
    required: true,
  },
  referenceId: { type: Schema.Types.ObjectId, default: null },
  balanceAfter: { type: Number, required: true },
  createdAt: { type: Date, default: () => new Date() },
});

XpLedgerSchema.index({ userId: 1, createdAt: -1 });

// ---------- Model exports ----------
export const AchievementDefinition: Model<IAchievementDefinition> =
  mongoose.models.AchievementDefinition ??
  mongoose.model<IAchievementDefinition>(
    "AchievementDefinition",
    AchievementDefinitionSchema
  );

export const UserAchievement: Model<IUserAchievement> =
  mongoose.models.UserAchievement ??
  mongoose.model<IUserAchievement>("UserAchievement", UserAchievementSchema);

export const XpLedger: Model<IXpLedger> =
  mongoose.models.XpLedger ??
  mongoose.model<IXpLedger>("XpLedger", XpLedgerSchema);
