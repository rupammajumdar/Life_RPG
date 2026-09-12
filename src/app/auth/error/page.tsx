"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function AuthError() {
  const params = useSearchParams();
  const error = params.get("error");

  const message =
    error === "CredentialsSignin"
      ? "Invalid email or password."
      : error === "SessionRequired"
      ? "Please sign in to access this page."
      : "An authentication error occurred.";

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ textAlign: "center", maxWidth: "360px" }}
      >
        <div style={{ fontSize: "48px", marginBottom: "1rem" }}>⚠️</div>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "11px", color: "#fca5a5", marginBottom: "1rem", letterSpacing: "0.08em" }}>
          AUTH ERROR
        </h1>
        <p style={{ color: "var(--color-text-muted)", marginBottom: "2rem", fontSize: "14px" }}>
          {message}
        </p>
        <Link href="/auth/login" className="pixel-btn pixel-btn-primary" style={{ display: "inline-block", fontSize: "9px", padding: "12px 20px", textDecoration: "none" }}>
          BACK TO LOGIN
        </Link>
      </motion.div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div />}>
      <AuthError />
    </Suspense>
  );
}
