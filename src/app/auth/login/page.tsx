"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error === "CredentialsSignin"
          ? "Invalid email or password"
          : result.error
        );
      } else {
        toast.success("Welcome back, adventurer! ⚔️");
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background decorations */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse at 30% 50%, var(--color-primary)15 0%, transparent 60%), radial-gradient(ellipse at 70% 50%, var(--color-secondary)10 0%, transparent 60%)",
          pointerEvents: "none",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 25 }}
        style={{ width: "100%", maxWidth: "420px", position: "relative" }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            style={{ fontSize: "48px", marginBottom: "1rem" }}
          >
            ⚔️
          </motion.div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "18px",
              color: "var(--color-primary-light)",
              textShadow: "0 0 20px var(--color-primary)",
              letterSpacing: "0.1em",
              marginBottom: "0.5rem",
            }}
          >
            LIFE RPG
          </h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "13px" }}>
            Your adventure awaits
          </p>
        </div>

        {/* Card */}
        <div
          className="pixel-card"
          style={{ borderColor: "var(--color-primary)" }}
        >
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "10px",
              color: "var(--color-text-muted)",
              letterSpacing: "0.1em",
              marginBottom: "1.5rem",
            }}
          >
            SIGN IN
          </h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
                type="email"
                className="pixel-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="hero@example.com"
                required
                autoComplete="email"
              />
            </div>

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
                type="password"
                className="pixel-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
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
                ⚠️ {error}
              </motion.div>
            )}

            <motion.button
              type="submit"
              disabled={loading}
              whileTap={{ scale: 0.97 }}
              className="pixel-btn pixel-btn-primary"
              style={{
                padding: "14px",
                fontSize: "10px",
                marginTop: "0.5rem",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "LOADING..." : "⚔️ ENTER GAME"}
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
          New adventurer?{" "}
          <Link
            href="/auth/register"
            style={{
              color: "var(--color-primary-light)",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Create Account →
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
