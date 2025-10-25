/**
 * Security helpers for API routes and middleware.
 *
 * Usage examples (in route handlers):
 *
 *   import { requireAdmin, assertSameOrigin, jsonError, jsonOk } from "@/app/lib/security";
 *
 *   export async function POST(request: NextRequest) {
 *     const admin = await requireAdmin(request);
 *     if (admin instanceof Response) return admin; // Unauthorized
 *
 *     const originCheck = assertSameOrigin(request);
 *     if (originCheck) return originCheck; // Bad origin
 *
 *     // ... perform write action
 *     return jsonOk({ message: "success" });
 *   }
 */

import { NextResponse } from "next/server";
import { Session } from "next-auth";
import { auth } from "./auth";

export const isProd = process.env.NODE_ENV === "production";

/**
 * Ensures the caller is an authenticated admin.
 * - Returns a NextResponse(401) when unauthorized.
 * - Returns the session object when authorized.
 */
export async function requireAdmin(): Promise<Response | Session> {
  const session = await auth().catch(() => null);
  if (!session || session.user?.role !== "admin") {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }
  return session;
}

/**
 * Enforces that state-changing requests come from the same-origin.
 * - Applies to non-idempotent methods (POST/PUT/PATCH/DELETE by default).
 * - Accepts optional additional allowed origins.
 * - Returns a NextResponse(403) when origin is invalid; otherwise null.
 */
export function assertSameOrigin(
  request: Request,
  allowedOrigins?: string[],
  methodsToEnforce: string[] = ["POST", "PUT", "PATCH", "DELETE"],
): NextResponse | null {
  const method = request.method.toUpperCase();
  if (!methodsToEnforce.includes(method)) return null;

  const urlOrigin = safeOrigin(new URL(request.url).origin);
  const originHeader = request.headers.get("origin");
  const refererHeader = request.headers.get("referer");

  const allowed = new Set<string>(
    [
      urlOrigin,
      getEnvOrigin("NEXTAUTH_URL"),
      getEnvOrigin("APP_ORIGIN"),
      getVercelOrigin(),
      ...(allowedOrigins || []),
    ]
      .filter(Boolean)
      .map(safeOrigin),
  );

  let candidateOrigin = "";
  if (originHeader) {
    candidateOrigin = safeOrigin(originHeader);
  } else if (refererHeader) {
    // If Origin is not present, fall back to Referer origin
    try {
      candidateOrigin = safeOrigin(new URL(refererHeader).origin);
    } catch {
      candidateOrigin = "";
    }
  }

  if (!candidateOrigin || !allowed.has(candidateOrigin)) {
    return NextResponse.json(
      { success: false, error: "Bad origin" },
      { status: 403 },
    );
  }

  return null;
}

/**
 * Returns a canonical, lowercase origin string or "" if invalid.
 */
function safeOrigin(v?: string | null): string {
  try {
    if (!v) return "";
    return new URL(v).origin.toLowerCase();
  } catch {
    try {
      // Handle bare host (e.g., VERCEL_URL without scheme)
      return new URL(`https://${v}`).origin.toLowerCase();
    } catch {
      return "";
    }
  }
}

function getEnvOrigin(name: string): string {
  const v = process.env[name];
  return v ? safeOrigin(v) : "";
}

function getVercelOrigin(): string {
  const v = process.env.VERCEL_URL;
  if (!v) return "";
  return safeOrigin(`https://${v}`);
}

/**
 * Extract client IP from request headers in a proxy-friendly way.
 * Note: Only reliable if your platform provides and sanitizes these headers.
 */
export function getClientIp(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for") || "";
  const real = headers.get("x-real-ip") || "";
  const ip = (fwd.split(",")[0] || real || "").trim();
  return normalizeIp(ip);
}

export function normalizeIp(ip: string): string {
  let v = (ip || "").trim();
  if (v.startsWith("::ffff:")) v = v.substring(7);
  if (v === "") v = "unknown";
  return v;
}

/**
 * Minimal in-memory, fixed-window rate limiter.
 * For production, replace with a shared store (e.g., Redis, Upstash).
 */
export type RateLimitResult = {
  limited: boolean;
  remaining: number;
  reset: number; // epoch ms
};

type Bucket = { count: number; resetTime: number };

export class MemoryRateLimiter {
  private store = new Map<string, Bucket>();

  constructor(private readonly now: () => number = () => Date.now()) {}

  /**
   * Consume one token from the bucket for 'key'.
   * Returns whether the request is limited, remaining tokens, and reset timestamp.
   */
  take(key: string, maxRequests: number, windowMs: number): RateLimitResult {
    const now = this.now();
    const bucket = this.store.get(key);

    if (!bucket || now >= bucket.resetTime) {
      const reset = now + windowMs;
      this.store.set(key, { count: 1, resetTime: reset });
      return { limited: false, remaining: maxRequests - 1, reset };
    }

    if (bucket.count >= maxRequests) {
      return { limited: true, remaining: 0, reset: bucket.resetTime };
    }

    bucket.count += 1;
    return {
      limited: false,
      remaining: Math.max(0, maxRequests - bucket.count),
      reset: bucket.resetTime,
    };
  }
}

/**
 * Reasonable default CSP for production with a dev-friendly fallback.
 * Consider adding nonces/hashes for any required inline scripts.
 */
export function getCspHeader(): string {
  if (isProd) {
    return [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ");
  }
  // Development (allow inline/eval for tooling and React Fast Refresh)
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}

/**
 * Very conservative HTML sanitization helpers.
 * Prefer a battle-tested sanitizer (e.g., DOMPurify) for rich HTML.
 * These methods help avoid obvious vectors and/or escape content entirely.
 */
const ON_ATTR_REGEX = /\son[a-z]+\s*=\s*(['"]).*?\1/gi; // onload=, onclick=, etc.
const SCRIPT_TAG_REGEX = /<\s*script\b[^>]*>([\s\S]*?)<\s*\/\s*script\s*>/gi;
const DANGEROUS_TAGS_REGEX =
  /<\s*(iframe|object|embed|link|meta|base)\b[^>]*>([\s\S]*?)<\s*\/\s*\1\s*>/gi;
const JS_URL_REGEX = /(href|src)\s*=\s*(['"])\s*javascript:[^'"]*\2/gi;
const STYLE_ATTR_REGEX = /\sstyle\s*=\s*(['"]).*?\1/gi;

/**
 * Remove clearly dangerous patterns (scripts, event handlers, javascript: URLs, etc.).
 * Does not guarantee safety for complex HTML; use at your own risk.
 */
export function sanitizeHtmlStrict(input: string): string {
  if (!input) return "";
  let out = input;
  out = out.replace(SCRIPT_TAG_REGEX, "");
  out = out.replace(DANGEROUS_TAGS_REGEX, "");
  out = out.replace(ON_ATTR_REGEX, "");
  out = out.replace(JS_URL_REGEX, '$1="#"');
  out = out.replace(STYLE_ATTR_REGEX, "");
  return out;
}

/**
 * Fully escape HTML to safe text.
 */
export function escapeHtml(input: string): string {
  return (input || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * JSON response helpers.
 */
export function jsonOk(
  data: unknown,
  init?: number | ResponseInit,
): NextResponse {
  return NextResponse.json(
    { success: true, data },
    typeof init === "number" ? { status: init } : init,
  );
}

export function jsonError(
  error: string | Record<string, unknown>,
  init?: number | ResponseInit,
): NextResponse {
  const status =
    typeof init === "number"
      ? init
      : (init as ResponseInit | undefined)?.status || 400;
  const body =
    typeof error === "string"
      ? { success: false, error }
      : { success: false, ...error };
  return NextResponse.json(
    body,
    typeof init === "number"
      ? { status }
      : { ...(init as ResponseInit), status },
  );
}
