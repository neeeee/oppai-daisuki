import { NextAuthConfig } from "next-auth";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import bcrypt from "bcryptjs";
import { MongoClient } from "mongodb";
import { AdminUser, LoginAttempt } from "./types";
import * as fs from "fs";
import * as path from "path";

// Explicitly load environment variables from .env.local
if (typeof window === "undefined") {
  try {
    const envPath = path.join(process.cwd(), ".env.local");
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, "utf8");
      const envLines = envContent.split("\n");

      envLines.forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith("#")) {
          const [key, ...valueParts] = trimmedLine.split("=");
          if (key && valueParts.length > 0) {
            const value = valueParts.join("=").replace(/^["']|["']$/g, "");
            process.env[key.trim()] = value;
          }
        }
      });

      console.log("[AUTH] Manually loaded environment variables from .env.local");
    } else {
      console.warn("[AUTH] .env.local file not found at:", envPath);
    }
  } catch (error) {
    console.warn("[AUTH] Could not manually load .env.local:", error.message);
  }
}

const client = new MongoClient(process.env.MONGODB_URI!);
const clientPromise = Promise.resolve(client);

// Security configuration
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";
const ADMIN_PASSWORD_HASH = (process.env.ADMIN_PASSWORD_HASH || "").trim();


const ALLOWED_IPS = (process.env.ALLOWED_ADMIN_IPS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes
const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // 7 days

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
      async authorize(credentials, request) {
        const fwd = request.headers?.get("x-forwarded-for") || "";
        const xri = request.headers?.get("x-real-ip") || "";
        let ip = (fwd.split(",")[0] || "").trim() || xri.trim() || "unknown";
        if (ip.startsWith("::ffff:")) {
          ip = ip.substring(7);
        }

        console.log(`[SECURITY] Admin login attempt from IP: ${ip}`);
        console.log(
          `[SECURITY][DEBUG] Allowlist enabled: ${ALLOWED_IPS.length > 0}, size=${ALLOWED_IPS.length}, candidateIP="${ip}"`,
        );

        // Check IP allowlist
        if (!isIPAllowed(ip)) {
          console.log(
            `[SECURITY] Blocked login attempt from unauthorized IP: ${ip} (allowlist size=${ALLOWED_IPS.length})`,
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
        const emailInput = String(credentials.email || "")
          .trim()
          .toLowerCase();
        const adminEmail = ADMIN_EMAIL.trim().toLowerCase();
        const isEmailValid = emailInput === adminEmail;

        const passwordInput = String(credentials.password || "");
        let isPasswordValid = false;



        if (ADMIN_PASSWORD_HASH) {
          try {
            isPasswordValid = await bcrypt.compare(
              passwordInput,
              ADMIN_PASSWORD_HASH,
            );

          } catch (error) {
            isPasswordValid = false;
          }
        }

        if (!isEmailValid || !isPasswordValid) {
          recordLoginAttempt(ip, false);
          console.log(
            `[SECURITY] Failed login attempt for ${emailInput} from IP: ${ip}`,
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
