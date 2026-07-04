import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),

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
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60,   // refresh every 24 hours
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

  callbacks: {
    // Populate session with user data
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },

    // Called after sign-in: upsert user fields and update lastLogin
    async signIn({ user, account, profile }) {
      if (account?.provider === "google" && profile) {
        try {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              googleId: profile.sub,
              lastLogin: new Date(),
              // Sync name/image in case they changed in Google
              name: profile.name ?? user.name,
              image: profile.picture ?? user.image,
              emailVerified: new Date(),
              provider: "google",
            },
          });
        } catch {
          // First sign-in — user row may not have id yet; adapter handles creation
          // This will succeed on subsequent sign-ins
        }
      }
      return true;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },
});
