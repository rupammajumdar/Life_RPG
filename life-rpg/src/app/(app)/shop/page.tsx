"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { v4 as uuidv4 } from "uuid";
import { useDashboard } from "@/hooks/useDashboard";
import { DASHBOARD_KEY } from "@/hooks/useDashboard";
import { DashboardData, ShopItemData } from "@/types";
import { sound } from "@/lib/sound";

async function fetchShop(): Promise<{ items: ShopItemData[]; gold: number; userLevel: number }> {
  const res = await fetch("/api/shop");
  if (!res.ok) throw new Error("Failed to load shop");
  const json = await res.json();
  return json.data;
}

async function purchaseItem(shopItemId: string): Promise<{ newGold: number }> {
  const res = await fetch("/api/shop/purchase", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ shopItemId, clientRequestId: uuidv4() }),
  });
  const json = await res.json();
  if (!res.ok) throw Object.assign(new Error(json.error ?? "Purchase failed"), { status: res.status });
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

const TYPE_LABELS: Record<string, string> = {
  theme: "🎨 Theme", avatar_frame: "🖼️ Avatar", badge: "🏆 Badge", streak_freeze: "🧊 Freeze",
};

export default function ShopPage() {
  const qc = useQueryClient();
  const { data: shop, isLoading } = useQuery({ queryKey: ["shop"], queryFn: fetchShop });
  const { data: dashboard } = useDashboard();
  const [filter, setFilter] = useState<string>("all");

  const { mutate: buy, isPending: buying } = useMutation({
    mutationFn: purchaseItem,
    onSuccess: (result) => {
      sound.playPurchase();
      // Update gold in dashboard cache
      qc.setQueryData<DashboardData>(DASHBOARD_KEY, (old) =>
        old ? { ...old, user: { ...old.user, gold: result.newGold } } : old
      );
      qc.invalidateQueries({ queryKey: ["shop"] });
      toast.success("Purchase successful! 🛍️");
    },
    onError: (err: Error & { status?: number }) => {
      if (err.status === 402) toast.error("Not enough Gold! Complete more quests. 💰");
      else if (err.status === 400) toast.error(err.message);
      else if (err.status === 409) toast("You already own this item.", { icon: "ℹ️" });
      else toast.error("Purchase failed. Try again.");
    },
  });

  const { mutate: equip, isPending: equipping } = useMutation({
    mutationFn: updateCosmetics,
    onSuccess: (_, variables) => {
      sound.playPurchase();
      if (variables.equippedTheme) {
        document.documentElement.setAttribute("data-theme", variables.equippedTheme);
        localStorage.setItem("life-rpg-theme", variables.equippedTheme);
      }
      qc.invalidateQueries({ queryKey: DASHBOARD_KEY });
      toast.success("Cosmetic equipped! ✨");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const gold = dashboard?.user.gold ?? shop?.gold ?? 0;
  const userLevel = dashboard?.user.level ?? shop?.userLevel ?? 1;

  const items = shop?.items ?? [];
  const filtered = filter === "all" ? items : items.filter((i) => i.type === filter);

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto" }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(13px, 2vw, 18px)", letterSpacing: "0.05em" }}>
          🏪 BAZAAR & SHOP
        </h1>
        <div
          style={{
            background: "var(--color-surface)",
            border: "2px solid var(--color-gold)",
            padding: "8px 16px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span style={{ fontSize: "16px" }}>💰</span>
          <span style={{ fontFamily: "var(--font-display)", fontSize: "11px", color: "var(--color-gold)" }}>
            {gold.toLocaleString()} G
          </span>
        </div>
      </motion.div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {["all", "theme", "avatar_frame", "badge", "streak_freeze"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="pixel-btn"
            style={{
              fontSize: "8px",
              padding: "8px 12px",
              background: filter === f ? "var(--color-primary)" : "var(--color-surface-2)",
              borderColor: filter === f ? "var(--color-primary-light)" : "var(--color-border)",
              color: filter === f ? "white" : "var(--color-text-muted)",
            }}
          >
            {f === "all" ? "ALL" : TYPE_LABELS[f] ?? f.toUpperCase()}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "1rem" }}>
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={i}
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
              style={{ height: "200px", background: "var(--color-surface)", border: "2px solid var(--color-border)" }}
            />
          ))}
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "1rem" }}>
            {filtered.map((item, i) => {
              const locked = item.requiredLevel !== null && userLevel < item.requiredLevel;
              const canAfford = gold >= item.goldCost;

              // Check if currently equipped
              const isEquippedTheme = item.type === "theme" && item.itemKey === "theme_cyberpunk" && dashboard?.user.equippedTheme === "cyberpunk";
              const isEquippedFrame = item.type === "avatar_frame" && dashboard?.user.avatarFrame === item.itemKey;
              const isCurrentlyActive = isEquippedTheme || isEquippedFrame;

              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25, delay: i * 0.05 }}
                  className="pixel-card"
                  style={{
                    opacity: locked ? 0.5 : 1,
                    position: "relative",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  {item.owned && (
                    <div
                      style={{
                        position: "absolute",
                        top: "8px",
                        right: "8px",
                        background: isCurrentlyActive ? "var(--color-accent)" : "var(--color-surface-2)",
                        border: `1px solid ${isCurrentlyActive ? "var(--color-accent-light)" : "var(--color-border)"}`,
                        padding: "2px 8px",
                        fontFamily: "var(--font-display)",
                        fontSize: "7px",
                        color: isCurrentlyActive ? "white" : "var(--color-text-muted)",
                      }}
                    >
                      {isCurrentlyActive ? "ACTIVE ✓" : "OWNED"}
                    </div>
                  )}

                  <div style={{ fontSize: "36px", marginBottom: "0.75rem", textAlign: "center" }}>
                    {item.type === "theme" && "🎨"}
                    {item.type === "avatar_frame" && (
                      item.itemKey.includes("dragon") ? "🐉" :
                      item.itemKey.includes("paladin") ? "🛡️" :
                      item.itemKey.includes("ninja") ? "🥷" : "🖼️"
                    )}
                    {item.type === "badge" && "🏆"}
                    {item.type === "streak_freeze" && "🧊"}
                  </div>

                  <h3
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "9px",
                      color: "var(--color-text)",
                      marginBottom: "6px",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {item.name}
                  </h3>
                  <p style={{ fontSize: "11px", color: "var(--color-text-muted)", marginBottom: "1rem", lineHeight: 1.5, flex: 1 }}>
                    {item.description}
                  </p>

                  {locked && (
                    <p style={{ fontSize: "9px", color: "#f87171", marginBottom: "8px", fontFamily: "var(--font-display)" }}>
                      🔒 Requires Lv.{item.requiredLevel}
                    </p>
                  )}

                  <div className="flex items-center justify-between mt-auto pt-2 border-t border-dashed" style={{ borderColor: "var(--color-border)" }}>
                    <span
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "10px",
                        color: "var(--color-gold)",
                      }}
                    >
                      💰 {item.goldCost}G
                    </span>

                    {!item.owned ? (
                      <motion.button
                        whileTap={!locked && canAfford ? { scale: 0.95 } : {}}
                        onClick={() => !locked && canAfford && buy(item.id)}
                        disabled={locked || !canAfford || buying}
                        className={`pixel-btn ${!locked && canAfford ? "pixel-btn-gold" : ""}`}
                        style={{
                          fontSize: "8px",
                          padding: "8px 12px",
                          opacity: locked || !canAfford ? 0.5 : 1,
                          cursor: locked || !canAfford ? "not-allowed" : "pointer",
                        }}
                      >
                        {!canAfford ? "BROKE 😅" : buying ? "..." : "BUY"}
                      </motion.button>
                    ) : (
                      item.type === "theme" ? (
                        <button
                          onClick={() => {
                            if (!isCurrentlyActive) equip({ equippedTheme: "cyberpunk" });
                          }}
                          disabled={isCurrentlyActive || equipping}
                          className={`pixel-btn ${isCurrentlyActive ? "" : "pixel-btn-primary"}`}
                          style={{ fontSize: "7px", padding: "6px 10px" }}
                        >
                          {isCurrentlyActive ? "EQUIPPED" : "EQUIP"}
                        </button>
                      ) : item.type === "avatar_frame" ? (
                        <button
                          onClick={() => {
                            if (!isCurrentlyActive) equip({ avatarFrame: item.itemKey });
                          }}
                          disabled={isCurrentlyActive || equipping}
                          className={`pixel-btn ${isCurrentlyActive ? "" : "pixel-btn-primary"}`}
                          style={{ fontSize: "7px", padding: "6px 10px" }}
                        >
                          {isCurrentlyActive ? "EQUIPPED" : "EQUIP"}
                        </button>
                      ) : (
                        <span style={{ fontSize: "8px", color: "var(--color-gold)", fontFamily: "var(--font-display)" }}>
                          UNLOCKED
                        </span>
                      )
                    )}
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
