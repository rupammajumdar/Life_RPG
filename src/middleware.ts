/**
 * Next.js Middleware — Auth Route Protection
 * Runs in the Edge Runtime using Edge-compatible authConfig.
 * Never imports Mongoose or bcrypt into Edge.
 */

import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, public assets
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.svg).*)",
  ],
};
