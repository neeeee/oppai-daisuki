import { NextAuthConfig } from "next-auth";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import bcrypt from "bcryptjs";
import { MongoClient } from "mongodb";
import { AdminUser, LoginAttempt } from "./types";
import logger from "./utils/logger";

const client = new MongoClient(process.env.MONGODB_URI!);
const clientPromise = Promise.resolve(client);

// Security configuration
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH_BASE64
  ? Buffer.from(process.env.ADMIN_PASSWORD_HASH_BASE64, "base64").toString(
      "utf-8",
    )
  : (process.env.ADMIN_PASSWORD_HASH || "").trim();

const ALLOWED_IPS = (process.env.ALLOWED_ADMIN_IPS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes
const SESSION_MAX_AGE = 1 * 24 * 60 * 60; // 1 day

const loginAttempts = new Map<string, LoginAttempt>();

// Rate limiting and security functions
function normalizeIP(ip: string): string {
  let v = (ip || "").trim();
  // Normalize IPv4-mapped IPv6 addresses like ::ffff:127.0.0.1
  if (v.startsWith("::ffff:")) v = v.substring(7);
  return v;
}

function isIPAllowed(ip: string): boolean {
  const candidate = normalizeIP(ip);

  // Empty allowlist disables the check
  if (ALLOWED_IPS.length === 0) return true;

  // Build a normalized set from the allowlist
  const allowedSet = new Set(ALLOWED_IPS.map(normalizeIP));

  // Treat loopback equivalents as interchangeable
  if (allowedSet.has("127.0.0.1")) allowedSet.add("::1");
  if (allowedSet.has("::1")) allowedSet.add("127.0.0.1");

  return allowedSet.has(candidate);
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
      // lib/auth.ts - Updated authorize function
async authorize(credentials, request) {
  const fwd = request.headers?.get("x-forwarded-for") || "";
  const xri = request.headers?.get("x-real-ip") || "";
  let ip = (fwd.split(",")[0] || "").trim() || xri.trim() || "unknown";
  if (ip.startsWith("::ffff:")) {
    ip = ip.substring(7);
  }

  if (process.env.NODE_ENV !== "production")
    logger.warn(`[SECURITY] Admin login attempt from IP: ${ip}`);

  // Check IP allowlist
  if (!isIPAllowed(ip)) {
    if (process.env.NODE_ENV !== "production")
      logger.error(
        `[SECURITY] Blocked login attempt from unauthorized IP: ${ip}`,
      );
    throw new Error("Access denied from this IP address");
  }

  // Check rate limiting
  const rateLimit = checkRateLimit(ip);
  if (!rateLimit.allowed) {
    if (process.env.NODE_ENV !== "production")
      logger.error(`[SECURITY] Rate limit exceeded for IP: ${ip}`);
    throw new Error("Too many login attempts. Please try again later.");
  }

  if (!credentials?.email || !credentials?.password) {
    recordLoginAttempt(ip, false);
    throw new Error("Missing credentials");
  }

  const emailInput = String(credentials.email).trim().toLowerCase();
  const passwordInput = String(credentials.password); // Don't trim password!
  
  const adminEmail = ADMIN_EMAIL.trim().toLowerCase();
  const isEmailValid = emailInput === adminEmail;

  // Debug logging (remove after testing)
  let isPasswordValid = false;

  if (ADMIN_PASSWORD_HASH && isEmailValid) {
    try {
      isPasswordValid = await bcrypt.compare(
        passwordInput,
        ADMIN_PASSWORD_HASH,
      );
      
      if (process.env.NODE_ENV !== "production") {
        logger.warn(`[DEBUG] Password valid: ${isPasswordValid}`);
      }
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        logger.error(`[DEBUG] bcrypt.compare error:`, err);
      }
      isPasswordValid = false;
    }
  }

  if (!isEmailValid || !isPasswordValid) {
    recordLoginAttempt(ip, false);
    if (process.env.NODE_ENV !== "production")
      logger.error(
        `[SECURITY] Failed login attempt for ${emailInput} from IP: ${ip}`,
      );
    throw new Error("Invalid credentials");
  }

  recordLoginAttempt(ip, true);
  if (process.env.NODE_ENV !== "production")
    logger.info(
      `[SECURITY] Successful admin login for ${emailInput} from IP: ${ip}`,
    );

  return {
    id: "admin",
    email: ADMIN_EMAIL,
    name: "Admin",
    role: "admin",
    ip: ip,
  } as AdminUser;
}
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
  trustHost: true,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const adminUser = user as AdminUser;
        token.role = adminUser.role;
        token.ip = adminUser.ip;
        token.loginTime = Date.now();
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
      if (process.env.NODE_ENV !== "production")
        logger.info(
          `[SECURITY] Admin signed in: ${user.email} from IP: ${adminUser.ip}`,
        );
    },
    async signOut(message) {
      if ("token" in message && message.token) {
        if (process.env.NODE_ENV !== "production")
          logger.info(`[SECURITY] Admin signed out: ${message.token.email}`);
      } else if ("session" in message && message.session) {
        if (process.env.NODE_ENV !== "production")
          logger.info(
            `[SECURITY] Admin signed out: ${(message.session as { user?: { email?: string } }).user?.email}`,
          );
      }
    },
  },
  debug: process.env.NODE_ENV === "development",
};

export const { handlers, signIn, signOut, auth } = NextAuth(config);
export { config as authConfig };
