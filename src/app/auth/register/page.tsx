"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { signIn } from "next-auth/react";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [timezone] = useState(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch {
      return "UTC";
    }
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!username.trim() || username.length < 3) e.username = "At least 3 characters";
    if (!/^\S+@\S+\.\S+$/.test(email)) e.email = "Invalid email address";
    if (password.length < 8) e.password = "At least 8 characters";
    if (password !== confirmPassword) e.confirmPassword = "Passwords don't match";
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          email: email.trim().toLowerCase(),
          password,
          timezone,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        if (json.details) {
          const first = Object.values(json.details as Record<string, string[]>)[0];
          setErrors({ root: Array.isArray(first) ? first[0] : "Registration failed" });
        } else {
          setErrors({ root: json.error ?? "Registration failed" });
        }
        return;
      }

      // Auto sign-in after registration
      await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      toast.success("Welcome to Life RPG! 🎮 Your adventure begins!");
      router.push("/dashboard");
    } catch {
      setErrors({ root: "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem 1rem",
        position: "relative",
        overflowY: "auto",
      }}
    >
      <div
        style={{
          position: "fixed",
          inset: 0,
          background:
            "radial-gradient(ellipse at 70% 30%, var(--color-secondary)12 0%, transparent 60%), radial-gradient(ellipse at 30% 70%, var(--color-primary)12 0%, transparent 60%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          width: "100%",
          maxWidth: "460px",
          position: "relative",
          margin: "auto",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div style={{ fontSize: "44px", marginBottom: "0.75rem" }}>
            🧙
          </div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "16px",
              color: "var(--color-primary-light)",
              textShadow: "0 0 20px var(--color-primary)",
              letterSpacing: "0.08em",
              marginBottom: "0.5rem",
            }}
          >
            CREATE CHARACTER
          </h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "13px" }}>
            Begin your journey
          </p>
        </div>

        <div
          className="pixel-card"
          style={{ borderColor: "var(--color-secondary)" }}
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Username */}
            <div>
              <label
                htmlFor="username"
                style={{
                  display: "block",
                  fontFamily: "var(--font-display)",
                  fontSize: "8px",
                  color: "var(--color-text-muted)",
                  marginBottom: "6px",
                  letterSpacing: "0.08em",
                }}
              >
                HERO NAME
              </label>
              <input
                id="username"
                name="username"
                type="text"
                className="pixel-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="dragonslayer99"
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                style={errors.username ? { borderColor: "#ef4444" } : {}}
              />
              {errors.username && (
                <p style={{ color: "#fca5a5", fontSize: "11px", marginTop: "4px" }}>
                  ⚠️ {errors.username}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                style={{
                  display: "block",
                  fontFamily: "var(--font-display)",
                  fontSize: "8px",
                  color: "var(--color-text-muted)",
                  marginBottom: "6px",
                  letterSpacing: "0.08em",
                }}
              >
                EMAIL
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className="pixel-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="hero@example.com"
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                style={errors.email ? { borderColor: "#ef4444" } : {}}
              />
              {errors.email && (
                <p style={{ color: "#fca5a5", fontSize: "11px", marginTop: "4px" }}>
                  ⚠️ {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                style={{
                  display: "block",
                  fontFamily: "var(--font-display)",
                  fontSize: "8px",
                  color: "var(--color-text-muted)",
                  marginBottom: "6px",
                  letterSpacing: "0.08em",
                }}
              >
                PASSWORD
              </label>
              <input
                id="password"
                name="password"
                type="password"
                className="pixel-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                style={errors.password ? { borderColor: "#ef4444" } : {}}
              />
              {errors.password && (
                <p style={{ color: "#fca5a5", fontSize: "11px", marginTop: "4px" }}>
                  ⚠️ {errors.password}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                style={{
                  display: "block",
                  fontFamily: "var(--font-display)",
                  fontSize: "8px",
                  color: "var(--color-text-muted)",
                  marginBottom: "6px",
                  letterSpacing: "0.08em",
                }}
              >
                CONFIRM PASSWORD
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                className="pixel-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
                autoComplete="new-password"
                style={errors.confirmPassword ? { borderColor: "#ef4444" } : {}}
              />
              {errors.confirmPassword && (
                <p style={{ color: "#fca5a5", fontSize: "11px", marginTop: "4px" }}>
                  ⚠️ {errors.confirmPassword}
                </p>
              )}
            </div>

            {errors.root && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                style={{
                  background: "#ff6b6b22",
                  border: "1px solid #ff6b6b",
                  padding: "10px 14px",
                  color: "#fca5a5",
                  fontSize: "12px",
                }}
              >
                ⚠️ {errors.root}
              </motion.div>
            )}

            <motion.button
              type="submit"
              disabled={loading}
              whileTap={{ scale: 0.97 }}
              className="pixel-btn pixel-btn-gold"
              style={{
                padding: "14px",
                fontSize: "10px",
                marginTop: "0.5rem",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "CREATING..." : "🎮 START ADVENTURE"}
            </motion.button>
          </form>
        </div>

        <p
          style={{
            textAlign: "center",
            marginTop: "1.5rem",
            fontSize: "13px",
            color: "var(--color-text-muted)",
          }}
        >
          Already a hero?{" "}
          <Link
            href="/auth/login"
            style={{
              color: "var(--color-primary-light)",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Sign In →
          </Link>
        </p>
      </div>
    </div>
  );
}
