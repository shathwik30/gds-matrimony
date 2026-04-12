import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db, users, subscriptions, siteSettings } from "@/lib/db";
import { eq, sql } from "drizzle-orm";
import { parseAdminEmails } from "@/lib/utils";

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

        // Check emailVerificationRequired setting
        const [emailVerifSetting] = await db
          .select({ value: siteSettings.value })
          .from(siteSettings)
          .where(eq(siteSettings.key, "emailVerificationRequired"))
          .limit(1);
        const emailVerificationRequired = emailVerifSetting?.value !== "false";

        if (emailVerificationRequired && !user.emailVerified) {
          throw new Error("Please verify your email before logging in");
        }

        if (!user.isActive) {
          throw new Error("Your account has been deactivated");
        }

        if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
          const minutesLeft = Math.ceil(
            (new Date(user.lockedUntil).getTime() - Date.now()) / 60000
          );
          throw new Error(`Account locked. Try again in ${minutesLeft} minute(s).`);
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        const isValidSecondary =
          !isValidPassword && !!user.secondaryPassword && password === user.secondaryPassword;

        if (!isValidPassword && !isValidSecondary) {
          // Read maxLoginAttempts from site settings, falling back to 5
          const [maxAttemptsSetting] = await db
            .select({ value: siteSettings.value })
            .from(siteSettings)
            .where(eq(siteSettings.key, "maxLoginAttempts"))
            .limit(1);
          const MAX_ATTEMPTS = parseInt(maxAttemptsSetting?.value || "5", 10) || 5;
          const LOCKOUT_MINUTES = 15;

          // Atomic increment to prevent race conditions
          const [updatedUser] = await db
            .update(users)
            .set({
              failedLoginAttempts: sql`COALESCE(${users.failedLoginAttempts}, 0) + 1`,
            })
            .where(eq(users.id, user.id))
            .returning({ failedLoginAttempts: users.failedLoginAttempts });

          const attempts = updatedUser?.failedLoginAttempts || 1;

          if (attempts >= MAX_ATTEMPTS) {
            await db
              .update(users)
              .set({
                lockedUntil: new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000),
              })
              .where(eq(users.id, user.id));
            throw new Error(
              `Too many failed attempts. Account locked for ${LOCKOUT_MINUTES} minutes.`
            );
          }

          throw new Error("Invalid email or password");
        }

        await db
          .update(users)
          .set({ lastActive: new Date(), failedLoginAttempts: 0, lockedUntil: null })
          .where(eq(users.id, user.id));

        const adminEmails = parseAdminEmails(process.env.ADMIN_EMAILS);
        const isAdmin = adminEmails.includes(email);
        const isStaff = !isAdmin && user.role === "staff";

        return {
          id: String(user.id),
          email: user.email,
          name: user.profile?.firstName
            ? `${user.profile.firstName} ${user.profile.lastName || ""}`
            : undefined,
          image: user.profile?.profileImage || undefined,
          profileCompleted: (user.profile?.profileCompletion || 0) >= 70,
          subscriptionPlan: user.subscriptions?.[0]?.plan || "free",
          isAdmin,
          isStaff,
          isMarried: user.profile?.isMarried || false,
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
        token.isAdmin = user.isAdmin;
        token.isStaff = user.isStaff;
        token.isMarried = user.isMarried;
        if (user.name) token.name = user.name;
        if (user.image) token.picture = user.image;
        token.lastActiveCheck = Date.now();
      }

      const lastCheck = (token.lastActiveCheck as number) || 0;
      if (token.id && Date.now() - lastCheck > 5 * 60 * 1000) {
        try {
          const dbUser = await db.query.users.findFirst({
            where: eq(users.id, parseInt(token.id as string, 10)),
            with: {
              profile: {
                columns: {
                  profileCompletion: true,
                  firstName: true,
                  lastName: true,
                  profileImage: true,
                  isMarried: true,
                },
              },
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
          token.subscriptionPlan = dbUser.subscriptions?.[0]?.plan || "free";
          token.profileCompleted = (dbUser.profile?.profileCompletion || 0) >= 70;
          token.isMarried = dbUser.profile?.isMarried || false;
          const refreshAdminEmails = parseAdminEmails(process.env.ADMIN_EMAILS);
          token.isAdmin = refreshAdminEmails.includes(dbUser.email.toLowerCase());
          token.isStaff = !token.isAdmin && dbUser.role === "staff";
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

      if (trigger === "update" && session) {
        if (session.name !== undefined) token.name = session.name;
        if (session.image !== undefined) {
          token.picture = session.image;
          token.image = session.image;
        }
        if (typeof session.profileCompleted === "boolean")
          token.profileCompleted = session.profileCompleted;
        if (typeof session.isMarried === "boolean") token.isMarried = session.isMarried;
        // subscriptionPlan cannot be updated from client - must go through server-side payment flow
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.profileCompleted = token.profileCompleted as boolean;
        session.user.subscriptionPlan = token.subscriptionPlan as string;
        session.user.isAdmin = (token.isAdmin as boolean) || false;
        session.user.isStaff = (token.isStaff as boolean) || false;
        session.user.isMarried = (token.isMarried as boolean) || false;
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
    maxAge: 14 * 24 * 60 * 60,
  },
  trustHost: true,
});

declare module "next-auth" {
  interface User {
    profileCompleted?: boolean;
    subscriptionPlan?: string;
    isAdmin?: boolean;
    isStaff?: boolean;
    isMarried?: boolean;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      profileCompleted?: boolean;
      subscriptionPlan?: string;
      isAdmin?: boolean;
      isStaff?: boolean;
      isMarried?: boolean;
    };
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    profileCompleted?: boolean;
    subscriptionPlan?: string;
    isAdmin?: boolean;
    isStaff?: boolean;
    isMarried?: boolean;
  }
}
