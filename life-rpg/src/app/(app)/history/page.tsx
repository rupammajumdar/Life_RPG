"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";

interface HistoryItem {
  id: string;
  taskTitle: string;
  category: string;
  difficulty: string;
  xpAwarded: number;
  goldAwarded: number;
  completedAt: string;
}

async function fetchHistory(page: number) {
  const res = await fetch(`/api/history?page=${page}&limit=20`);
  if (!res.ok) throw new Error("Failed to load history");
  const json = await res.json();
  return json.data as {
    items: HistoryItem[];
    pagination: { page: number; total: number; totalPages: number; hasMore: boolean };
  };
}

const CATEGORY_COLORS: Record<string, string> = {
  Strength: "#ef4444", Intellect: "#3b82f6", Discipline: "#10b981",
  Creativity: "#ec4899", Social: "#f59e0b",
};

const DIFF_COLORS: Record<string, string> = {
  Trivial: "#9ca3af", Easy: "#86efac", Medium: "#fde68a", Hard: "#fca5a5", Epic: "#c084fc",
};

export default function HistoryPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["history", page],
    queryFn: () => fetchHistory(page),
    staleTime: 60_000,
  });

  const totalXp = data?.items.reduce((sum, c) => sum + c.xpAwarded, 0) ?? 0;

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(13px, 2vw, 18px)", letterSpacing: "0.05em" }}>
          📜 HISTORY
        </h1>
        {data && (
          <div style={{ textAlign: "right" }}>
            <p style={{ fontFamily: "var(--font-display)", fontSize: "8px", color: "var(--color-text-muted)" }}>
              {data.pagination.total} COMPLETIONS
            </p>
          </div>
        )}
      </motion.div>

      {/* Immutable record notice */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          padding: "10px 14px",
          marginBottom: "1.5rem",
          fontSize: "12px",
          color: "var(--color-text-muted)",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <span>🔒</span>
        <span>This is an immutable audit log. Records cannot be edited or deleted.</span>
      </motion.div>

      {isLoading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
              style={{ height: "52px", background: "var(--color-surface)", border: "2px solid var(--color-border)" }}
            />
          ))}
        </div>
      ) : data?.items.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem", color: "var(--color-text-muted)" }}>
          <p style={{ fontSize: "40px", marginBottom: "1rem" }}>📜</p>
          <p style={{ fontFamily: "var(--font-display)", fontSize: "9px" }}>NO HISTORY YET</p>
          <p style={{ fontSize: "13px", marginTop: "8px" }}>Complete your first quest to see your adventure log!</p>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "1.5rem" }}>
            {data?.items.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                style={{
                  background: "var(--color-surface)",
                  border: "2px solid var(--color-border)",
                  padding: "12px 16px",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Category accent */}
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: "3px",
                    background: CATEGORY_COLORS[item.category] ?? "var(--color-primary)",
                  }}
                />

                <div style={{ flex: 1, paddingLeft: "4px" }}>
                  <p style={{ fontSize: "13px", color: "var(--color-text)", marginBottom: "2px" }}>
                    {item.taskTitle}
                  </p>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <span
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "7px",
                        color: CATEGORY_COLORS[item.category] ?? "var(--color-primary)",
                      }}
                    >
                      {item.category}
                    </span>
                    <span style={{ color: "var(--color-border)", fontSize: "10px" }}>|</span>
                    <span
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "7px",
                        color: DIFF_COLORS[item.difficulty] ?? "var(--color-text-muted)",
                      }}
                    >
                      {item.difficulty}
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "12px", alignItems: "center", flexShrink: 0 }}>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: "9px", color: "var(--color-primary-light)" }}>
                    +{item.xpAwarded} XP
                  </span>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: "9px", color: "var(--color-gold)" }}>
                    +{item.goldAwarded}G
                  </span>
                  <span style={{ fontSize: "11px", color: "var(--color-text-dim)", minWidth: "70px", textAlign: "right" }}>
                    {new Date(item.completedAt).toLocaleDateString()}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Pagination */}
          {data && data.pagination.totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: "12px", alignItems: "center" }}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="pixel-btn"
                style={{ fontSize: "8px", opacity: page === 1 ? 0.4 : 1 }}
              >
                ← PREV
              </button>
              <span style={{ fontFamily: "var(--font-display)", fontSize: "9px", color: "var(--color-text-muted)" }}>
                {page} / {data.pagination.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={!data.pagination.hasMore}
                className="pixel-btn"
                style={{ fontSize: "8px", opacity: !data.pagination.hasMore ? 0.4 : 1 }}
              >
                NEXT →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
