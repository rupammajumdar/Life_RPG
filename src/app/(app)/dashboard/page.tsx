"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useDashboard } from "@/hooks/useDashboard";
import { useCompleteTask } from "@/hooks/useTasks";
import { TaskCard } from "@/components/tasks/TaskCard";
import { CreateTaskModal } from "@/components/tasks/CreateTaskModal";
import { XpBar } from "@/components/ui/XpBar";
import { LevelUpModal } from "@/components/ui/LevelUpModal";
import { AttributeRadarChart } from "@/components/character/AttributeRadarChart";

const ATTRIBUTE_COLORS: Record<string, string> = {
  Strength:   "#ef4444",
  Intellect:  "#3b82f6",
  Discipline: "#10b981",
  Creativity: "#ec4899",
  Social:     "#f59e0b",
};

const ATTRIBUTE_ICONS: Record<string, string> = {
  Strength: "💪", Intellect: "🧠", Discipline: "⚡", Creativity: "🎨", Social: "🤝",
};

export default function DashboardPage() {
  const { data: dashboard, isLoading, error } = useDashboard();
  const [levelUps, setLevelUps]         = useState<number[]>([]);
  const [showCreateTask, setShowCreateTask] = useState(false);

  const handleLevelUp = useCallback((levels: number[]) => {
    setLevelUps(levels);
  }, []);

  if (isLoading) return <DashboardSkeleton />;
  if (error) return <ErrorState error={error as Error} />;
  if (!dashboard) return null;

  const { user, streak, attributes, todayTasks, recentCompletions } = dashboard;

  const completedToday = todayTasks.filter((t) => t.isCompletedToday).length;
  const pendingTasks   = todayTasks.filter((t) => !t.isCompletedToday);
  const doneTasks      = todayTasks.filter((t) => t.isCompletedToday);

  const avatarIcon = user.avatarFrame ? (
    user.avatarFrame.includes("dragon") ? "🐉" :
    user.avatarFrame.includes("paladin") ? "🛡️" :
    user.avatarFrame.includes("ninja") ? "🥷" : "🧙"
  ) : "🧙";

  return (
    <>
      {/* Level-up overlay */}
      <AnimatePresence>
        {levelUps.length > 0 && (
          <LevelUpModal levelUps={levelUps} onClose={() => setLevelUps([])} />
        )}
      </AnimatePresence>

      <CreateTaskModal open={showCreateTask} onClose={() => setShowCreateTask(false)} />

      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(13px, 2vw, 18px)",
                color: "var(--color-text)",
                letterSpacing: "0.05em",
              }}
            >
              DASHBOARD
            </h1>
            <p style={{ color: "var(--color-text-muted)", marginTop: "4px", fontSize: "13px" }}>
              Welcome back, <strong style={{ color: "var(--color-primary-light)" }}>{user.username}</strong>
            </p>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCreateTask(true)}
            className="pixel-btn pixel-btn-primary"
            id="add-quest-btn"
          >
            + ADD QUEST
          </motion.button>
        </motion.div>

        {/* ═══ TOP ROW: Character card + Streak + Attributes ═══ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Character Summary Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="pixel-card animate-pulse-glow"
            style={{ gridColumn: "span 1" }}
          >
            {/* Level badge */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <p
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "8px",
                    color: "var(--color-text-muted)",
                    letterSpacing: "0.1em",
                    marginBottom: "4px",
                  }}
                >
                  CHARACTER LEVEL
                </p>
                <motion.span
                  key={user.level}
                  initial={{ scale: 1.3, color: "var(--color-secondary)" }}
                  animate={{ scale: 1, color: "var(--color-secondary)" }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "42px",
                    color: "var(--color-secondary)",
                    textShadow: "3px 3px 0 #92400e",
                    lineHeight: 1,
                  }}
                >
                  {user.level}
                </motion.span>
              </div>
              <div style={{ fontSize: "48px" }}>
                {avatarIcon}
              </div>
            </div>

            {/* XP Bar */}
            <XpBar
              progress={user.xpProgress}
              needed={user.xpNeededForNext}
              level={user.level}
              showLabel
            />

            {/* Stats row */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: "0.75rem",
                marginTop: "1.25rem",
              }}
            >
              {[
                { label: "TOTAL XP", value: user.totalXp.toLocaleString(), color: "var(--color-primary-light)" },
                { label: "GOLD",     value: `${user.gold.toLocaleString()}G`, color: "var(--color-gold)" },
                { label: "TASKS",    value: `${completedToday}/${todayTasks.length}`, color: "var(--color-accent-light)" },
              ].map(({ label, value, color }) => (
                <div
                  key={label}
                  style={{
                    background: "var(--color-bg-alt)",
                    border: "1px solid var(--color-border)",
                    padding: "10px 8px",
                    textAlign: "center",
                  }}
                >
                  <p style={{ fontSize: "9px", color: "var(--color-text-dim)", fontFamily: "var(--font-display)", marginBottom: "4px" }}>
                    {label}
                  </p>
                  <motion.p
                    key={value}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    style={{ fontFamily: "var(--font-display)", fontSize: "11px", color }}
                  >
                    {value}
                  </motion.p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Streak Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 }}
            className="pixel-card"
          >
            <p
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "8px",
                color: "var(--color-text-muted)",
                letterSpacing: "0.1em",
                marginBottom: "1rem",
              }}
            >
              🔥 STREAK
            </p>

            <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
              <motion.div
                className="animate-streak-fire"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "52px",
                  color: "var(--color-streak)",
                  textShadow: "2px 2px 0 #9a3412, 0 0 20px var(--color-streak)",
                  lineHeight: 1,
                }}
              >
                {streak.currentStreak}
              </motion.div>
              <p
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "8px",
                  color: "var(--color-text-muted)",
                  marginTop: "8px",
                  letterSpacing: "0.1em",
                }}
              >
                DAYS
              </p>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem" }}>
              <div style={{ flex: 1, background: "var(--color-bg-alt)", border: "1px solid var(--color-border)", padding: "10px", textAlign: "center" }}>
                <p style={{ fontSize: "8px", color: "var(--color-text-dim)", fontFamily: "var(--font-display)", marginBottom: "4px" }}>BEST</p>
                <p style={{ fontFamily: "var(--font-display)", fontSize: "12px", color: "var(--color-secondary)" }}>{streak.longestStreak}d</p>
              </div>
              <div style={{ flex: 1, background: "var(--color-bg-alt)", border: "1px solid var(--color-border)", padding: "10px", textAlign: "center" }}>
                <p style={{ fontSize: "8px", color: "var(--color-text-dim)", fontFamily: "var(--font-display)", marginBottom: "4px" }}>FREEZE</p>
                <p style={{ fontFamily: "var(--font-display)", fontSize: "12px", color: "var(--color-accent)" }}>×{streak.freezesAvailable}</p>
              </div>
            </div>

            {/* Milestone indicators */}
            <div style={{ marginTop: "1rem" }}>
              {[7, 30, 100, 365].map((milestone) => (
                <div
                  key={milestone}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "4px",
                  }}
                >
                  <div
                    style={{
                      width: "10px",
                      height: "10px",
                      background:
                        streak.currentStreak >= milestone
                          ? "var(--color-streak)"
                          : "var(--color-border)",
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: "10px",
                      color:
                        streak.currentStreak >= milestone
                          ? "var(--color-streak)"
                          : "var(--color-text-dim)",
                    }}
                  >
                    {milestone}-day streak{" "}
                    {streak.currentStreak >= milestone ? "✓" : `(${milestone - streak.currentStreak} more)`}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Radar Chart */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.2 }}
            className="pixel-card"
            style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
          >
            <p
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "8px",
                color: "var(--color-text-muted)",
                letterSpacing: "0.1em",
                marginBottom: "1rem",
                alignSelf: "flex-start",
              }}
            >
              🗺️ ATTRIBUTES
            </p>
            <AttributeRadarChart attributes={attributes} size={240} />
          </motion.div>
        </div>

        {/* ═══ BOTTOM ROW: Quests + Attribute bars + History ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
          {/* Today's Quests */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="pixel-card"
            style={{ minHeight: "400px" }}
          >
            <div className="flex items-center justify-between mb-4">
              <p
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "8px",
                  color: "var(--color-text-muted)",
                  letterSpacing: "0.1em",
                }}
              >
                ⚔️ TODAY&apos;S QUESTS
              </p>
              <div className="flex items-center gap-3">
                <span
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "8px",
                    color: completedToday === todayTasks.length && todayTasks.length > 0
                      ? "var(--color-accent)"
                      : "var(--color-text-muted)",
                  }}
                >
                  {completedToday}/{todayTasks.length} DONE
                </span>
                <Link
                  href="/tasks"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "8px",
                    color: "var(--color-primary-light)",
                    textDecoration: "none",
                  }}
                  className="hover:underline"
                >
                  LOG ➔
                </Link>
              </div>
            </div>

            {todayTasks.length === 0 ? (
              <EmptyTaskState onAdd={() => setShowCreateTask(true)} />
            ) : (
              <div className="flex flex-col gap-2">
                {/* Pending tasks */}
                <AnimatePresence mode="popLayout">
                  {pendingTasks.map((task, i) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      index={i}
                      onLevelUp={handleLevelUp}
                    />
                  ))}
                </AnimatePresence>

                {/* Divider between done/pending */}
                {doneTasks.length > 0 && pendingTasks.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      margin: "4px 0",
                    }}
                  >
                    <div style={{ flex: 1, height: "1px", background: "var(--color-border)" }} />
                    <span style={{ fontSize: "10px", color: "var(--color-text-dim)" }}>
                      Completed
                    </span>
                    <div style={{ flex: 1, height: "1px", background: "var(--color-border)" }} />
                  </div>
                )}

                {/* Done tasks (collapsed) */}
                <AnimatePresence>
                  {doneTasks.map((task, i) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      index={pendingTasks.length + i}
                      onLevelUp={handleLevelUp}
                    />
                  ))}
                </AnimatePresence>

                {/* All done celebration */}
                {completedToday === todayTasks.length && todayTasks.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      textAlign: "center",
                      padding: "1.5rem",
                      background: "var(--color-accent)11",
                      border: "1px solid var(--color-accent)",
                      marginTop: "0.5rem",
                    }}
                  >
                    <p style={{ fontSize: "24px", marginBottom: "4px" }}>🎉</p>
                    <p
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "9px",
                        color: "var(--color-accent-light)",
                        letterSpacing: "0.08em",
                      }}
                    >
                      ALL QUESTS COMPLETE!
                    </p>
                  </motion.div>
                )}
              </div>
            )}
          </motion.div>

          {/* Right sidebar: Attribute bars + Recent activity */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {/* Attribute breakdown */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 }}
              className="pixel-card"
            >
              <p
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "8px",
                  color: "var(--color-text-muted)",
                  letterSpacing: "0.1em",
                  marginBottom: "1rem",
                }}
              >
                📊 STATS
              </p>
              <div className="flex flex-col gap-3">
                {attributes.map((attr) => {
                  const color = ATTRIBUTE_COLORS[attr.attribute] ?? "var(--color-primary)";
                  const pct = attr.xpNeededForNext > 0
                    ? Math.min((attr.xpProgress / attr.xpNeededForNext) * 100, 100)
                    : 0;

                  return (
                    <div key={attr.attribute}>
                      <div className="flex justify-between items-center mb-1">
                        <span style={{ fontSize: "12px" }}>{ATTRIBUTE_ICONS[attr.attribute]}</span>
                        <span
                          style={{
                            fontFamily: "var(--font-display)",
                            fontSize: "7px",
                            color,
                            flex: 1,
                            marginLeft: "6px",
                          }}
                        >
                          {attr.attribute.toUpperCase()}
                        </span>
                        <span
                          style={{
                            fontFamily: "var(--font-display)",
                            fontSize: "8px",
                            color,
                          }}
                        >
                          Lv.{attr.level}
                        </span>
                      </div>
                      <div
                        style={{
                          height: "6px",
                          background: "var(--color-bg)",
                          border: `1px solid ${color}44`,
                          overflow: "hidden",
                        }}
                      >
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{
                            type: "spring",
                            stiffness: 80,
                            damping: 20,
                            delay: 0.4,
                          }}
                          style={{ height: "100%", background: color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Recent activity */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.45 }}
              className="pixel-card"
              style={{ flex: 1 }}
            >
              <p
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "8px",
                  color: "var(--color-text-muted)",
                  letterSpacing: "0.1em",
                  marginBottom: "1rem",
                }}
              >
                📜 RECENT XP
              </p>
              {recentCompletions.length === 0 ? (
                <p style={{ fontSize: "12px", color: "var(--color-text-dim)", textAlign: "center", padding: "1rem" }}>
                  No activity yet
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {recentCompletions.slice(0, 5).map((c) => (
                    <div
                      key={c.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "6px 0",
                        borderBottom: "1px solid var(--color-border)",
                        gap: "8px",
                      }}
                    >
                      <span
                        style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          color: "var(--color-text-muted)",
                          flex: 1,
                          fontSize: "11px",
                        }}
                      >
                        {c.taskTitle}
                      </span>
                      <span
                        style={{
                          fontFamily: "var(--font-display)",
                          fontSize: "8px",
                          color: "var(--color-primary-light)",
                          flexShrink: 0,
                        }}
                      >
                        +{c.xpAwarded}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ height: "20px", width: "200px", background: "var(--color-surface)", marginBottom: "8px" }} />
        <div style={{ height: "14px", width: "150px", background: "var(--color-surface)" }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5rem" }}>
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
            style={{ height: "250px", background: "var(--color-surface)", border: "2px solid var(--color-border)" }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Empty tasks state ────────────────────────────────────────────────────────

function EmptyTaskState({ onAdd }: { onAdd: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{ textAlign: "center", padding: "3rem 2rem" }}
    >
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        style={{ fontSize: "56px", marginBottom: "1rem" }}
      >
        😴
      </motion.div>
      <p
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "9px",
          color: "var(--color-text-muted)",
          marginBottom: "0.5rem",
          letterSpacing: "0.08em",
        }}
      >
        NO QUESTS TODAY
      </p>
      <p style={{ fontSize: "12px", color: "var(--color-text-dim)", marginBottom: "1.5rem" }}>
        Your character is idle. Add a quest to start earning XP!
      </p>
      <button onClick={onAdd} className="pixel-btn pixel-btn-primary" style={{ fontSize: "9px", padding: "12px 20px" }}>
        + ADD FIRST QUEST
      </button>
    </motion.div>
  );
}

// ─── Error state ──────────────────────────────────────────────────────────────

function ErrorState({ error }: { error: Error }) {
  return (
    <div style={{ textAlign: "center", padding: "4rem", color: "var(--color-text-muted)" }}>
      <p style={{ fontSize: "32px", marginBottom: "1rem" }}>⚠️</p>
      <p style={{ fontFamily: "var(--font-display)", fontSize: "9px", marginBottom: "0.5rem" }}>
        LOAD ERROR
      </p>
      <p style={{ fontSize: "12px" }}>{error.message}</p>
      <button
        onClick={() => window.location.reload()}
        className="pixel-btn pixel-btn-primary"
        style={{ marginTop: "1.5rem", fontSize: "9px" }}
      >
        RETRY
      </button>
    </div>
  );
}
