/**
 * React Query + Theme Provider wrapper.
 * Must be a Client Component since it uses React state/context.
 */
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { useSession } from "next-auth/react";
import { SessionProvider } from "next-auth/react";

function ThemeApplicator({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  
  useEffect(() => {
    // Theme is applied via data-theme attribute on <html>
    // Default is pixel-retro, user's preference loaded from session/API
    const savedTheme = localStorage.getItem("life-rpg-theme") || "pixel-retro";
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, [session]);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000, // 30 seconds
            retry: (failureCount, error: unknown) => {
              // Don't retry auth errors
              if (
                typeof error === "object" &&
                error !== null &&
                "status" in error &&
                ((error as { status: number }).status === 401 ||
                  (error as { status: number }).status === 403)
              ) {
                return false;
              }
              return failureCount < 2;
            },
          },
          mutations: {
            retry: false,
          },
        },
      })
  );

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeApplicator>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: "var(--color-surface)",
                color: "var(--color-text)",
                border: "2px solid var(--color-border)",
                fontFamily: "var(--font-body)",
                fontSize: "14px",
                borderRadius: "0px",
                boxShadow: "4px 4px 0px var(--color-border)",
              },
              success: {
                iconTheme: {
                  primary: "var(--color-primary)",
                  secondary: "var(--color-bg)",
                },
              },
              error: {
                iconTheme: {
                  primary: "#ff6b6b",
                  secondary: "var(--color-bg)",
                },
              },
            }}
          />
        </ThemeApplicator>
      </QueryClientProvider>
    </SessionProvider>
  );
}
