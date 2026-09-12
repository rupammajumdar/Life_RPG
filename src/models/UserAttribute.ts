/**
 * UserAttribute Mongoose Model
 *
 * Tracks XP and level for each of the 5 attributes independently.
 * A document per (userId, attribute) pair — composite unique index enforces this.
 * Only updated server-side as part of the task-completion transaction.
 */

import mongoose, { Schema, Document, Model } from "mongoose";
import { TaskCategory } from "./Task";

export interface IUserAttribute extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  attribute: TaskCategory;
  xp: number;
  level: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserAttributeSchema = new Schema<IUserAttribute>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    attribute: {
      type: String,
      enum: ["Strength", "Intellect", "Discipline", "Creativity", "Social"],
      required: true,
    },
    xp: {
      type: Number,
      default: 0,
      min: 0,
    },
    level: {
      type: Number,
      default: 1,
      min: 1,
    },
  },
  {
    timestamps: true,
  }
);

// Composite unique index: one document per (user, attribute) pair
UserAttributeSchema.index({ userId: 1, attribute: 1 }, { unique: true });

const UserAttribute: Model<IUserAttribute> =
  mongoose.models.UserAttribute ??
  mongoose.model<IUserAttribute>("UserAttribute", UserAttributeSchema);

export default UserAttribute;
