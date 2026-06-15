import type { NextAuthConfig } from "next-auth";

/**
 * Edge-compatible auth config for middleware (no Node.js dependencies).
 */
export const edgeAuthConfig = {
  trustHost: true,
  providers: [],
  session: { strategy: "jwt" as const },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
      }
      return token;
    },
    session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id as string,
        },
      };
    },
  },
} satisfies NextAuthConfig;
