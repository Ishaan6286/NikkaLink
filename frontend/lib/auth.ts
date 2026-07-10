import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { reportAuthEnvIssues, useJwtSessions } from "@/lib/auth-env";
import { logAuthError } from "@/lib/auth-errors";

reportAuthEnvIssues("auth-init");

const authSecret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
const jwtMode = useJwtSessions();

function getAdapter() {
  if (jwtMode) return undefined;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { authAdapter } = require("@/lib/auth-adapter") as {
    authAdapter: ReturnType<typeof import("@auth/prisma-adapter").PrismaAdapter>;
  };
  return authAdapter;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  debug: process.env.NODE_ENV === "development",
  adapter: getAdapter(),
  secret: authSecret,
  trustHost: true,

  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],

  session: {
    strategy: jwtMode ? "jwt" : "database",
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },

  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-authjs.session-token"
          : "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },

  callbacks: jwtMode
    ? {
        async jwt({ token, account, profile }) {
          if (account?.provider === "google" && profile) {
            token.id = profile.sub;
          }
          return token;
        },
        async session({ session, token }) {
          if (session.user && token.id) {
            session.user.id = token.id as string;
          }
          return session;
        },
      }
    : {
        async session({ session, user }) {
          if (session.user) {
            session.user.id = user.id;
          }
          return session;
        },
        async signIn({ user, account, profile }) {
          if (account?.provider === "google" && profile) {
            try {
              const { prisma } = await import("@/lib/prisma");
              await prisma.user.update({
                where: { id: user.id },
                data: {
                  googleId: profile.sub,
                  lastLogin: new Date(),
                  name: profile.name ?? user.name,
                  image: profile.picture ?? user.image,
                  emailVerified: new Date(),
                  provider: "google",
                },
              });
            } catch (error) {
              logAuthError("signIn callback: user profile sync failed", error);
            }
          }
          return true;
        },
      },

  events: {
    async signIn({ user, account, isNewUser }) {
      if (process.env.NODE_ENV === "development") {
        console.info("[NikkaLink Auth] signIn", {
          userId: user.id,
          provider: account?.provider,
          isNewUser,
          mode: jwtMode ? "jwt" : "database",
        });
      }
    },
  },

  logger: {
    error(error) {
      logAuthError("NextAuth error", error);
    },
    warn(code) {
      console.warn("[NikkaLink Auth] NextAuth warning:", code);
    },
    debug(message, metadata) {
      if (process.env.NODE_ENV === "development") {
        console.debug("[NikkaLink Auth]", message, metadata ?? "");
      }
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },
});
