import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    // Google and Credentials will be configured in Sprint 4
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
});
