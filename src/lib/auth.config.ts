import type { NextAuthConfig } from "next-auth";

/**
 * Base auth config — NO Prisma imports here.
 * Used by middleware (Edge Runtime) where Node.js modules are unavailable.
 */
export const authConfig = {
  pages: {
    signIn: "/login",
  },

  callbacks: {
    authorized({ auth: session, request: { nextUrl } }) {
      const isLoggedIn = !!session?.user;
      const isOnLogin = nextUrl.pathname.startsWith("/login");
      if (isOnLogin) return true;
      return isLoggedIn; // Redirect to /login if not authenticated
    },
  },

  providers: [], // Populated in auth.ts
} satisfies NextAuthConfig;
