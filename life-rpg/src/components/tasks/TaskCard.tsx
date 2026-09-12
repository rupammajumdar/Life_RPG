"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { TaskData } from "@/types";
import { useCompleteTask, useDeleteTask } from "@/hooks/useTasks";
import { XpParticle, GoldParticle } from "@/components/ui/XpParticle";
import { LevelUpModal } from "@/components/ui/LevelUpModal";
import { CompletionResult } from "@/types";

const CATEGORY_COLORS: Record<string, string> = {
  Strength:   "var(--color-strength)",
  Intellect:  "var(--color-intellect)",
  Discipline: "var(--color-discipline)",
  Creativity: "var(--color-creativity)",
  Social:     "var(--color-social)",
};

const CATEGORY_ICONS: Record<string, string> = {
  Strength:   "💪",
  Intellect:  "🧠",
  Discipline: "⚡",
  Creativity: "🎨",
  Social:     "🤝",
};

const DIFFICULTY_LABELS: Record<string, string> = {
  Trivial: "TRIVIAL",
  Easy:    "EASY",
  Medium:  "MEDIUM",
  Hard:    "HARD",
  Epic:    "EPIC",
};

interface TaskCardProps {
  task: TaskData;
  index: number;
  onLevelUp?: (levelUps: number[]) => void;
}

export function TaskCard({ task, index, onLevelUp }: TaskCardProps) {
  const [showXp, setShowXp] = useState(false);
  const [showGold, setShowGold] = useState(false);
  const [lastResult, setLastResult] = useState<CompletionResult | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const { mutate: complete, isPending } = useCompleteTask({
    onLevelUp,
    onXpGain: (_xp, taskId) => {
      if (taskId === task.id) {
        setShowXp(true);
        setTimeout(() => setShowGold(true), 150);
      }
    },
  });

  const { mutate: deleteTask } = useDeleteTask();

  const handleComplete = () => {
    if (task.isCompletedToday || isPending) return;
    complete(task.id);
  };

  const categoryColor = CATEGORY_COLORS[task.category] ?? "var(--color-primary)";

  return (
    <>
      <motion.div
        ref={cardRef}
        layout
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20, height: 0 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 25,
          delay: index * 0.05,
        }}
        className={`task-card ${task.isCompletedToday ? "completed" : ""}`}
        style={{ position: "relative", overflow: "visible" }}
      >
        {/* Category accent bar */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: "4px",
            background: categoryColor,
          }}
        />

        <div className="flex items-center gap-3 pl-2">
          {/* Checkbox */}
          <motion.button
            whileTap={{ scale: 0.85 }}
            transition={{ type: "spring", stiffness: 500, damping: 20 }}
            onClick={handleComplete}
            disabled={task.isCompletedToday || isPending}
            aria-label={task.isCompletedToday ? "Task completed" : "Complete task"}
            style={{
              width: "28px",
              height: "28px",
              border: `2px solid ${task.isCompletedToday ? "var(--color-accent)" : categoryColor}`,
              background: task.isCompletedToday ? "var(--color-accent)" : "transparent",
              cursor: task.isCompletedToday ? "default" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              transition: "background 0.2s, border-color 0.2s",
              position: "relative",
            }}
          >
            {task.isCompletedToday && (
              <motion.svg
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
              >
                <path
                  d="M2 7l3.5 3.5L12 4"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="square"
                />
              </motion.svg>
            )}
            {isPending && !task.isCompletedToday && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                style={{
                  width: "12px",
                  height: "12px",
                  border: `2px solid ${categoryColor}`,
                  borderTopColor: "transparent",
                  borderRadius: "50%",
                }}
              />
            )}
          </motion.button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p
                className="task-title"
                style={{
                  fontSize: "14px",
                  fontWeight: 500,
                  color: task.isCompletedToday
                    ? "var(--color-text-dim)"
                    : "var(--color-text)",
                  textDecoration: task.isCompletedToday ? "line-through" : "none",
                  transition: "color 0.3s, text-decoration 0.3s",
                  wordBreak: "break-word",
                }}
              >
                {task.title}
              </p>

              {/* Delete button */}
              {!task.isCompletedToday && (
                <button
                  onClick={() => deleteTask(task.id)}
                  aria-label="Archive task"
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--color-text-dim)",
                    cursor: "pointer",
                    fontSize: "12px",
                    padding: "2px 4px",
                    flexShrink: 0,
                    opacity: 0,
                    transition: "opacity 0.15s",
                  }}
                  className="task-delete-btn"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Meta row */}
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span style={{ fontSize: "13px" }}>
                {CATEGORY_ICONS[task.category]}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "7px",
                  color: categoryColor,
                  letterSpacing: "0.05em",
                }}
              >
                {task.category}
              </span>
              <span style={{ color: "var(--color-border)", fontSize: "10px" }}>
                |
              </span>
              <span
                className={`diff-${task.difficulty.toLowerCase()}`}
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "7px",
                  border: "1px solid",
                  padding: "1px 5px",
                  letterSpacing: "0.05em",
                }}
              >
                {DIFFICULTY_LABELS[task.difficulty]}
              </span>
              {task.recurrence !== "One-Off" && (
                <span
                  style={{
                    color: "var(--color-text-muted)",
                    fontFamily: "var(--font-display)",
                    fontSize: "7px",
                  }}
                >
                  🔄 {task.recurrence}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* XP particles — positioned relative to this card */}
        <XpParticle
          xp={lastResult?.xpAwarded ?? 50}
          visible={showXp}
          onDone={() => setShowXp(false)}
        />
        <GoldParticle
          gold={lastResult?.goldAwarded ?? 10}
          visible={showGold}
          onDone={() => setShowGold(false)}
        />
      </motion.div>

      {/* Show delete button on hover via CSS */}
      <style>{`
        .task-card:hover .task-delete-btn { opacity: 1 !important; }
      `}</style>
    </>
  );
}
