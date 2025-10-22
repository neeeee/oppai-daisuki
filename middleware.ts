import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Security headers configuration
const securityHeaders = {
  "X-DNS-Prefetch-Control": "off",
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy":
    "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none';",
};

// Rate limiting storage (in production, use Redis or database)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function getRateLimitKey(ip: string, path: string): string {
  return `${ip}:${path}`;
}

function isRateLimited(
  ip: string,
  path: string,
  maxRequests = 10,
  windowMs = 60000,
): boolean {
  const key = getRateLimitKey(ip, path);
  const now = Date.now();
  const windowStart = now - windowMs;

  const record = rateLimitMap.get(key);

  if (!record || record.resetTime < windowStart) {
    // Reset or create new record
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return false;
  }

  if (record.count >= maxRequests) {
    return true; // Rate limited
  }

  record.count++;
  return false;
}

export default function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const ip =
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "unknown";

  // Add security headers to all responses
  const response = NextResponse.next();

  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Rate limiting for admin routes (but allow login page)
  if (pathname.startsWith("/admin")) {
    if (isRateLimited(ip, "/admin", 20, 60000)) {
      console.log(
        `[SECURITY] Rate limit exceeded for admin route from IP: ${ip}`,
      );
      return new NextResponse("Too Many Requests", {
        status: 429,
        headers: {
          "Retry-After": "60",
          ...securityHeaders,
        },
      });
    }

    // Only protect admin routes other than login and auth
    if (
      pathname.startsWith("/admin") &&
      pathname !== "/admin/login" &&
      !pathname.startsWith("/api/auth/")
    ) {
      // For protected admin pages, redirect to login if no session
      // Note: We can't easily check session in middleware with NextAuth v5
      // So we'll let the page components handle auth checks
      console.log(
        `[SECURITY] Admin route accessed: ${pathname} from IP: ${ip}`,
      );
    }
  }

  // General rate limiting for API routes
  if (pathname.startsWith("/api/")) {
    if (isRateLimited(ip, "/api", 100, 60000)) {
      console.log(`[SECURITY] Rate limit exceeded for API from IP: ${ip}`);
      return new NextResponse("Too Many Requests", {
        status: 429,
        headers: {
          "Retry-After": "60",
          ...securityHeaders,
        },
      });
    }
  }

  return response;
}

export const config = {
  matcher: [
    // Match all admin routes
    "/admin/:path*",
    // Match API routes
    "/api/:path*",
  ],
};
