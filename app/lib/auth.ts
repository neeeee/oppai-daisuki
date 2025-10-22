import { NextAuthConfig } from "next-auth";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import bcrypt from "bcryptjs";
import { MongoClient } from "mongodb";
import { AdminUser, LoginAttempt } from "./types";

const client = new MongoClient(process.env.MONGODB_URI!);
const clientPromise = Promise.resolve(client);

// Security configuration
const ADMIN_EMAIL = process.env.ADMIN_EMAIL!;
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH!;
const ALLOWED_IPS = process.env.ALLOWED_ADMIN_IPS?.split(",") || [];
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes
const SESSION_MAX_AGE = 30 * 60; // 30 minutes

const loginAttempts = new Map<string, LoginAttempt>();

// Rate limiting and security functions
function isIPAllowed(ip: string): boolean {
  if (ALLOWED_IPS.length === 0) return true;
  return ALLOWED_IPS.includes(ip);
}

function checkRateLimit(ip: string): {
  allowed: boolean;
  remainingAttempts: number;
} {
  const attempt = loginAttempts.get(ip);
  const now = new Date();

  if (!attempt) {
    return { allowed: true, remainingAttempts: MAX_LOGIN_ATTEMPTS - 1 };
  }

  // Check if still locked
  if (attempt.lockedUntil && now < attempt.lockedUntil) {
    return { allowed: false, remainingAttempts: 0 };
  }

  // Reset if lockout period has expired
  if (attempt.lockedUntil && now >= attempt.lockedUntil) {
    loginAttempts.delete(ip);
    return { allowed: true, remainingAttempts: MAX_LOGIN_ATTEMPTS - 1 };
  }

  // Check if within rate limit
  if (attempt.attempts >= MAX_LOGIN_ATTEMPTS) {
    attempt.lockedUntil = new Date(now.getTime() + LOCKOUT_TIME);
    return { allowed: false, remainingAttempts: 0 };
  }

  return {
    allowed: true,
    remainingAttempts: MAX_LOGIN_ATTEMPTS - attempt.attempts - 1,
  };
}

function recordLoginAttempt(ip: string, success: boolean) {
  const attempt = loginAttempts.get(ip) || {
    ip,
    attempts: 0,
    lastAttempt: new Date(),
  };

  if (success) {
    // Clear attempts on successful login
    loginAttempts.delete(ip);
  } else {
    // Increment failed attempts
    attempt.attempts += 1;
    attempt.lastAttempt = new Date();
    loginAttempts.set(ip, attempt);
  }
}

const config: NextAuthConfig = {
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    Credentials({
      name: "admin-credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        const ip =
          request.headers?.get("x-forwarded-for") ||
          request.headers?.get("x-real-ip") ||
          "unknown";

        console.log(`[SECURITY] Admin login attempt from IP: ${ip}`);

        // Check IP allowlist
        if (!isIPAllowed(ip)) {
          console.log(
            `[SECURITY] Blocked login attempt from unauthorized IP: ${ip}`,
          );
          throw new Error("Access denied from this IP address");
        }

        // Check rate limiting
        const rateLimit = checkRateLimit(ip);
        if (!rateLimit.allowed) {
          console.log(`[SECURITY] Rate limit exceeded for IP: ${ip}`);
          throw new Error("Too many login attempts. Please try again later.");
        }

        if (!credentials?.email || !credentials?.password) {
          recordLoginAttempt(ip, false);
          throw new Error("Missing credentials");
        }

        // Verify credentials
        const isEmailValid = credentials.email === ADMIN_EMAIL;
        const isPasswordValid = ADMIN_PASSWORD_HASH
          ? await bcrypt.compare(
              credentials.password as string,
              ADMIN_PASSWORD_HASH,
            )
          : false;

        if (!isEmailValid || !isPasswordValid) {
          recordLoginAttempt(ip, false);
          console.log(
            `[SECURITY] Failed login attempt for ${credentials.email} from IP: ${ip}`,
          );
          throw new Error("Invalid credentials");
        }

        recordLoginAttempt(ip, true);
        console.log(
          `[SECURITY] Successful admin login for ${credentials.email} from IP: ${ip}`,
        );

        return {
          id: "admin",
          email: ADMIN_EMAIL,
          name: "Admin",
          role: "admin",
          ip: ip,
        } as AdminUser;
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE,
  },
  pages: {
    signIn: "/admin/login",
    error: "/admin/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const adminUser = user as AdminUser;
        token.role = adminUser.role;
        token.ip = adminUser.ip;
        token.loginTime = Date.now();
      }

      // Check if session should expire due to inactivity
      const now = Date.now();
      const loginTime = (token.loginTime as number) || now;

      if (now - loginTime > SESSION_MAX_AGE * 1000) {
        console.log(`[SECURITY] Session expired for ${token.email}`);
        return null; // This will force a new login
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.role = token.role as string;
        session.user.ip = token.ip as string;
        session.user.loginTime = token.loginTime as number;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Ensure redirects stay within the app
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  events: {
    async signIn({ user }) {
      const adminUser = user as AdminUser;
      console.log(
        `[SECURITY] Admin signed in: ${user.email} from IP: ${adminUser.ip}`,
      );
    },
    async signOut(message) {
      if ("token" in message && message.token) {
        console.log(`[SECURITY] Admin signed out: ${message.token.email}`);
      } else if ("session" in message && message.session) {
        console.log(
          `[SECURITY] Admin signed out: ${message.session.user?.email}`,
        );
      }
    },
  },
  debug: process.env.NODE_ENV === "development",
};

export const { handlers, signIn, signOut, auth } = NextAuth(config);
export { config as authConfig };
