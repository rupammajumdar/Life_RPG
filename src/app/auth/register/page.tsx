"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { signIn } from "next-auth/react";
import toast from "react-hot-toast";

interface FieldProps {
  id: string;
  label: string;
  type?: string;
  value: string;
  error?: string;
  placeholder: string;
  autoComplete?: string;
  autoCapitalize?: string;
  autoCorrect?: string;
  onChange: (v: string) => void;
}

function Field({
  id,
  label,
  type = "text",
  value,
  error,
  placeholder,
  autoComplete,
  autoCapitalize,
  autoCorrect,
  onChange,
}: FieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        style={{
          display: "block",
          fontFamily: "var(--font-display)",
          fontSize: "8px",
          color: "var(--color-text-muted)",
          marginBottom: "6px",
          letterSpacing: "0.08em",
        }}
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        className="pixel-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        style={error ? { borderColor: "#ef4444" } : {}}
      />
      {error && (
        <p style={{ color: "#fca5a5", fontSize: "11px", marginTop: "4px" }}>
          ⚠️ {error}
        </p>
      )}
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    username: "", email: "", password: "", confirmPassword: "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors]   = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.username.trim() || form.username.length < 3) e.username = "At least 3 characters";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Invalid email";
    if (form.password.length < 8) e.password = "At least 8 characters";
    if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords don't match";
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.username.trim(),
          email: form.email.trim(),
          password: form.password,
          timezone: form.timezone,
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
        email: form.email,
        password: form.password,
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
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse at 70% 30%, var(--color-secondary)12 0%, transparent 60%), radial-gradient(ellipse at 30% 70%, var(--color-primary)12 0%, transparent 60%)",
          pointerEvents: "none",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 25 }}
        style={{ width: "100%", maxWidth: "460px", position: "relative" }}
      >
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            style={{ fontSize: "48px", marginBottom: "1rem" }}
          >
            🧙
          </motion.div>
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
            <Field
              id="username"
              label="HERO NAME"
              value={form.username}
              error={errors.username}
              placeholder="dragonslayer99"
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              onChange={(v) => setForm((f) => ({ ...f, username: v }))}
            />
            <Field
              id="email"
              label="EMAIL"
              type="email"
              value={form.email}
              error={errors.email}
              placeholder="hero@example.com"
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              onChange={(v) => setForm((f) => ({ ...f, email: v }))}
            />
            <Field
              id="password"
              label="PASSWORD"
              type="password"
              value={form.password}
              error={errors.password}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              onChange={(v) => setForm((f) => ({ ...f, password: v }))}
            />
            <Field
              id="confirmPassword"
              label="CONFIRM PASSWORD"
              type="password"
              value={form.confirmPassword}
              error={errors.confirmPassword}
              placeholder="Repeat password"
              autoComplete="new-password"
              onChange={(v) => setForm((f) => ({ ...f, confirmPassword: v }))}
            />

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

            {/* Timezone (hidden but captured) */}
            <input type="hidden" value={form.timezone} />

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
            style={{ color: "var(--color-primary-light)", textDecoration: "none", fontWeight: 600 }}
          >
            Sign In →
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
