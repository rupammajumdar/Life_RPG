/**
 * Task Mongoose Model
 *
 * A task belongs to a user and is tagged with a category (which feeds into
 * an Attribute) and a difficulty tier (which determines XP/Gold rewards
 * server-side — the client never supplies reward amounts).
 */

import mongoose, { Schema, Document, Model } from "mongoose";

export type TaskCategory =
  | "Strength"
  | "Intellect"
  | "Discipline"
  | "Creativity"
  | "Social";

export type TaskDifficulty = "Trivial" | "Easy" | "Medium" | "Hard" | "Epic";

export type TaskRecurrence = "One-Off" | "Daily" | "Weekly";

export interface ITask extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  category: TaskCategory;
  difficulty: TaskDifficulty;
  recurrence: TaskRecurrence;
  isArchived: boolean;
  isCompletedToday: boolean; // Denormalized flag, reset by a daily cron / checked server-side
  lastCompletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true,
      minlength: [1, "Title cannot be empty"],
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
      default: "",
    },
    category: {
      type: String,
      enum: ["Strength", "Intellect", "Discipline", "Creativity", "Social"],
      required: [true, "Category is required"],
    },
    difficulty: {
      type: String,
      enum: ["Trivial", "Easy", "Medium", "Hard", "Epic"],
      required: [true, "Difficulty is required"],
    },
    recurrence: {
      type: String,
      enum: ["One-Off", "Daily", "Weekly"],
      default: "One-Off",
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    isCompletedToday: {
      type: Boolean,
      default: false,
    },
    lastCompletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index: fetch all active tasks for a user efficiently
TaskSchema.index({ userId: 1, isArchived: 1, createdAt: -1 });

const Task: Model<ITask> =
  mongoose.models.Task ?? mongoose.model<ITask>("Task", TaskSchema);

export default Task;
