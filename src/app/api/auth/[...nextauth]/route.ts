/**
 * NextAuth.js v5 Route Handler
 * This file MUST be at app/api/auth/[...nextauth]/route.ts
 */
import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
