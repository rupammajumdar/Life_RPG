"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTasksList, useCompleteTask, useDeleteTask } from "@/hooks/useTasks";
import { TaskData, TaskCategory, TaskRecurrence } from "@/types";
import { CreateTaskModal } from "@/components/tasks/CreateTaskModal";
import { EditTaskModal } from "@/components/tasks/EditTaskModal";
import { XpParticle } from "@/components/ui/XpParticle";
import { LevelUpModal } from "@/components/ui/LevelUpModal";

const CATEGORIES: TaskCategory[] = [
  "Strength", "Intellect", "Discipline", "Creativity", "Social",
];

const CATEGORY_COLORS: Record<string, string> = {
  Strength: "var(--color-strength)",
  Intellect: "var(--color-intellect)",
  Discipline: "var(--color-discipline)",
  Creativity: "var(--color-creativity)",
  Social: "var(--color-social)",
};

const CATEGORY_ICONS: Record<string, string> = {
  Strength: "💪",
  Intellect: "🧠",
  Discipline: "⚡",
  Creativity: "🎨",
  Social: "🤝",
};

const DIFFICULTY_COLORS: Record<string, string> = {
  Trivial: "#64748b",
  Easy: "#10b981",
  Medium: "#3b82f6",
  Hard: "#f59e0b",
  Epic: "#ef4444",
};

export default function TasksPage() {
  const { data: tasks = [], isLoading } = useTasksList();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTask, setEditTask] = useState<TaskData | null>(null);

  // Filters
  const [filterRecurrence, setFilterRecurrence] = useState<string>("ALL");
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [search, setSearch] = useState("");

  // Animation states
  const [levelUpLevels, setLevelUpLevels] = useState<number[]>([]);
  const [particles, setParticles] = useState<Array<{ id: string; x: number; y: number }>>([]);

  const handleXpGain = useCallback((_xp: number, _taskId: string) => {
    const id = Math.random().toString();
    setParticles((prev) => [...prev, { id, x: window.innerWidth / 2, y: window.innerHeight / 2 }]);
  }, []);

  const handleLevelUp = useCallback((levels: number[]) => {
    setLevelUpLevels(levels);
  }, []);

  const { mutate: completeTask, isPending: completing } = useCompleteTask({
    onLevelUp: handleLevelUp,
    onXpGain: handleXpGain,
  });

  const { mutate: deleteTask } = useDeleteTask();

  // Filter logic
  const filteredTasks = tasks.filter((t) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchDesc = t.description?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc) return false;
    }
    if (filterRecurrence === "COMPLETED") {
      if (!t.isCompletedToday) return false;
    } else if (filterRecurrence !== "ALL") {
      if (t.recurrence !== filterRecurrence) return false;
    }
    if (filterCategory !== "ALL" && t.category !== filterCategory) {
      return false;
    }
    return true;
  });

  const activeCount = tasks.filter((t) => !t.isCompletedToday).length;
  const completedCount = tasks.filter((t) => t.isCompletedToday).length;

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
      {/* XP Floating Particles */}
      {particles.map((p) => (
        <XpParticle
          key={p.id}
          xp={50}
          visible={true}
          onDone={() => setParticles((prev) => prev.filter((item) => item.id !== p.id))}
        />
      ))}

      {/* Level Up Modal */}
      {levelUpLevels.length > 0 && (
        <LevelUpModal
          levelUps={levelUpLevels}
          onClose={() => setLevelUpLevels([])}
        />
      )}

      {/* Modals */}
      <CreateTaskModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <EditTaskModal open={!!editTask} task={editTask} onClose={() => setEditTask(null)} />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6 flex-wrap gap-4"
      >
        <div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(14px, 2vw, 20px)",
              letterSpacing: "0.05em",
            }}
          >
            ⚔️ QUEST LOG
          </h1>
          <p style={{ fontSize: "11px", color: "var(--color-text-dim)", marginTop: "4px" }}>
            {activeCount} active quest{activeCount === 1 ? "" : "s"} · {completedCount} completed today
          </p>
        </div>

        <button
          onClick={() => setCreateOpen(true)}
          className="pixel-btn pixel-btn-primary"
          style={{ fontSize: "9px", padding: "10px 18px" }}
        >
          + NEW QUEST
        </button>
      </motion.div>

      {/* Search & Recurrence Filter Tabs */}
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        {/* Search */}
        <div style={{ flex: 1 }}>
          <input
            className="pixel-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 Search quests by keyword..."
            style={{ width: "100%" }}
          />
        </div>

        {/* Recurrence Filters */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {["ALL", "One-Off", "Daily", "Weekly", "COMPLETED"].map((rec) => (
            <button
              key={rec}
              onClick={() => setFilterRecurrence(rec)}
              className="pixel-btn"
              style={{
                fontSize: "8px",
                padding: "8px 12px",
                background: filterRecurrence === rec ? "var(--color-primary)" : "var(--color-surface-2)",
                borderColor: filterRecurrence === rec ? "var(--color-primary-light)" : "var(--color-border)",
                color: filterRecurrence === rec ? "white" : "var(--color-text-muted)",
              }}
            >
              {rec === "COMPLETED" ? "DONE TODAY" : rec.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Category Filter Pills */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "1.5rem", overflowX: "auto", paddingBottom: "4px" }}>
        <button
          onClick={() => setFilterCategory("ALL")}
          style={{
            padding: "6px 12px",
            background: filterCategory === "ALL" ? "var(--color-surface-2)" : "transparent",
            border: `1px solid ${filterCategory === "ALL" ? "var(--color-border-bright)" : "var(--color-border)"}`,
            color: filterCategory === "ALL" ? "var(--color-text)" : "var(--color-text-dim)",
            fontFamily: "var(--font-display)",
            fontSize: "7px",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          ALL CATEGORIES
        </button>
        {CATEGORIES.map((cat) => {
          const isSelected = filterCategory === cat;
          const color = CATEGORY_COLORS[cat];
          return (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              style={{
                padding: "6px 12px",
                background: isSelected ? `${color}22` : "transparent",
                border: `1px solid ${isSelected ? color : "var(--color-border)"}`,
                color: isSelected ? color : "var(--color-text-dim)",
                fontFamily: "var(--font-display)",
                fontSize: "7px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                flexShrink: 0,
              }}
            >
              <span>{CATEGORY_ICONS[cat]}</span>
              <span>{cat.toUpperCase()}</span>
            </button>
          );
        })}
      </div>

      {/* Quest List */}
      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={i}
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
              style={{ height: "72px", background: "var(--color-surface)", border: "2px solid var(--color-border)" }}
            />
          ))}
        </div>
      ) : filteredTasks.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="pixel-card"
          style={{ textAlign: "center", padding: "3rem 1.5rem" }}
        >
          <div style={{ fontSize: "48px", marginBottom: "1rem" }}>📜</div>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "11px",
              color: "var(--color-text)",
              marginBottom: "8px",
            }}
          >
            NO QUESTS FOUND
          </h2>
          <p style={{ fontSize: "12px", color: "var(--color-text-muted)", marginBottom: "1.5rem" }}>
            {tasks.length === 0
              ? "Your quest log is empty. Forge your first adventure!"
              : "No quests match your current filters."}
          </p>
          <button
            onClick={() => {
              if (tasks.length === 0) setCreateOpen(true);
              else {
                setFilterCategory("ALL");
                setFilterRecurrence("ALL");
                setSearch("");
              }
            }}
            className="pixel-btn pixel-btn-primary"
            style={{ fontSize: "8px", padding: "8px 16px" }}
          >
            {tasks.length === 0 ? "+ CREATE FIRST QUEST" : "RESET FILTERS"}
          </button>
        </motion.div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="flex flex-col gap-3">
            {filteredTasks.map((t, idx) => {
              const catColor = CATEGORY_COLORS[t.category] ?? "var(--color-primary)";
              const diffColor = DIFFICULTY_COLORS[t.difficulty] ?? "#94a3b8";

              return (
                <motion.div
                  key={t.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.03 }}
                  className="pixel-card"
                  style={{
                    padding: "1rem 1.25rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                    borderLeft: `4px solid ${catColor}`,
                    opacity: t.isCompletedToday ? 0.6 : 1,
                  }}
                >
                  {/* Completion Checkbox */}
                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={() => !t.isCompletedToday && !completing && completeTask(t.id)}
                    disabled={t.isCompletedToday || completing}
                    style={{
                      width: "28px",
                      height: "28px",
                      background: t.isCompletedToday ? "var(--color-accent)" : "var(--color-bg-alt)",
                      border: `2px solid ${t.isCompletedToday ? "var(--color-accent-light)" : "var(--color-border)"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: t.isCompletedToday ? "default" : "pointer",
                      flexShrink: 0,
                      color: "white",
                      fontSize: "14px",
                    }}
                    title={t.isCompletedToday ? "Completed today" : "Mark as complete"}
                  >
                    {t.isCompletedToday ? "✓" : ""}
                  </motion.button>

                  {/* Details */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span
                        style={{
                          fontSize: "7px",
                          fontFamily: "var(--font-display)",
                          color: catColor,
                          background: `${catColor}18`,
                          border: `1px solid ${catColor}44`,
                          padding: "2px 6px",
                        }}
                      >
                        {CATEGORY_ICONS[t.category]} {t.category.toUpperCase()}
                      </span>

                      <span
                        style={{
                          fontSize: "7px",
                          fontFamily: "var(--font-display)",
                          color: diffColor,
                          background: `${diffColor}18`,
                          border: `1px solid ${diffColor}44`,
                          padding: "2px 6px",
                        }}
                      >
                        {t.difficulty.toUpperCase()}
                      </span>

                      <span
                        style={{
                          fontSize: "7px",
                          fontFamily: "var(--font-display)",
                          color: "var(--color-text-dim)",
                          background: "var(--color-surface-2)",
                          border: "1px solid var(--color-border)",
                          padding: "2px 6px",
                        }}
                      >
                        {t.recurrence.toUpperCase()}
                      </span>
                    </div>

                    <h3
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "9px",
                        color: t.isCompletedToday ? "var(--color-text-dim)" : "var(--color-text)",
                        textDecoration: t.isCompletedToday ? "line-through" : "none",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {t.title}
                    </h3>

                    {t.description && (
                      <p
                        style={{
                          fontSize: "11px",
                          color: "var(--color-text-muted)",
                          marginTop: "2px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {t.description}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditTask(t)}
                      style={{
                        background: "none",
                        border: "1px solid var(--color-border)",
                        color: "var(--color-text-muted)",
                        padding: "4px 8px",
                        fontSize: "10px",
                        cursor: "pointer",
                      }}
                      title="Edit Quest"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Archive quest "${t.title}"?`)) {
                          deleteTask(t.id);
                        }
                      }}
                      style={{
                        background: "none",
                        border: "1px solid var(--color-border)",
                        color: "#ef4444",
                        padding: "4px 8px",
                        fontSize: "10px",
                        cursor: "pointer",
                      }}
                      title="Archive Quest"
                    >
                      🗑️
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}
