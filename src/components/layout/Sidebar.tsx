"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { motion } from "framer-motion";
import { useDashboard } from "@/hooks/useDashboard";
import { XpBar } from "@/components/ui/XpBar";
import { sound } from "@/lib/sound";
import { useSyncStatus } from "@/hooks/useSyncStatus";

const NAV_ITEMS = [
  { href: "/dashboard",   label: "DASHBOARD",   icon: "🏰" },
  { href: "/tasks",       label: "QUESTS",      icon: "⚔️" },
  { href: "/leaderboard", label: "LEADERBOARD", icon: "🏆" },
  { href: "/character",   label: "CHARACTER",   icon: "🧙" },
  { href: "/shop",        label: "SHOP",        icon: "🏪" },
  { href: "/history",     label: "HISTORY",     icon: "📜" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: dashboard } = useDashboard();
  const user = dashboard?.user;
  const { isOnline, pendingCount, isSyncing, retrySync } = useSyncStatus();

  const [soundOn, setSoundOn] = useState(true);
  const [currentTheme, setCurrentTheme] = useState<"pixel-retro" | "cyberpunk">("pixel-retro");

  useEffect(() => {
    setSoundOn(sound.isEnabled());
    if (typeof window !== "undefined") {
      const active = (document.documentElement.getAttribute("data-theme") as "pixel-retro" | "cyberpunk") || "pixel-retro";
      setCurrentTheme(active);
    }
  }, []);

  const handleToggleSound = () => {
    const next = sound.toggle();
    setSoundOn(next);
    if (next) sound.playClick();
  };

  const handleToggleTheme = () => {
    const next = currentTheme === "pixel-retro" ? "cyberpunk" : "pixel-retro";
    setCurrentTheme(next);
    if (typeof window !== "undefined") {
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("life-rpg-theme", next);
    }
    sound.playClick();
  };

  return (
    <nav className="sidebar" role="navigation" aria-label="Main navigation">
      {/* Logo */}
      <div
        style={{
          padding: "1.5rem 1.25rem",
          borderBottom: "2px solid var(--color-border)",
        }}
      >
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "11px",
            color: "var(--color-primary-light)",
            letterSpacing: "0.1em",
            textShadow: "2px 2px 0 var(--color-primary)",
          }}
        >
          LIFE RPG
        </h1>
        <div className="flex items-center justify-between mt-1">
          <p style={{ fontSize: "9px", color: "var(--color-text-dim)" }}>
            v1.0
          </p>

          {/* Sync status indicator */}
          <div
            onClick={() => {
              if (pendingCount > 0) retrySync();
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "2px 6px",
              background: !isOnline
                ? "#ef444422"
                : isSyncing
                ? "#f59e0b22"
                : "#10b98122",
              border: `1px solid ${
                !isOnline
                  ? "#ef4444"
                  : isSyncing
                  ? "#f59e0b"
                  : "#10b981"
              }`,
              fontSize: "7px",
              fontFamily: "var(--font-display)",
              color: !isOnline
                ? "#ef4444"
                : isSyncing
                ? "#f59e0b"
                : "#10b981",
              cursor: pendingCount > 0 ? "pointer" : "default",
            }}
            title={
              !isOnline
                ? `Offline - ${pendingCount} actions queued`
                : isSyncing
                ? "Syncing outbox..."
                : "System Online & Authoritative"
            }
          >
            <span
              style={{
                width: "5px",
                height: "5px",
                borderRadius: "50%",
                background: !isOnline
                  ? "#ef4444"
                  : isSyncing
                  ? "#f59e0b"
                  : "#10b981",
                display: "inline-block",
              }}
            />
            <span>
              {!isOnline
                ? `OFFLINE (${pendingCount})`
                : isSyncing
                ? "SYNCING"
                : "ONLINE"}
            </span>
          </div>
        </div>
      </div>

      {/* User snapshot */}
      {user && (
        <div
          style={{
            padding: "1rem 1.25rem",
            borderBottom: "2px solid var(--color-border)",
          }}
        >
          {/* Avatar frame */}
          <div className="flex items-center gap-3 mb-3">
            <div
              style={{
                width: "42px",
                height: "42px",
                background: "var(--color-primary)",
                border: "2px solid var(--color-primary-light)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
                flexShrink: 0,
              }}
            >
              {user.avatarFrame ? (
                user.avatarFrame.includes("dragon") ? "🐉" :
                user.avatarFrame.includes("paladin") ? "🛡️" :
                user.avatarFrame.includes("ninja") ? "🥷" : "🧙"
              ) : (
                "🧙"
              )}
            </div>
            <div style={{ minWidth: 0 }}>
              <p
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "8px",
                  color: "var(--color-text)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {user.username}
              </p>
              <p
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "7px",
                  color: "var(--color-secondary)",
                  marginTop: "2px",
                }}
              >
                LVL {user.level}
              </p>
            </div>
          </div>

          {/* Mini XP bar */}
          <XpBar
            progress={user.xpProgress}
            needed={user.xpNeededForNext}
            level={user.level}
            showLabel={false}
            height={8}
          />

          {/* Gold */}
          <div className="flex items-center gap-2 mt-2">
            <span style={{ fontSize: "12px" }}>💰</span>
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "8px",
                color: "var(--color-gold)",
              }}
            >
              {user.gold.toLocaleString()} G
            </span>
          </div>
        </div>
      )}

      {/* Nav links */}
      <ul style={{ listStyle: "none", padding: "0.5rem 0", flex: 1 }}>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "12px 1.25rem",
                  textDecoration: "none",
                  position: "relative",
                  background: isActive ? "var(--color-surface)" : "transparent",
                  borderLeft: isActive
                    ? "3px solid var(--color-primary)"
                    : "3px solid transparent",
                  transition: "background 0.15s, border-color 0.15s",
                }}
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "var(--color-primary)11",
                    }}
                  />
                )}
                <span style={{ fontSize: "14px", position: "relative", zIndex: 1 }}>
                  {item.icon}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "8px",
                    color: isActive ? "var(--color-primary-light)" : "var(--color-text-muted)",
                    letterSpacing: "0.08em",
                    position: "relative",
                    zIndex: 1,
                    transition: "color 0.15s",
                  }}
                >
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Retro Tools & Preferences */}
      <div
        style={{
          padding: "0.75rem 1.25rem",
          borderTop: "2px solid var(--color-border)",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
          {/* Sound Toggle */}
          <button
            onClick={handleToggleSound}
            className="pixel-btn"
            style={{
              fontSize: "7px",
              padding: "6px",
              textAlign: "center",
              color: soundOn ? "var(--color-accent-light)" : "var(--color-text-dim)",
            }}
            title="Toggle 8-bit Synthesizer Audio"
          >
            {soundOn ? "🔊 ON" : "🔇 OFF"}
          </button>

          {/* Theme Switcher */}
          <button
            onClick={handleToggleTheme}
            className="pixel-btn"
            style={{
              fontSize: "7px",
              padding: "6px",
              textAlign: "center",
              color: currentTheme === "cyberpunk" ? "var(--color-primary)" : "var(--color-secondary)",
            }}
            title="Toggle Theme: Pixel Retro / Cyberpunk"
          >
            {currentTheme === "cyberpunk" ? "⚡ CYBER" : "🎮 RETRO"}
          </button>
        </div>

        {/* Sign out */}
        <button
          onClick={() => signOut({ callbackUrl: "/auth/login" })}
          className="pixel-btn"
          style={{ width: "100%", fontSize: "8px", padding: "8px" }}
        >
          SIGN OUT
        </button>
      </div>
    </nav>
  );
}
