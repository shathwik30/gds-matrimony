import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db, users, subscriptions } from "@/lib/db";
import { eq, sql } from "drizzle-orm";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const email = (credentials.email as string).trim().toLowerCase();
        const password = credentials.password as string;

        // Find user by email
        const user = await db.query.users.findFirst({
          where: eq(users.email, email),
          with: {
            profile: true,
            subscriptions: {
              where: eq(subscriptions.isActive, true),
              limit: 1,
            },
          },
        });

        if (!user) {
          throw new Error("Invalid email or password");
        }

        if (!user.emailVerified) {
          throw new Error("Please verify your email before logging in");
        }

        if (!user.isActive) {
          throw new Error("Your account has been deactivated");
        }

        // Check if account is locked due to brute force
        if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
          const minutesLeft = Math.ceil((new Date(user.lockedUntil).getTime() - Date.now()) / 60000);
          throw new Error(`Account locked. Try again in ${minutesLeft} minute(s).`);
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
          const MAX_ATTEMPTS = 5;
          const LOCKOUT_MINUTES = 15;

          // Atomically increment failed attempts to prevent race conditions
          const [updatedUser] = await db
            .update(users)
            .set({
              failedLoginAttempts: sql`COALESCE(${users.failedLoginAttempts}, 0) + 1`,
            })
            .where(eq(users.id, user.id))
            .returning({ failedLoginAttempts: users.failedLoginAttempts });

          const attempts = updatedUser?.failedLoginAttempts || 1;

          if (attempts >= MAX_ATTEMPTS) {
            // Lock account
            await db
              .update(users)
              .set({
                lockedUntil: new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000),
              })
              .where(eq(users.id, user.id));
            throw new Error(`Too many failed attempts. Account locked for ${LOCKOUT_MINUTES} minutes.`);
          }

          throw new Error("Invalid email or password");
        }

        // Reset failed attempts on successful login
        await db
          .update(users)
          .set({ lastActive: new Date(), failedLoginAttempts: 0, lockedUntil: null })
          .where(eq(users.id, user.id));

        return {
          id: String(user.id),
          email: user.email,
          name: user.profile?.firstName
            ? `${user.profile.firstName} ${user.profile.lastName || ""}`
            : undefined,
          image: user.profile?.profileImage || undefined,
          profileCompleted: (user.profile?.profileCompletion || 0) >= 70,
          subscriptionPlan: user.subscriptions?.[0]?.plan || "free",
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.profileCompleted = user.profileCompleted;
        token.subscriptionPlan = user.subscriptionPlan;
        if (user.name) token.name = user.name;
        if (user.image) token.picture = user.image;
        token.lastActiveCheck = Date.now();
      }

      // Periodically re-validate user status and subscription (every 5 minutes)
      const lastCheck = (token.lastActiveCheck as number) || 0;
      if (token.id && Date.now() - lastCheck > 5 * 60 * 1000) {
        try {
          const dbUser = await db.query.users.findFirst({
            where: eq(users.id, parseInt(token.id as string, 10)),
            columns: { isActive: true },
            with: {
              profile: { columns: { profileCompletion: true, firstName: true, lastName: true, profileImage: true } },
              subscriptions: {
                where: eq(subscriptions.isActive, true),
                limit: 1,
                columns: { plan: true },
              },
            },
          });
          if (!dbUser || !dbUser.isActive) {
            return { ...token, id: undefined };
          }
          // Refresh subscription plan from DB
          token.subscriptionPlan = dbUser.subscriptions?.[0]?.plan || "free";
          token.profileCompleted = (dbUser.profile?.profileCompletion || 0) >= 70;
          if (dbUser.profile?.firstName) {
            token.name = `${dbUser.profile.firstName} ${dbUser.profile.lastName || ""}`.trim();
          }
          if (dbUser.profile?.profileImage) {
            token.picture = dbUser.profile.profileImage;
          }
          token.lastActiveCheck = Date.now();
        } catch {
          // Don't break auth on transient DB errors
        }
      }

      // Handle session updates - only allow safe fields to be updated
      if (trigger === "update" && session) {
        if (session.name !== undefined) token.name = session.name;
        if (session.image !== undefined) {
          // token.picture is what NextAuth maps to session.user.image
          token.picture = session.image;
          token.image = session.image;
        }
        if (typeof session.profileCompleted === "boolean") token.profileCompleted = session.profileCompleted;
        // subscriptionPlan cannot be updated from client - must go through server-side payment flow
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.profileCompleted = token.profileCompleted as boolean;
        session.user.subscriptionPlan = token.subscriptionPlan as string;
        if (token.name) session.user.name = token.name;
        if (token.picture) session.user.image = token.picture as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 14 * 24 * 60 * 60, // 14 days
  },
  trustHost: true,
});

// Extend next-auth types
declare module "next-auth" {
  interface User {
    profileCompleted?: boolean;
    subscriptionPlan?: string;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      profileCompleted?: boolean;
      subscriptionPlan?: string;
    };
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    profileCompleted?: boolean;
    subscriptionPlan?: string;
  }
}
