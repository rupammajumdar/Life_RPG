"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface XpParticleProps {
  xp: number;
  visible: boolean;
  onDone: () => void;
  originRef?: React.RefObject<HTMLElement | null>;
}

/**
 * Floating "+XP" particle that animates upward from a task card
 * toward the XP bar. Plays instantly on task completion (part of the
 * "juice" sequence described in PRD Section 4.2).
 */
export function XpParticle({ xp, visible, onDone, originRef }: XpParticleProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="xp-particle"
          initial={{ opacity: 1, y: 0, scale: 1, x: 0 }}
          animate={{ opacity: 0, y: -90, scale: 1.3, x: 10 }}
          exit={{ opacity: 0 }}
          transition={{
            duration: 1.2,
            ease: [0.22, 1, 0.36, 1],
          }}
          onAnimationComplete={onDone}
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
            zIndex: 9000,
            fontFamily: "var(--font-display)",
            fontSize: "11px",
            color: "var(--color-primary-light)",
            textShadow: "0 0 8px var(--color-primary)",
            whiteSpace: "nowrap",
            userSelect: "none",
          }}
        >
          +{xp} XP
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Gold particle variant
 */
export function GoldParticle({
  gold,
  visible,
  onDone,
}: {
  gold: number;
  visible: boolean;
  onDone: () => void;
}) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="gold-particle"
          initial={{ opacity: 1, y: 0, scale: 1, x: 20 }}
          animate={{ opacity: 0, y: -70, scale: 1.2, x: 40 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
          onAnimationComplete={onDone}
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
            zIndex: 9000,
            fontFamily: "var(--font-display)",
            fontSize: "10px",
            color: "var(--color-gold)",
            textShadow: "0 0 8px var(--color-gold)",
            whiteSpace: "nowrap",
          }}
        >
          +{gold}G
        </motion.div>
      )}
    </AnimatePresence>
  );
}
