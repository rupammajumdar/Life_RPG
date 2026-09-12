"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { LeaderboardEntry, LeaderboardSortOption } from "@/types";
import { sound } from "@/lib/sound";

const SORT_OPTIONS: { id: LeaderboardSortOption; label: string; icon: string; desc: string }[] = [
  { id: "xp",     label: "LIFETIME XP",     icon: "🌟", desc: "Ranked by Total Lifetime XP & Level" },
  { id: "streak", label: "STREAK MASTERS",  icon: "🔥", desc: "Ranked by Current & Longest Streaks" },
  { id: "quests", label: "QUESTS CLEARED",  icon: "⚔️", desc: "Ranked by Total Completed Quests" },
];

function getAvatarIcon(frame: string | null): string {
  if (!frame) return "🧙";
  if (frame.includes("dragon")) return "🐉";
  if (frame.includes("paladin")) return "🛡️";
  if (frame.includes("ninja")) return "🥷";
  return "🧙";
}

function getTierTitle(level: number): string {
  if (level >= 20) return "MYTHIC";
  if (level >= 10) return "LEGEND";
  if (level >= 6)  return "VETERAN";
  if (level >= 3)  return "ADEPT";
  return "NOVICE";
}

export default function LeaderboardPage() {
  const [activeSort, setActiveSort] = useState<LeaderboardSortOption>("xp");
  const [searchQuery, setSearchQuery] = useState("");
  const [secondsAgo, setSecondsAgo] = useState(0);

  const { data, isLoading, isFetching, refetch, error } = useLeaderboard(activeSort);

  // Counter tracking seconds since last update
  useEffect(() => {
    setSecondsAgo(0);
    const interval = setInterval(() => {
      setSecondsAgo((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [data?.lastUpdated]);

  const handleSortChange = (sortId: LeaderboardSortOption) => {
    sound.playClick();
    setActiveSort(sortId);
  };

  const handleRefresh = () => {
    sound.playClick();
    refetch();
  };

  if (isLoading) {
    return <LeaderboardSkeleton />;
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center">
        <p style={{ color: "#ef4444", fontFamily: "var(--font-display)", fontSize: "12px" }}>
          ⚠️ FAILED TO LOAD LEADERBOARD
        </p>
        <button
          onClick={() => refetch()}
          className="pixel-btn pixel-btn-primary mt-4"
          style={{ fontSize: "9px" }}
        >
          RETRY
        </button>
      </div>
    );
  }

  const { leaderboard, currentUserRank } = data;

  // Filter by search query
  const filteredLeaderboard = leaderboard.filter((entry) =>
    entry.username.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  const topThree = leaderboard.slice(0, 3);
  const currentUserEntry = leaderboard.find((e) => e.isCurrentUser);

  // Calculate XP gap to person above current user
  let gapToNext: { username: string; xpNeeded: number } | null = null;
  if (currentUserEntry && currentUserEntry.rank > 1) {
    const higherPlayer = leaderboard.find((e) => e.rank === currentUserEntry.rank - 1);
    if (higherPlayer) {
      gapToNext = {
        username: higherPlayer.username,
        xpNeeded: Math.max(0, higherPlayer.totalXp - currentUserEntry.totalXp + 1),
      };
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* ═════════════════════════════════════════════════════════════════
          HEADER: TITLE & REAL-TIME STATUS BAR
         ═════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span style={{ fontSize: "24px" }}>🏆</span>
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "14px",
                color: "var(--color-primary-light)",
                letterSpacing: "0.12em",
                textShadow: "2px 2px 0 var(--color-primary)",
              }}
            >
              HALL OF HEROES
            </h1>
          </div>
          <p
            style={{
              fontSize: "10px",
              color: "var(--color-text-muted)",
              marginTop: "4px",
              fontFamily: "var(--font-display)",
              letterSpacing: "0.06em",
            }}
          >
            GLOBAL REAL-TIME RANKINGS & REALM HEROES
          </p>
        </div>

        {/* Real-time sync badge & refresh */}
        <div className="flex items-center gap-3">
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 12px",
              background: "rgba(16, 185, 129, 0.12)",
              border: "1px solid #10b981",
              fontSize: "8px",
              fontFamily: "var(--font-display)",
              letterSpacing: "0.08em",
              color: "#34d399",
            }}
          >
            <motion.span
              animate={{ opacity: [1, 0.2, 1] }}
              transition={{ repeat: Infinity, duration: 1.6 }}
              style={{
                display: "inline-block",
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                background: "#10b981",
                boxShadow: "0 0 8px #10b981",
              }}
            />
            <span>LIVE SYNC ({secondsAgo}s ago)</span>
          </div>

          <button
            onClick={handleRefresh}
            disabled={isFetching}
            className="pixel-btn"
            style={{
              fontSize: "8px",
              padding: "6px 10px",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
            }}
            title="Refresh Leaderboard"
          >
            <motion.span
              animate={isFetching ? { rotate: 360 } : { rotate: 0 }}
              transition={isFetching ? { repeat: Infinity, duration: 0.8, ease: "linear" } : {}}
            >
              🔄
            </motion.span>
            <span>{isFetching ? "SYNCING..." : "REFRESH"}</span>
          </button>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════════
          CURRENT USER HUD CARD (PINNED STANDING)
         ═════════════════════════════════════════════════════════════════ */}
      {currentUserEntry && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="pixel-card"
          style={{
            background: "linear-gradient(135deg, var(--color-surface) 0%, rgba(124, 58, 237, 0.15) 100%)",
            border: "2px solid var(--color-primary)",
            boxShadow: "4px 4px 0px var(--color-primary), 0 0 24px rgba(124, 58, 237, 0.25)",
            padding: "1rem 1.25rem",
          }}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  background: "var(--color-surface-2)",
                  border: "2px solid var(--color-primary-light)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px",
                  boxShadow: "2px 2px 0 var(--color-primary)",
                }}
              >
                {getAvatarIcon(currentUserEntry.avatarFrame)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "11px",
                      color: "var(--color-primary-light)",
                    }}
                  >
                    {currentUserEntry.username}
                  </span>
                  <span
                    style={{
                      fontSize: "7px",
                      padding: "2px 6px",
                      background: "var(--color-primary)",
                      color: "white",
                      fontFamily: "var(--font-display)",
                    }}
                  >
                    YOU
                  </span>
                  <span
                    style={{
                      fontSize: "8px",
                      color: "var(--color-gold)",
                      fontFamily: "var(--font-display)",
                    }}
                  >
                    {getTierTitle(currentUserEntry.level)}
                  </span>
                </div>
                <p style={{ fontSize: "9px", color: "var(--color-text-muted)", marginTop: "2px" }}>
                  Level {currentUserEntry.level} • {currentUserEntry.totalXp.toLocaleString()} Lifetime XP • {currentUserEntry.completedTasksCount} Quests Cleared
                </p>
              </div>
            </div>

            {/* Rank badge and gap hint */}
            <div className="flex items-center gap-4 text-right">
              <div>
                <p
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "8px",
                    color: "var(--color-text-muted)",
                    letterSpacing: "0.1em",
                  }}
                >
                  GLOBAL STANDING
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "18px",
                    color: currentUserEntry.rank === 1 ? "var(--color-gold)" : "var(--color-primary-light)",
                    lineHeight: 1.2,
                    textShadow: currentUserEntry.rank === 1 ? "0 0 12px rgba(245, 158, 11, 0.6)" : "none",
                  }}
                >
                  {currentUserEntry.rank === 1 ? "👑 RANK #1" : `RANK #${currentUserEntry.rank}`}{" "}
                  <span style={{ fontSize: "10px", color: "var(--color-text-dim)" }}>
                    / {leaderboard.length}
                  </span>
                </p>
                {gapToNext ? (
                  <p style={{ fontSize: "8px", color: "var(--color-text-dim)", marginTop: "2px" }}>
                    ⚔️ +{gapToNext.xpNeeded.toLocaleString()} XP to overtake #{currentUserEntry.rank - 1} ({gapToNext.username})
                  </p>
                ) : currentUserEntry.rank === 1 ? (
                  <p style={{ fontSize: "8px", color: "var(--color-gold)", marginTop: "2px" }}>
                    ⭐ You hold the throne of the realm!
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ═════════════════════════════════════════════════════════════════
          TOP 3 PODIUM CARDS
         ═════════════════════════════════════════════════════════════════ */}
      {topThree.length > 0 && (
        <div>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "9px",
              color: "var(--color-text-muted)",
              letterSpacing: "0.1em",
              marginBottom: "10px",
            }}
          >
            ✦ REALM PODIUM ✦
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1st Place (Center / Highlighted) */}
            {topThree[0] && (
              <PodiumCard
                entry={topThree[0]}
                place={1}
                title="GRAND CHAMPION"
                medal="🥇"
                borderColor="#f59e0b"
                glowColor="rgba(245, 158, 11, 0.4)"
                accentColor="var(--color-gold)"
              />
            )}

            {/* 2nd Place */}
            {topThree[1] && (
              <PodiumCard
                entry={topThree[1]}
                place={2}
                title="SILVER VANGUARD"
                medal="🥈"
                borderColor="#94a3b8"
                glowColor="rgba(148, 163, 184, 0.25)"
                accentColor="#cbd5e1"
              />
            )}

            {/* 3rd Place */}
            {topThree[2] && (
              <PodiumCard
                entry={topThree[2]}
                place={3}
                title="BRONZE PALADIN"
                medal="🥉"
                borderColor="#b45309"
                glowColor="rgba(180, 83, 9, 0.2)"
                accentColor="#d97706"
              />
            )}
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════
          FILTER CONTROLS & SEARCH BAR
         ═════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        {/* Sort Tabs */}
        <div className="flex flex-wrap gap-2">
          {SORT_OPTIONS.map((opt) => {
            const isActive = activeSort === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => handleSortChange(opt.id)}
                className="pixel-btn"
                style={{
                  fontSize: "8px",
                  padding: "8px 12px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: isActive ? "var(--color-primary)" : "var(--color-surface)",
                  borderColor: isActive ? "var(--color-primary-light)" : "var(--color-border)",
                  color: isActive ? "white" : "var(--color-text-muted)",
                }}
              >
                <span>{opt.icon}</span>
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>

        {/* Live Search */}
        <div className="relative" style={{ minWidth: "220px" }}>
          <input
            className="pixel-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search hero..."
            style={{
              fontSize: "9px",
              padding: "8px 28px 8px 10px",
              width: "100%",
            }}
          />
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery("")}
              style={{
                position: "absolute",
                right: "8px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                color: "var(--color-text-muted)",
                cursor: "pointer",
                fontSize: "12px",
              }}
            >
              ✕
            </button>
          ) : (
            <span
              style={{
                position: "absolute",
                right: "8px",
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: "10px",
                pointerEvents: "none",
              }}
            >
              🔍
            </span>
          )}
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════════
          GLOBAL ROSTER TABLE
         ═════════════════════════════════════════════════════════════════ */}
      <div
        className="pixel-card"
        style={{
          padding: 0,
          overflowX: "auto",
          background: "var(--color-surface)",
          border: "2px solid var(--color-border)",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr
              style={{
                borderBottom: "2px solid var(--color-border)",
                background: "var(--color-bg-alt)",
                fontFamily: "var(--font-display)",
                fontSize: "8px",
                color: "var(--color-text-muted)",
                letterSpacing: "0.08em",
              }}
            >
              <th style={{ padding: "12px 14px", width: "70px" }}>RANK</th>
              <th style={{ padding: "12px 14px" }}>HERO</th>
              <th style={{ padding: "12px 14px", width: "100px" }}>LEVEL</th>
              <th style={{ padding: "12px 14px", width: "140px" }}>LIFETIME XP</th>
              <th style={{ padding: "12px 14px", width: "110px" }}>STREAK</th>
              <th style={{ padding: "12px 14px", width: "120px" }}>QUESTS DONE</th>
              <th style={{ padding: "12px 14px", width: "90px" }}>GOLD</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence mode="popLayout">
              {filteredLeaderboard.map((entry, idx) => {
                const isCurrentUser = entry.isCurrentUser;
                const medal =
                  entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : null;

                return (
                  <motion.tr
                    key={entry.userId}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    style={{
                      borderBottom: "1px solid var(--color-border)",
                      background: isCurrentUser
                        ? "rgba(124, 58, 237, 0.12)"
                        : idx % 2 === 0
                        ? "transparent"
                        : "rgba(255, 255, 255, 0.015)",
                      boxShadow: isCurrentUser
                        ? "inset 3px 0 0 var(--color-primary-light)"
                        : "none",
                    }}
                  >
                    {/* Rank */}
                    <td style={{ padding: "14px", whiteSpace: "nowrap" }}>
                      <div className="flex items-center gap-1.5">
                        {medal ? (
                          <span style={{ fontSize: "16px" }}>{medal}</span>
                        ) : (
                          <span
                            style={{
                              fontFamily: "var(--font-display)",
                              fontSize: "10px",
                              color: "var(--color-text-muted)",
                            }}
                          >
                            #{entry.rank}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Adventurer */}
                    <td style={{ padding: "14px" }}>
                      <div className="flex items-center gap-3">
                        <div
                          style={{
                            width: "34px",
                            height: "34px",
                            background: "var(--color-surface-2)",
                            border: `1px solid ${
                              medal ? (entry.rank === 1 ? "#f59e0b" : "#94a3b8") : "var(--color-border)"
                            }`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "18px",
                            flexShrink: 0,
                          }}
                        >
                          {getAvatarIcon(entry.avatarFrame)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              style={{
                                fontFamily: "var(--font-display)",
                                fontSize: "10px",
                                color: isCurrentUser
                                  ? "var(--color-primary-light)"
                                  : "var(--color-text)",
                              }}
                            >
                              {entry.username}
                            </span>
                            {isCurrentUser && (
                              <span
                                style={{
                                  fontSize: "6px",
                                  padding: "1px 4px",
                                  background: "var(--color-primary)",
                                  color: "white",
                                  fontFamily: "var(--font-display)",
                                }}
                              >
                                YOU
                              </span>
                            )}
                          </div>
                          <span
                            style={{
                              fontSize: "8px",
                              color: "var(--color-text-dim)",
                              fontFamily: "var(--font-display)",
                            }}
                          >
                            {entry.avatarFrame ? entry.avatarFrame.replace("frame_", "").toUpperCase() : "ADVENTURER"}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Level */}
                    <td style={{ padding: "14px", whiteSpace: "nowrap" }}>
                      <div>
                        <span
                          style={{
                            fontFamily: "var(--font-display)",
                            fontSize: "10px",
                            color: "var(--color-text)",
                          }}
                        >
                          Lv {entry.level}
                        </span>
                        <p
                          style={{
                            fontSize: "7px",
                            color: "var(--color-text-dim)",
                            fontFamily: "var(--font-display)",
                          }}
                        >
                          {getTierTitle(entry.level)}
                        </p>
                      </div>
                    </td>

                    {/* Lifetime XP */}
                    <td style={{ padding: "14px", whiteSpace: "nowrap" }}>
                      <span
                        style={{
                          fontFamily: "var(--font-display)",
                          fontSize: "10px",
                          color: "var(--color-primary-light)",
                        }}
                      >
                        {entry.totalXp.toLocaleString()} XP
                      </span>
                    </td>

                    {/* Streak */}
                    <td style={{ padding: "14px", whiteSpace: "nowrap" }}>
                      <div className="flex items-center gap-1.5">
                        <span style={{ fontSize: "14px" }}>🔥</span>
                        <div>
                          <span
                            style={{
                              fontFamily: "var(--font-display)",
                              fontSize: "9px",
                              color: entry.currentStreak > 0 ? "var(--color-gold)" : "var(--color-text-muted)",
                            }}
                          >
                            {entry.currentStreak}d
                          </span>
                          <span
                            style={{
                              fontSize: "7px",
                              color: "var(--color-text-dim)",
                              display: "block",
                            }}
                          >
                            Best: {entry.longestStreak}d
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Quests Done */}
                    <td style={{ padding: "14px", whiteSpace: "nowrap" }}>
                      <div className="flex items-center gap-1.5">
                        <span style={{ fontSize: "12px" }}>⚔️</span>
                        <span
                          style={{
                            fontFamily: "var(--font-display)",
                            fontSize: "9px",
                            color: "var(--color-text)",
                          }}
                        >
                          {entry.completedTasksCount} cleared
                        </span>
                      </div>
                    </td>

                    {/* Gold */}
                    <td style={{ padding: "14px", whiteSpace: "nowrap" }}>
                      <span
                        style={{
                          fontFamily: "var(--font-display)",
                          fontSize: "9px",
                          color: "var(--color-gold)",
                        }}
                      >
                        {entry.gold}G
                      </span>
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>

            {filteredLeaderboard.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  style={{
                    padding: "3rem",
                    textAlign: "center",
                    color: "var(--color-text-muted)",
                    fontSize: "11px",
                    fontFamily: "var(--font-display)",
                  }}
                >
                  NO ADVENTURERS FOUND MATCHING &quot;{searchQuery}&quot;
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── PODIUM CARD COMPONENT ────────────────────────────────────────────────────

function PodiumCard({
  entry,
  place,
  title,
  medal,
  borderColor,
  glowColor,
  accentColor,
}: {
  entry: LeaderboardEntry;
  place: number;
  title: string;
  medal: string;
  borderColor: string;
  glowColor: string;
  accentColor: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: place * 0.1 }}
      className="pixel-card"
      style={{
        position: "relative",
        border: `2px solid ${borderColor}`,
        boxShadow: `4px 4px 0px ${borderColor}, 0 0 20px ${glowColor}`,
        background: "var(--color-surface)",
        padding: "1.25rem",
        textAlign: "center",
      }}
    >
      {/* Medal badge */}
      <div
        style={{
          position: "absolute",
          top: "-12px",
          left: "50%",
          transform: "translateX(-50%)",
          background: "var(--color-bg)",
          border: `1px solid ${borderColor}`,
          padding: "2px 8px",
          fontSize: "14px",
          display: "flex",
          alignItems: "center",
          gap: "4px",
        }}
      >
        <span>{medal}</span>
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "7px",
            color: accentColor,
            letterSpacing: "0.1em",
          }}
        >
          #{place}
        </span>
      </div>

      <div className="mt-2">
        <div
          style={{
            width: "56px",
            height: "56px",
            margin: "0 auto",
            background: "var(--color-surface-2)",
            border: `2px solid ${borderColor}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "28px",
            boxShadow: `2px 2px 0 ${borderColor}`,
          }}
        >
          {getAvatarIcon(entry.avatarFrame)}
        </div>

        <h3
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "11px",
            color: accentColor,
            marginTop: "10px",
            letterSpacing: "0.08em",
          }}
        >
          {entry.username}
        </h3>

        <p
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "7px",
            color: "var(--color-text-dim)",
            letterSpacing: "0.1em",
            marginTop: "2px",
          }}
        >
          {title} • LV {entry.level}
        </p>

        {/* Stats banner */}
        <div
          style={{
            marginTop: "12px",
            padding: "8px",
            background: "var(--color-bg-alt)",
            border: "1px solid var(--color-border)",
            display: "flex",
            justifyContent: "space-around",
            alignItems: "center",
          }}
        >
          <div>
            <span
              style={{
                display: "block",
                fontFamily: "var(--font-display)",
                fontSize: "10px",
                color: "var(--color-primary-light)",
              }}
            >
              {entry.totalXp.toLocaleString()}
            </span>
            <span style={{ fontSize: "7px", color: "var(--color-text-dim)" }}>
              XP
            </span>
          </div>

          <div style={{ width: "1px", height: "18px", background: "var(--color-border)" }} />

          <div>
            <span
              style={{
                display: "block",
                fontFamily: "var(--font-display)",
                fontSize: "10px",
                color: "var(--color-gold)",
              }}
            >
              🔥 {entry.currentStreak}d
            </span>
            <span style={{ fontSize: "7px", color: "var(--color-text-dim)" }}>
              STREAK
            </span>
          </div>

          <div style={{ width: "1px", height: "18px", background: "var(--color-border)" }} />

          <div>
            <span
              style={{
                display: "block",
                fontFamily: "var(--font-display)",
                fontSize: "10px",
                color: "var(--color-text)",
              }}
            >
              ⚔️ {entry.completedTasksCount}
            </span>
            <span style={{ fontSize: "7px", color: "var(--color-text-dim)" }}>
              QUESTS
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── SKELETON LOADER ──────────────────────────────────────────────────────────

function LeaderboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-10 bg-[var(--color-surface-2)] rounded w-1/3" />
      <div className="h-24 bg-[var(--color-surface-2)] rounded" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="h-44 bg-[var(--color-surface-2)] rounded" />
        <div className="h-44 bg-[var(--color-surface-2)] rounded" />
        <div className="h-44 bg-[var(--color-surface-2)] rounded" />
      </div>
      <div className="h-64 bg-[var(--color-surface-2)] rounded" />
    </div>
  );
}
