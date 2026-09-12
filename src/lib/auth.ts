/**
 * NextAuth.js v5 Configuration
 *
 * Uses the Credentials provider with bcrypt password verification.
 * JWT strategy (stateless) — no DB session table needed.
 * Tokens: access (15min via JWT) + refresh handled by NextAuth's built-in
 * session cookie mechanism (httpOnly, Secure, SameSite=Lax).
 */

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import connectDB from "@/lib/db/mongoose";
import User from "@/models/User";
import { authConfig } from "@/auth.config";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // 1. Validate input shape
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          throw new Error("Invalid credentials format");
        }

        const { email, password } = parsed.data;

        // 2. Connect & fetch user with passwordHash (normally excluded)
        await connectDB();
        const user = await User.findOne({ email }).select("+passwordHash");

        if (!user) {
          throw new Error("No account found with this email");
        }

        // 3. Verify password
        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
          throw new Error("Incorrect password");
        }

        // 4. Return the minimal user object that NextAuth stores in the JWT
        return {
          id: user._id.toString(),
          email: user.email,
          name: user.username,
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Persist the user's MongoDB _id in the JWT on first sign-in
        token.userId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.userId) {
        session.user.id = token.userId as string;
      }
      return session;
    },
  },

  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },

  // Trust the host header in production (required for Vercel/Railway)
  trustHost: true,
});

// Extend NextAuth types to include our custom fields
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
    };
  }
  interface JWT {
    userId?: string;
  }
}
