"use client";

import { motion } from "framer-motion";

interface XpBarProps {
  progress: number;       // XP earned within current level
  needed: number;         // XP needed for next level
  level: number;
  animate?: boolean;
  showLabel?: boolean;
  height?: number;
}

export function XpBar({
  progress,
  needed,
  level,
  animate = true,
  showLabel = true,
  height = 12,
}: XpBarProps) {
  const pct = needed > 0 ? Math.min((progress / needed) * 100, 100) : 0;

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between items-center mb-1">
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "8px",
              color: "var(--color-primary-light)",
              letterSpacing: "0.05em",
            }}
          >
            LVL {level}
          </span>
          <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
            {progress.toLocaleString()} / {needed.toLocaleString()} XP
          </span>
        </div>
      )}
      <div
        className="xp-bar-track"
        style={{ height: `${height}px` }}
        title={`${pct.toFixed(1)}% to next level`}
      >
        <motion.div
          className="xp-bar-fill"
          initial={animate ? { width: 0 } : { width: `${pct}%` }}
          animate={{ width: `${pct}%` }}
          transition={{
            type: "spring",
            stiffness: 60,
            damping: 20,
            delay: 0.2,
          }}
          style={{ height: "100%" }}
        />
      </div>
    </div>
  );
}

// Mini attribute XP bar
export function AttributeBar({
  xp,
  level,
  xpProgress,
  xpNeeded,
  color,
}: {
  xp: number;
  level: number;
  xpProgress: number;
  xpNeeded: number;
  color: string;
}) {
  const pct = xpNeeded > 0 ? Math.min((xpProgress / xpNeeded) * 100, 100) : 0;

  return (
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
        transition={{ type: "spring", stiffness: 80, damping: 20, delay: 0.3 }}
        style={{ height: "100%", background: color }}
      />
    </div>
  );
}
