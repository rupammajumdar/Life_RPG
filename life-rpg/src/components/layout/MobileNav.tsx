"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { useDashboard } from "@/hooks/useDashboard";
import { XpBar } from "@/components/ui/XpBar";
import { sound } from "@/lib/sound";
import { useSyncStatus } from "@/hooks/useSyncStatus";

const NAV_ITEMS = [
  { href: "/dashboard",   label: "DASH",   icon: "🏰" },
  { href: "/tasks",       label: "QUESTS", icon: "⚔️" },
  { href: "/leaderboard", label: "RANKS",  icon: "🏆" },
  { href: "/character",   label: "HERO",   icon: "🧙" },
  { href: "/shop",        label: "SHOP",   icon: "🏪" },
  { href: "/history",     label: "LOG",    icon: "📜" },
];

export function MobileNav() {
  const pathname = usePathname();
  const { data: dashboard } = useDashboard();
  const user = dashboard?.user;
  const streak = dashboard?.streak;
  const { isOnline, pendingCount, isSyncing, retrySync } = useSyncStatus();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [currentTheme, setCurrentTheme] = useState<"pixel-retro" | "cyberpunk">("pixel-retro");

  useEffect(() => {
    setSoundOn(sound.isEnabled());
    if (typeof window !== "undefined") {
      const active =
        (document.documentElement.getAttribute("data-theme") as "pixel-retro" | "cyberpunk") ||
        "pixel-retro";
      setCurrentTheme(active);
    }
  }, []);

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

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

  const avatarIcon = user?.avatarFrame
    ? user.avatarFrame.includes("dragon")
      ? "🐉"
      : user.avatarFrame.includes("paladin")
      ? "🛡️"
      : user.avatarFrame.includes("ninja")
      ? "🥷"
      : "🧙"
    : "🧙";

  return (
    <>
      {/* ═════════════════════════════════════════════════════════════════
          MOBILE TOP BAR (Visible only on screens < 768px)
         ═════════════════════════════════════════════════════════════════ */}
      <header
        className="md:hidden sticky top-0 z-40 flex items-center justify-between px-3 py-2.5"
        style={{
          background: "var(--color-bg-alt)",
          borderBottom: "2px solid var(--color-border)",
          backdropFilter: "blur(10px)",
        }}
      >
        {/* Left: Brand + Drawer trigger */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              sound.playClick();
              setDrawerOpen(true);
            }}
            className="pixel-btn"
            style={{
              padding: "4px 8px",
              fontSize: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            aria-label="Open Realm Menu"
          >
            ☰
          </button>
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 no-underline"
            onClick={() => sound.playClick()}
          >
            <span style={{ fontSize: "14px" }}>⚔️</span>
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "11px",
                color: "var(--color-primary-light)",
                letterSpacing: "0.1em",
                textShadow: "1px 1px 0 var(--color-primary)",
              }}
            >
              LIFE RPG
            </span>
          </Link>
        </div>

        {/* Right: Quick actions & player pill */}
        <div className="flex items-center gap-1.5">
          {/* Quick Sound Toggle */}
          <button
            onClick={handleToggleSound}
            className="pixel-btn"
            style={{
              padding: "4px 6px",
              fontSize: "10px",
              lineHeight: 1,
            }}
            title="Toggle Sound"
          >
            {soundOn ? "🔊" : "🔇"}
          </button>

          {/* Quick Theme Toggle */}
          <button
            onClick={handleToggleTheme}
            className="pixel-btn"
            style={{
              padding: "4px 6px",
              fontSize: "10px",
              lineHeight: 1,
            }}
            title="Toggle Theme"
          >
            {currentTheme === "cyberpunk" ? "⚡" : "🎮"}
          </button>

          {/* Player avatar / level pill */}
          {user && (
            <button
              onClick={() => {
                sound.playClick();
                setDrawerOpen(true);
              }}
              style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-primary)",
                padding: "2px 6px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                cursor: "pointer",
              }}
            >
              <span style={{ fontSize: "14px" }}>{avatarIcon}</span>
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "8px",
                  color: "var(--color-secondary)",
                }}
              >
                Lv{user.level}
              </span>
            </button>
          )}
        </div>
      </header>

      {/* ═════════════════════════════════════════════════════════════════
          MOBILE BOTTOM NAVIGATION BAR (Fixed at bottom for phones)
         ═════════════════════════════════════════════════════════════════ */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around"
        style={{
          background: "var(--color-bg-alt)",
          borderTop: "2px solid var(--color-border)",
          boxShadow: "0 -4px 16px rgba(0, 0, 0, 0.4)",
          paddingBottom: "max(6px, env(safe-area-inset-bottom, 6px))",
          paddingTop: "6px",
        }}
        aria-label="Mobile navigation"
      >
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => sound.playClick()}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                flex: 1,
                padding: "4px 2px",
                textDecoration: "none",
                position: "relative",
                color: isActive ? "var(--color-primary-light)" : "var(--color-text-muted)",
              }}
            >
              {isActive && (
                <motion.div
                  layoutId="mobile-nav-indicator"
                  style={{
                    position: "absolute",
                    top: "-6px",
                    left: "20%",
                    right: "20%",
                    height: "3px",
                    background: "var(--color-primary-light)",
                    boxShadow: "0 0 8px var(--color-primary)",
                  }}
                />
              )}
              <span
                style={{
                  fontSize: "16px",
                  lineHeight: 1,
                  filter: isActive ? "drop-shadow(0 0 4px var(--color-primary))" : "none",
                }}
              >
                {item.icon}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "7px",
                  letterSpacing: "0.04em",
                  marginTop: "3px",
                  fontWeight: isActive ? "bold" : "normal",
                }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* ═════════════════════════════════════════════════════════════════
          MOBILE SLIDE-OUT DRAWER / REALM MENU
         ═════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0, 0, 0, 0.75)",
                backdropFilter: "blur(3px)",
                zIndex: 150,
              }}
            />

            {/* Slide-out Panel */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              style={{
                position: "fixed",
                top: 0,
                bottom: 0,
                left: 0,
                width: "min(320px, 86vw)",
                background: "var(--color-surface)",
                borderRight: "2px solid var(--color-primary)",
                boxShadow: "8px 0 24px rgba(0, 0, 0, 0.6)",
                zIndex: 151,
                display: "flex",
                flexDirection: "column",
                overflowY: "auto",
              }}
            >
              {/* Drawer Header */}
              <div
                style={{
                  padding: "1.25rem 1rem",
                  borderBottom: "2px solid var(--color-border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "var(--color-bg-alt)",
                }}
              >
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: "16px" }}>⚔️</span>
                  <div>
                    <h2
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "11px",
                        color: "var(--color-primary-light)",
                        letterSpacing: "0.1em",
                      }}
                    >
                      LIFE RPG
                    </h2>
                    <p style={{ fontSize: "8px", color: "var(--color-text-dim)" }}>
                      MOBILE COMPANION
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--color-text-muted)",
                    fontSize: "18px",
                    cursor: "pointer",
                    padding: "4px 8px",
                  }}
                >
                  ✕
                </button>
              </div>

              {/* User profile card */}
              {user && (
                <div
                  style={{
                    padding: "1rem",
                    borderBottom: "1px solid var(--color-border)",
                    background: "rgba(124, 58, 237, 0.06)",
                  }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      style={{
                        width: "44px",
                        height: "44px",
                        background: "var(--color-surface-2)",
                        border: "2px solid var(--color-primary-light)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "22px",
                        boxShadow: "2px 2px 0 var(--color-primary)",
                      }}
                    >
                      {avatarIcon}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p
                        style={{
                          fontFamily: "var(--font-display)",
                          fontSize: "10px",
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
                          fontSize: "8px",
                          color: "var(--color-secondary)",
                          marginTop: "2px",
                        }}
                      >
                        LEVEL {user.level}
                      </p>
                    </div>
                  </div>

                  {/* XP Bar */}
                  <XpBar
                    progress={user.xpProgress}
                    needed={user.xpNeededForNext}
                    level={user.level}
                    showLabel={false}
                    height={8}
                  />

                  {/* Gold & Streak chips */}
                  <div className="flex items-center justify-between mt-3 text-center gap-2">
                    <div
                      style={{
                        flex: 1,
                        background: "var(--color-bg-alt)",
                        border: "1px solid var(--color-border)",
                        padding: "6px 4px",
                      }}
                    >
                      <span style={{ fontSize: "10px" }}>💰</span>
                      <p
                        style={{
                          fontFamily: "var(--font-display)",
                          fontSize: "8px",
                          color: "var(--color-gold)",
                          marginTop: "2px",
                        }}
                      >
                        {user.gold.toLocaleString()} G
                      </p>
                    </div>

                    <div
                      style={{
                        flex: 1,
                        background: "var(--color-bg-alt)",
                        border: "1px solid var(--color-border)",
                        padding: "6px 4px",
                      }}
                    >
                      <span style={{ fontSize: "10px" }}>🔥</span>
                      <p
                        style={{
                          fontFamily: "var(--font-display)",
                          fontSize: "8px",
                          color: "var(--color-streak)",
                          marginTop: "2px",
                        }}
                      >
                        {streak?.currentStreak ?? 0} DAYS
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Sync Status bar */}
              <div
                onClick={() => {
                  if (pendingCount > 0) retrySync();
                }}
                style={{
                  padding: "8px 12px",
                  margin: "8px 12px 0 12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: !isOnline ? "#ef444415" : isSyncing ? "#f59e0b15" : "#10b98115",
                  border: `1px solid ${!isOnline ? "#ef4444" : isSyncing ? "#f59e0b" : "#10b981"}`,
                  fontSize: "7px",
                  fontFamily: "var(--font-display)",
                  cursor: pendingCount > 0 ? "pointer" : "default",
                }}
              >
                <div className="flex items-center gap-2">
                  <span
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: !isOnline ? "#ef4444" : isSyncing ? "#f59e0b" : "#10b981",
                      display: "inline-block",
                    }}
                  />
                  <span style={{ color: !isOnline ? "#ef4444" : isSyncing ? "#f59e0b" : "#10b981" }}>
                    {!isOnline ? "OFFLINE" : isSyncing ? "SYNCING..." : "REALM CONNECTED"}
                  </span>
                </div>
                {pendingCount > 0 && (
                  <span style={{ color: "#f59e0b" }}>({pendingCount} queued)</span>
                )}
              </div>

              {/* Drawer Links */}
              <ul style={{ listStyle: "none", padding: "0.75rem 0", flex: 1 }}>
                {NAV_ITEMS.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => sound.playClick()}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          padding: "12px 1rem",
                          textDecoration: "none",
                          background: isActive ? "rgba(124, 58, 237, 0.15)" : "transparent",
                          borderLeft: isActive ? "3px solid var(--color-primary-light)" : "3px solid transparent",
                          color: isActive ? "var(--color-primary-light)" : "var(--color-text)",
                        }}
                      >
                        <span style={{ fontSize: "16px" }}>{item.icon}</span>
                        <span
                          style={{
                            fontFamily: "var(--font-display)",
                            fontSize: "9px",
                            letterSpacing: "0.08em",
                          }}
                        >
                          {item.label === "DASH"
                            ? "DASHBOARD"
                            : item.label === "RANKS"
                            ? "LEADERBOARD"
                            : item.label === "HERO"
                            ? "CHARACTER SHEET"
                            : item.label === "LOG"
                            ? "AUDIT HISTORY"
                            : item.label}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>

              {/* Drawer Footer Actions */}
              <div
                style={{
                  padding: "1rem",
                  borderTop: "2px solid var(--color-border)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  background: "var(--color-bg-alt)",
                }}
              >
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                  <button
                    onClick={handleToggleSound}
                    className="pixel-btn"
                    style={{ fontSize: "8px", padding: "8px" }}
                  >
                    {soundOn ? "🔊 SOUND ON" : "🔇 SOUND OFF"}
                  </button>
                  <button
                    onClick={handleToggleTheme}
                    className="pixel-btn"
                    style={{ fontSize: "8px", padding: "8px" }}
                  >
                    {currentTheme === "cyberpunk" ? "⚡ CYBER" : "🎮 RETRO"}
                  </button>
                </div>

                <button
                  onClick={() => signOut({ callbackUrl: "/auth/login" })}
                  className="pixel-btn"
                  style={{
                    width: "100%",
                    fontSize: "8px",
                    padding: "10px",
                    background: "rgba(239, 68, 68, 0.1)",
                    borderColor: "#ef4444",
                    color: "#f87171",
                  }}
                >
                  🚪 SIGN OUT
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
