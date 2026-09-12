"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCreateTask } from "@/hooks/useTasks";
import { TaskCategory, TaskDifficulty, TaskRecurrence } from "@/types";

interface CreateTaskModalProps {
  open: boolean;
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

export function CreateTaskModal({ open, onClose }: CreateTaskModalProps) {
  const [title, setTitle]           = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory]     = useState<TaskCategory>("Intellect");
  const [difficulty, setDifficulty] = useState<TaskDifficulty>("Medium");
  const [recurrence, setRecurrence] = useState<TaskRecurrence>("One-Off");

  const { mutate: create, isPending } = useCreateTask();

  const trimmedTitle = title.trim();
  const canSubmit = trimmedTitle.length > 0 && trimmedTitle.length <= 200 && !isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    create(
      { title: trimmedTitle, description, category, difficulty, recurrence },
      {
        onSuccess: () => {
          setTitle("");
          setDescription("");
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
          {/* Modal Card */}
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
                ⚔️ NEW QUEST
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
                  NOTES (OPTIONAL)
                </label>
                <textarea
                  className="pixel-input"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Additional context..."
                  rows={2}
                  maxLength={1000}
                  style={{ resize: "none" }}
                />
              </div>

              {/* Category + Difficulty row */}
              <div className="grid grid-cols-2 gap-4">
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
                    ATTRIBUTE
                  </label>
                  <select
                    className="pixel-select"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as TaskCategory)}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {CATEGORY_ICONS[c]} {c}
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
                    DIFFICULTY
                  </label>
                  <select
                    className="pixel-select"
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as TaskDifficulty)}
                  >
                    {DIFFICULTIES.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Recurrence */}
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
                <div className="flex gap-2">
                  {RECURRENCES.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRecurrence(r)}
                      className="pixel-btn"
                      style={{
                        flex: 1,
                        fontSize: "8px",
                        padding: "8px 4px",
                        background:
                          recurrence === r
                            ? "var(--color-primary)"
                            : "var(--color-surface-2)",
                        borderColor:
                          recurrence === r
                            ? "var(--color-primary-light)"
                            : "var(--color-border)",
                        color: recurrence === r ? "white" : "var(--color-text-muted)",
                      }}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* XP preview */}
              <div
                style={{
                  background: "var(--color-bg-alt)",
                  border: "1px solid var(--color-border)",
                  padding: "10px 14px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                  Estimated reward:
                </span>
                <div className="flex items-center gap-3">
                  <span
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "10px",
                      color: "var(--color-primary-light)",
                    }}
                  >
                    +{XP_PREVIEW[difficulty]} XP
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "10px",
                      color: "var(--color-gold)",
                    }}
                  >
                    +{Math.floor(XP_PREVIEW[difficulty] / 5)}G
                  </span>
                </div>
              </div>

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={!canSubmit}
                whileTap={canSubmit ? { scale: 0.97 } : {}}
                className="pixel-btn pixel-btn-primary"
                style={{
                  width: "100%",
                  padding: "14px",
                  fontSize: "10px",
                  opacity: canSubmit ? 1 : 0.5,
                  cursor: canSubmit ? "pointer" : "not-allowed",
                }}
              >
                {isPending ? "CREATING..." : "⚔️ ADD QUEST"}
              </motion.button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
