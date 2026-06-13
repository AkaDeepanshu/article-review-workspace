import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import {
  type DefaultSession,
  type NextAuthConfig,
} from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import DiscordProvider from "next-auth/providers/discord";

import { db } from "easySLR/server/db";
import { env } from "easySLR/env";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

const providers: NextAuthConfig["providers"] = [
  CredentialsProvider({
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      const email = credentials?.email as string | undefined;
      const password = credentials?.password as string | undefined;

      if (!email || !password) return null;

      const user = await db.user.findUnique({ where: { email } });
      if (!user?.passwordHash) return null;

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) return null;

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      };
    },
  }),
];

if (env.AUTH_DISCORD_ID && env.AUTH_DISCORD_SECRET) {
  providers.push(
    DiscordProvider({
      clientId: env.AUTH_DISCORD_ID,
      clientSecret: env.AUTH_DISCORD_SECRET,
    }),
  );
}

export const authConfig = {
  providers,
  adapter: PrismaAdapter(db),
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
