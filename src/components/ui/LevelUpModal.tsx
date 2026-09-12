"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";

interface LevelUpModalProps {
  levelUps: number[];   // e.g. [5, 6] for multi-level
  onClose: () => void;
}

/**
 * Full-screen level-up celebration modal.
 * Plays level-up events sequentially (per PRD Section 6.5 edge case).
 * Uses spring animation — never fixed-duration tweens.
 */
export function LevelUpModal({ levelUps, onClose }: LevelUpModalProps) {
  const topLevel = levelUps[levelUps.length - 1];

  // Auto-close after 4 seconds
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        className="levelup-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        onClick={onClose}
      >
        {/* Particle burst rings */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0, opacity: 0.8 }}
            animate={{ scale: 4 + i * 0.8, opacity: 0 }}
            transition={{
              duration: 1.5,
              delay: i * 0.08,
              ease: "easeOut",
            }}
            style={{
              position: "absolute",
              width: "200px",
              height: "200px",
              borderRadius: "50%",
              border: `2px solid var(--color-primary)`,
              pointerEvents: "none",
            }}
          />
        ))}

        {/* Main card */}
        <motion.div
          initial={{ scale: 0.3, opacity: 0, y: 60 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 20,
          }}
          onClick={(e) => e.stopPropagation()}
          style={{
            background: "var(--color-surface)",
            border: "3px solid var(--color-primary)",
            boxShadow:
              "0 0 60px var(--color-primary), 8px 8px 0 var(--color-primary)",
            padding: "3rem 4rem",
            textAlign: "center",
            position: "relative",
            zIndex: 10,
            maxWidth: "90vw",
          }}
        >
          {/* Corner decorations */}
          {["top-0 left-0", "top-0 right-0", "bottom-0 left-0", "bottom-0 right-0"].map(
            (pos, i) => (
              <div
                key={i}
                className={`absolute ${pos} w-4 h-4 border-2 border-yellow-400`}
                style={{ margin: "-3px" }}
              />
            )
          )}

          <motion.div
            animate={{ rotate: [0, -3, 3, -3, 3, 0] }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <p
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "10px",
                color: "var(--color-text-muted)",
                letterSpacing: "0.2em",
                marginBottom: "0.75rem",
              }}
            >
              ✦ LEVEL UP ✦
            </p>

            <motion.div
              initial={{ scale: 0.5 }}
              animate={{ scale: [0.5, 1.3, 1] }}
              transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.2 }}
            >
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(48px, 10vw, 80px)",
                  color: "var(--color-secondary)",
                  textShadow:
                    "0 0 20px var(--color-gold), 4px 4px 0px #92400e",
                  display: "block",
                  lineHeight: 1,
                }}
              >
                {topLevel}
              </span>
            </motion.div>

            <p
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "9px",
                color: "var(--color-primary-light)",
                marginTop: "1rem",
                letterSpacing: "0.1em",
              }}
            >
              {levelUps.length > 1
                ? `MULTI LEVEL UP! (${levelUps.join(" → ")})`
                : "YOUR POWER GROWS"}
            </p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              style={{
                fontSize: "12px",
                color: "var(--color-text-muted)",
                marginTop: "1.5rem",
                fontFamily: "var(--font-body)",
              }}
            >
              Click anywhere to continue
            </motion.p>
          </motion.div>
        </motion.div>

        {/* Floating sparkles */}
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={`sparkle-${i}`}
            initial={{
              x: 0,
              y: 0,
              opacity: 1,
              scale: 0,
            }}
            animate={{
              x: (Math.random() - 0.5) * 600,
              y: (Math.random() - 0.5) * 400,
              opacity: 0,
              scale: Math.random() * 2 + 0.5,
              rotate: Math.random() * 360,
            }}
            transition={{
              duration: Math.random() * 1.5 + 0.8,
              delay: Math.random() * 0.5,
              ease: "easeOut",
            }}
            style={{
              position: "absolute",
              width: "8px",
              height: "8px",
              background: i % 2 === 0 ? "var(--color-secondary)" : "var(--color-primary-light)",
              pointerEvents: "none",
            }}
          />
        ))}
      </motion.div>
    </AnimatePresence>
  );
}
