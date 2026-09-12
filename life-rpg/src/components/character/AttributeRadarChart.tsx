"use client";

import { AttributeData } from "@/types";
import { motion } from "framer-motion";

const ATTRIBUTE_COLORS: Record<string, string> = {
  Strength:   "#ef4444",
  Intellect:  "#3b82f6",
  Discipline: "#10b981",
  Creativity: "#ec4899",
  Social:     "#f59e0b",
};

const ATTRIBUTE_ICONS: Record<string, string> = {
  Strength:   "💪",
  Intellect:  "🧠",
  Discipline: "⚡",
  Creativity: "🎨",
  Social:     "🤝",
};

interface RadarChartProps {
  attributes: AttributeData[];
  size?: number;
}

function polarToCartesian(angle: number, r: number, cx: number, cy: number) {
  const rad = (angle - 90) * (Math.PI / 180);
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

export function AttributeRadarChart({ attributes, size = 260 }: RadarChartProps) {
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size / 2 - 36;
  const sides = attributes.length;
  const step = 360 / sides;

  // Normalize levels to 0-1 scale (max level 20 for display)
  const MAX_DISPLAY_LEVEL = 20;
  const values = attributes.map((a) =>
    Math.min(a.level / MAX_DISPLAY_LEVEL, 1)
  );

  // Polygon points for the data shape
  const dataPoints = values.map((v, i) => {
    const angle = i * step;
    return polarToCartesian(angle, v * maxR, cx, cy);
  });

  // Grid rings (20%, 40%, 60%, 80%, 100%)
  const rings = [0.2, 0.4, 0.6, 0.8, 1.0];

  const dataPath =
    dataPoints.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ") + " Z";

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ maxWidth: "100%", height: "auto", display: "block", margin: "0 auto" }}
      aria-label="Attribute radar chart"
    >
      {/* Grid rings */}
      {rings.map((r, ri) => {
        const pts = attributes.map((_, i) => {
          const angle = i * step;
          return polarToCartesian(angle, r * maxR, cx, cy);
        });
        const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ") + " Z";
        return (
          <path
            key={ri}
            d={d}
            fill="none"
            stroke="var(--color-border)"
            strokeWidth="1"
            opacity={0.5}
          />
        );
      })}

      {/* Axis lines */}
      {attributes.map((_, i) => {
        const angle = i * step;
        const outer = polarToCartesian(angle, maxR, cx, cy);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={outer.x}
            y2={outer.y}
            stroke="var(--color-border)"
            strokeWidth="1"
            opacity={0.5}
          />
        );
      })}

      {/* Data shape */}
      <motion.path
        d={dataPath}
        fill="var(--color-primary)"
        fillOpacity={0.2}
        stroke="var(--color-primary)"
        strokeWidth="2"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
      />

      {/* Data points (one per attribute) */}
      {dataPoints.map((pt, i) => {
        const attr = attributes[i];
        const color = ATTRIBUTE_COLORS[attr.attribute] ?? "var(--color-primary)";
        return (
          <motion.circle
            key={i}
            cx={pt.x}
            cy={pt.y}
            r={5}
            fill={color}
            stroke="var(--color-bg)"
            strokeWidth={2}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.5 + i * 0.08 }}
          />
        );
      })}

      {/* Attribute labels */}
      {attributes.map((attr, i) => {
        const angle = i * step;
        const labelR = maxR + 26;
        const pos = polarToCartesian(angle, labelR, cx, cy);
        const color = ATTRIBUTE_COLORS[attr.attribute] ?? "var(--color-primary)";
        return (
          <g key={i}>
            <text
              x={pos.x}
              y={pos.y - 5}
              textAnchor="middle"
              fontSize="14"
              fill={color}
            >
              {ATTRIBUTE_ICONS[attr.attribute]}
            </text>
            <text
              x={pos.x}
              y={pos.y + 11}
              textAnchor="middle"
              className="radar-label"
              fill={color}
              fontSize="7"
              fontFamily="'Press Start 2P', monospace"
            >
              Lv.{attr.level}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
