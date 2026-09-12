"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUpdateTask } from "@/hooks/useTasks";
import { TaskCategory, TaskDifficulty, TaskRecurrence, TaskData } from "@/types";

interface EditTaskModalProps {
  open: boolean;
  task: TaskData | null;
  onClose: () => void;
}

const CATEGORIES: TaskCategory[] = [
  "Strength", "Intellect", "Discipline", "Creativity", "Social",
];
const DIFFICULTIES: TaskDifficulty[] = [
  "Trivial", "Easy", "Medium", "Hard", "Epic",
];
const RECURRENCES: TaskRecurrence[] = ["One-Off", "Daily", "Weekly"];

const XP_PREVIEW: Record<TaskDifficulty, number> = {
  Trivial: 10, Easy: 25, Medium: 50, Hard: 100, Epic: 200,
};

const CATEGORY_ICONS: Record<TaskCategory, string> = {
  Strength: "💪", Intellect: "🧠", Discipline: "⚡", Creativity: "🎨", Social: "🤝",
};

export function EditTaskModal({ open, task, onClose }: EditTaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<TaskCategory>("Intellect");
  const [difficulty, setDifficulty] = useState<TaskDifficulty>("Medium");
  const [recurrence, setRecurrence] = useState<TaskRecurrence>("One-Off");

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description ?? "");
      setCategory(task.category);
      setDifficulty(task.difficulty);
      setRecurrence(task.recurrence);
    }
  }, [task]);

  const { mutate: update, isPending } = useUpdateTask();

  if (!task) return null;

  const trimmedTitle = title.trim();
  const canSubmit = trimmedTitle.length > 0 && trimmedTitle.length <= 200 && !isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    update(
      {
        id: task.id,
        title: trimmedTitle,
        description,
        category,
        difficulty,
        recurrence,
      },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            background: "#000000cc",
            zIndex: 1000,
            backdropFilter: "blur(2px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            overflowY: "auto",
          }}
        >
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "relative",
              width: "min(540px, 92vw)",
              maxHeight: "90vh",
              overflowY: "auto",
              background: "var(--color-surface)",
              border: "2px solid var(--color-primary)",
              boxShadow: "6px 6px 0px var(--color-primary), 0 0 40px var(--color-primary)44",
              padding: "2rem",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "11px",
                  color: "var(--color-primary-light)",
                  letterSpacing: "0.1em",
                }}
              >
                ✏️ EDIT QUEST
              </h2>
              <button
                onClick={onClose}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--color-text-muted)",
                  cursor: "pointer",
                  fontSize: "18px",
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Title */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontFamily: "var(--font-display)",
                    fontSize: "8px",
                    color: "var(--color-text-muted)",
                    marginBottom: "6px",
                    letterSpacing: "0.08em",
                  }}
                >
                  QUEST TITLE *
                </label>
                <input
                  className="pixel-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Read 20 pages..."
                  maxLength={200}
                  autoFocus
                />
                {title.length > 0 && trimmedTitle.length === 0 && (
                  <p style={{ color: "#f87171", fontSize: "11px", marginTop: "4px" }}>
                    Title cannot be empty or whitespace
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontFamily: "var(--font-display)",
                    fontSize: "8px",
                    color: "var(--color-text-muted)",
                    marginBottom: "6px",
                    letterSpacing: "0.08em",
                  }}
                >
                  DESCRIPTION (OPTIONAL)
                </label>
                <textarea
                  className="pixel-input"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add notes or criteria..."
                  rows={2}
                  maxLength={500}
                  style={{ resize: "vertical" }}
                />
              </div>

              {/* Category */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontFamily: "var(--font-display)",
                    fontSize: "8px",
                    color: "var(--color-text-muted)",
                    marginBottom: "6px",
                    letterSpacing: "0.08em",
                  }}
                >
                  ATTRIBUTE CATEGORY
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px" }}>
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      style={{
                        padding: "8px 6px",
                        background: category === cat ? "var(--color-primary)" : "var(--color-bg-alt)",
                        border: `1px solid ${category === cat ? "var(--color-primary-light)" : "var(--color-border)"}`,
                        color: category === cat ? "white" : "var(--color-text-muted)",
                        fontFamily: "var(--font-display)",
                        fontSize: "7px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "4px",
                      }}
                    >
                      <span>{CATEGORY_ICONS[cat]}</span>
                      <span>{cat.toUpperCase()}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty & Recurrence */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontFamily: "var(--font-display)",
                      fontSize: "8px",
                      color: "var(--color-text-muted)",
                      marginBottom: "6px",
                      letterSpacing: "0.08em",
                    }}
                  >
                    DIFFICULTY TIER
                  </label>
                  <select
                    className="pixel-input"
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as TaskDifficulty)}
                    style={{ cursor: "pointer" }}
                  >
                    {DIFFICULTIES.map((d) => (
                      <option key={d} value={d} style={{ background: "var(--color-surface)", color: "var(--color-text)" }}>
                        {d} (+{XP_PREVIEW[d]} XP)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontFamily: "var(--font-display)",
                      fontSize: "8px",
                      color: "var(--color-text-muted)",
                      marginBottom: "6px",
                      letterSpacing: "0.08em",
                    }}
                  >
                    RECURRENCE
                  </label>
                  <select
                    className="pixel-input"
                    value={recurrence}
                    onChange={(e) => setRecurrence(e.target.value as TaskRecurrence)}
                    style={{ cursor: "pointer" }}
                  >
                    {RECURRENCES.map((r) => (
                      <option key={r} value={r} style={{ background: "var(--color-surface)", color: "var(--color-text)" }}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="pixel-btn"
                  style={{ fontSize: "8px", padding: "10px 16px" }}
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="pixel-btn pixel-btn-primary"
                  style={{
                    fontSize: "8px",
                    padding: "10px 20px",
                    opacity: canSubmit ? 1 : 0.4,
                    cursor: canSubmit ? "pointer" : "not-allowed",
                  }}
                >
                  {isPending ? "SAVING..." : "SAVE CHANGES"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
