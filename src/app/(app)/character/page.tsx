"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useDashboard, DASHBOARD_KEY } from "@/hooks/useDashboard";
import { AttributeRadarChart } from "@/components/character/AttributeRadarChart";
import { XpBar } from "@/components/ui/XpBar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AchievementCatalogItem } from "@/types";
import toast from "react-hot-toast";
import { sound } from "@/lib/sound";

const ATTRIBUTE_COLORS: Record<string, string> = {
  Strength: "#ef4444",
  Intellect: "#3b82f6",
  Discipline: "#10b981",
  Creativity: "#ec4899",
  Social: "#f59e0b",
};

const ATTRIBUTE_ICONS: Record<string, string> = {
  Strength: "💪",
  Intellect: "🧠",
  Discipline: "⚡",
  Creativity: "🎨",
  Social: "🤝",
};

async function fetchAchievements(): Promise<AchievementCatalogItem[]> {
  const res = await fetch("/api/user/achievements");
  if (!res.ok) throw new Error("Failed to load achievements");
  const json = await res.json();
  return json.data;
}

async function updateCosmetics(payload: {
  equippedTheme?: "pixel-retro" | "cyberpunk";
  avatarFrame?: string | null;
}) {
  const res = await fetch("/api/user/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to equip item");
  return json.data;
}

const AVATAR_OPTIONS = [
  { id: null, label: "Novice Wizard", icon: "🧙" },
  { id: "frame_dragon", label: "Golden Dragon", icon: "🐉" },
  { id: "frame_paladin", label: "Paladin Crest", icon: "🛡️" },
  { id: "frame_ninja", label: "Cyber Ninja", icon: "🥷" },
];

export default function CharacterPage() {
  const qc = useQueryClient();
  const { data: dashboard, isLoading } = useDashboard();
  const { data: achievements = [], isLoading: loadingAch } = useQuery({
    queryKey: ["achievements"],
    queryFn: fetchAchievements,
  });

  const [activeTab, setActiveTab] = useState<"attributes" | "achievements" | "wardrobe">("attributes");

  const { mutate: equip, isPending: equipping } = useMutation({
    mutationFn: updateCosmetics,
    onSuccess: (_, variables) => {
      sound.playPurchase();
      if (variables.equippedTheme) {
        document.documentElement.setAttribute("data-theme", variables.equippedTheme);
        localStorage.setItem("life-rpg-theme", variables.equippedTheme);
      }
      qc.invalidateQueries({ queryKey: DASHBOARD_KEY });
      toast.success("Cosmetics equipped! ✨");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  if (isLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          style={{ width: "40px", height: "40px", border: "3px solid var(--color-border)", borderTopColor: "var(--color-primary)", borderRadius: "50%" }}
        />
      </div>
    );
  }

  if (!dashboard) return null;
  const { user, attributes } = dashboard;

  const currentAvatarIcon = user.avatarFrame ? (
    user.avatarFrame.includes("dragon") ? "🐉" :
    user.avatarFrame.includes("paladin") ? "🛡️" :
    user.avatarFrame.includes("ninja") ? "🥷" : "🧙"
  ) : "🧙";

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6 flex-wrap gap-4"
      >
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(13px, 2vw, 18px)",
            letterSpacing: "0.05em",
          }}
        >
          CHARACTER SHEET
        </h1>

        {/* Tab switcher */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {[
            { id: "attributes", label: "📊 STATS & MAP" },
            { id: "achievements", label: `🏆 BADGES (${unlockedCount}/${achievements.length})` },
            { id: "wardrobe", label: "🎨 WARDROBE" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className="pixel-btn"
              style={{
                fontSize: "8px",
                padding: "8px 12px",
                background: activeTab === tab.id ? "var(--color-primary)" : "var(--color-surface-2)",
                borderColor: activeTab === tab.id ? "var(--color-primary-light)" : "var(--color-border)",
                color: activeTab === tab.id ? "white" : "var(--color-text-muted)",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-6">
        {/* Left Column: Character Profile Summary */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="pixel-card"
          style={{ height: "fit-content" }}
        >
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              style={{
                fontSize: "72px",
                marginBottom: "1rem",
                filter: "drop-shadow(0 4px 12px rgba(124, 58, 237, 0.4))",
              }}
            >
              {currentAvatarIcon}
            </motion.div>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "14px",
                color: "var(--color-text)",
                marginBottom: "4px",
              }}
            >
              {user.username}
            </h2>
            <p style={{ fontFamily: "var(--font-display)", fontSize: "9px", color: "var(--color-secondary)" }}>
              Level {user.level} Adventurer
            </p>
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <XpBar
              progress={user.xpProgress}
              needed={user.xpNeededForNext}
              level={user.level}
              showLabel
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            {[
              { label: "TOTAL XP", value: user.totalXp.toLocaleString(), icon: "⭐" },
              { label: "GOLD",     value: `${user.gold.toLocaleString()}G`, icon: "💰" },
              { label: "THEME",    value: user.equippedTheme.toUpperCase(), icon: "🎨" },
              { label: "JOINED",   value: new Date(user.createdAt).toLocaleDateString(), icon: "📅" },
            ].map(({ label, value, icon }) => (
              <div
                key={label}
                style={{
                  background: "var(--color-bg-alt)",
                  border: "1px solid var(--color-border)",
                  padding: "10px",
                }}
              >
                <p style={{ fontSize: "8px", color: "var(--color-text-dim)", fontFamily: "var(--font-display)", marginBottom: "4px" }}>
                  {icon} {label}
                </p>
                <p
                  style={{
                    fontSize: "11px",
                    color: "var(--color-text)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {value}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Right Column: Tabbed Content */}
        <div>
          {/* 1. Attributes & Radar Tab */}
          {activeTab === "attributes" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="pixel-card"
                style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
              >
                <p style={{ fontFamily: "var(--font-display)", fontSize: "8px", color: "var(--color-text-muted)", letterSpacing: "0.1em", marginBottom: "1rem", alignSelf: "flex-start" }}>
                  🗺️ ATTRIBUTE RADAR
                </p>
                <AttributeRadarChart attributes={attributes} size={230} />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="pixel-card"
              >
                <p style={{ fontFamily: "var(--font-display)", fontSize: "8px", color: "var(--color-text-muted)", letterSpacing: "0.1em", marginBottom: "1rem" }}>
                  📊 ATTRIBUTE BREAKDOWN
                </p>
                <div className="flex flex-col gap-3">
                  {attributes.map((attr, i) => {
                    const color = ATTRIBUTE_COLORS[attr.attribute] ?? "var(--color-primary)";
                    const pct = attr.xpNeededForNext > 0
                      ? Math.min((attr.xpProgress / attr.xpNeededForNext) * 100, 100)
                      : 0;

                    return (
                      <div key={attr.attribute}>
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center gap-2">
                            <span style={{ fontSize: "14px" }}>{ATTRIBUTE_ICONS[attr.attribute]}</span>
                            <span style={{ fontFamily: "var(--font-display)", fontSize: "8px", color }}>
                              {attr.attribute.toUpperCase()}
                            </span>
                          </div>
                          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                            <span style={{ fontSize: "10px", color: "var(--color-text-dim)" }}>
                              {attr.xpProgress}/{attr.xpNeededForNext} XP
                            </span>
                            <span style={{ fontFamily: "var(--font-display)", fontSize: "8px", color }}>
                              Lv.{attr.level}
                            </span>
                          </div>
                        </div>
                        <div style={{ height: "8px", background: "var(--color-bg)", border: `1px solid ${color}44`, overflow: "hidden" }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ type: "spring", stiffness: 60, damping: 20, delay: 0.2 + i * 0.08 }}
                            style={{ height: "100%", background: color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            </div>
          )}

          {/* 2. Achievements Gallery Tab */}
          {activeTab === "achievements" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="pixel-card"
            >
              <div className="flex items-center justify-between mb-4">
                <p style={{ fontFamily: "var(--font-display)", fontSize: "9px", color: "var(--color-text-muted)", letterSpacing: "0.1em" }}>
                  🏆 ACHIEVEMENTS & MEDALS
                </p>
                <span style={{ fontFamily: "var(--font-display)", fontSize: "8px", color: "var(--color-gold)" }}>
                  {unlockedCount} / {achievements.length} UNLOCKED
                </span>
              </div>

              {loadingAch ? (
                <div className="flex flex-col gap-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} style={{ height: "64px", background: "var(--color-surface-2)", border: "1px solid var(--color-border)" }} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {achievements.map((ach) => (
                    <div
                      key={ach.id}
                      style={{
                        padding: "12px",
                        background: ach.unlocked ? "var(--color-surface-2)" : "var(--color-bg-alt)",
                        border: `2px solid ${ach.unlocked ? "var(--color-gold)" : "var(--color-border)"}`,
                        boxShadow: ach.unlocked ? "0 0 12px var(--color-gold)33" : "none",
                        opacity: ach.unlocked ? 1 : 0.65,
                        display: "flex",
                        gap: "12px",
                        alignItems: "center",
                      }}
                    >
                      <div
                        style={{
                          width: "36px",
                          height: "36px",
                          background: ach.unlocked ? "var(--color-gold)22" : "var(--color-bg)",
                          border: `1px solid ${ach.unlocked ? "var(--color-gold)" : "var(--color-border)"}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "18px",
                          flexShrink: 0,
                        }}
                      >
                        {ach.unlocked ? "🏆" : "🔒"}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h4
                            style={{
                              fontFamily: "var(--font-display)",
                              fontSize: "8px",
                              color: ach.unlocked ? "var(--color-gold)" : "var(--color-text)",
                            }}
                          >
                            {ach.title}
                          </h4>
                          {ach.xpBonus > 0 && (
                            <span
                              style={{
                                fontFamily: "var(--font-display)",
                                fontSize: "7px",
                                color: "var(--color-primary-light)",
                              }}
                            >
                              +{ach.xpBonus} XP
                            </span>
                          )}
                        </div>

                        <p style={{ fontSize: "11px", color: "var(--color-text-muted)", marginBottom: "4px" }}>
                          {ach.description}
                        </p>

                        {/* Progress indicator */}
                        {!ach.unlocked ? (
                          <div>
                            <div className="flex justify-between" style={{ fontSize: "8px", color: "var(--color-text-dim)", marginBottom: "2px" }}>
                              <span>Progress</span>
                              <span>{ach.progress.current} / {ach.progress.threshold} ({ach.progress.percentage}%)</span>
                            </div>
                            <div style={{ height: "4px", background: "var(--color-bg)", border: "1px solid var(--color-border)" }}>
                              <div
                                style={{
                                  height: "100%",
                                  width: `${ach.progress.percentage}%`,
                                  background: "var(--color-primary)",
                                }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span style={{ fontSize: "9px", color: "var(--color-accent)", fontFamily: "var(--font-display)" }}>
                            ✓ Unlocked {ach.unlockedAt ? new Date(ach.unlockedAt).toLocaleDateString() : ""}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* 3. Wardrobe & Cosmetics Tab */}
          {activeTab === "wardrobe" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="pixel-card"
            >
              <p style={{ fontFamily: "var(--font-display)", fontSize: "9px", color: "var(--color-text-muted)", letterSpacing: "0.1em", marginBottom: "1.5rem" }}>
                🎨 COSMETICS & THEMES
              </p>

              {/* Theme Selection */}
              <div style={{ marginBottom: "2rem" }}>
                <h4 style={{ fontFamily: "var(--font-display)", fontSize: "8px", color: "var(--color-text)", marginBottom: "8px" }}>
                  INTERFACE THEME
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  {[
                    { id: "pixel-retro" as const, name: "Pixel Retro", desc: "16-bit JRPG nostalgia. Dark violet & amber." },
                    { id: "cyberpunk" as const, name: "Cyberpunk Neon", desc: "High-tech dystopia. Cyan & magenta glow." },
                  ].map((t) => {
                    const isEquipped = user.equippedTheme === t.id;
                    return (
                      <div
                        key={t.id}
                        style={{
                          padding: "12px",
                          background: isEquipped ? "var(--color-primary)22" : "var(--color-bg-alt)",
                          border: `2px solid ${isEquipped ? "var(--color-primary)" : "var(--color-border)"}`,
                        }}
                      >
                        <h5 style={{ fontFamily: "var(--font-display)", fontSize: "8px", color: "var(--color-text)", marginBottom: "4px" }}>
                          {t.name}
                        </h5>
                        <p style={{ fontSize: "10px", color: "var(--color-text-muted)", marginBottom: "10px" }}>
                          {t.desc}
                        </p>
                        <button
                          onClick={() => !isEquipped && equip({ equippedTheme: t.id })}
                          disabled={isEquipped || equipping}
                          className={`pixel-btn ${isEquipped ? "" : "pixel-btn-primary"}`}
                          style={{
                            fontSize: "7px",
                            padding: "6px 12px",
                            width: "100%",
                            cursor: isEquipped ? "default" : "pointer",
                          }}
                        >
                          {isEquipped ? "EQUIPPED ✓" : "EQUIP"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Avatar Frame Selection */}
              <div>
                <h4 style={{ fontFamily: "var(--font-display)", fontSize: "8px", color: "var(--color-text)", marginBottom: "8px" }}>
                  AVATAR CREST / FRAME
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
                  {AVATAR_OPTIONS.map((av) => {
                    const isEquipped = user.avatarFrame === av.id;
                    return (
                      <div
                        key={av.label}
                        style={{
                          padding: "12px",
                          background: isEquipped ? "var(--color-primary)22" : "var(--color-bg-alt)",
                          border: `2px solid ${isEquipped ? "var(--color-primary)" : "var(--color-border)"}`,
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                        }}
                      >
                        <span style={{ fontSize: "32px" }}>{av.icon}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h5 style={{ fontFamily: "var(--font-display)", fontSize: "8px", color: "var(--color-text)", marginBottom: "6px" }}>
                            {av.label}
                          </h5>
                          <button
                            onClick={() => !isEquipped && equip({ avatarFrame: av.id })}
                            disabled={isEquipped || equipping}
                            className={`pixel-btn ${isEquipped ? "" : "pixel-btn-primary"}`}
                            style={{
                              fontSize: "7px",
                              padding: "4px 8px",
                              cursor: isEquipped ? "default" : "pointer",
                            }}
                          >
                            {isEquipped ? "EQUIPPED" : "EQUIP"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
