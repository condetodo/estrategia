import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

// Use lightweight config (no Prisma) for Edge Runtime compatibility
export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - /api/auth (NextAuth routes)
     * - /login (login page)
     * - /_next/static (static files)
     * - /_next/image (image optimization)
     * - /favicon.ico
     */
    "/((?!api/auth|login|_next/static|_next/image|favicon.ico).*)",
  ],
};
