import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Rate limiting storage (in production, replace with a shared store like Redis/Upstash)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_ENABLED = process.env.RATE_LIMIT_ENABLED !== "false";
// Placeholder for shared rate limiting store:
// Integrate a Redis-backed token bucket here for multi-instance deployments.

function getRateLimitKey(ip: string, path: string): string {
  return `${ip}:${path}`;
}

function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...Array.from(array)));
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

function isMainSite(request: NextRequest): boolean {
  const host = request.headers.get('host') || '';
  const adminUrl = process.env.ADMIN_URL;

  if (!adminUrl) return true; // If no ADMIN_URL set, treat as main site

  const adminHost = new URL(adminUrl).host;
  return host !== adminHost;
}

function isAdminRoute(pathname: string): boolean {
  return pathname.startsWith('/admin') && 
          !pathname.startsWith('/api/auth');
}

export default function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const host = request.headers.get('host') || '';
  const ip =
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const response = NextResponse.next();
  const nonce = generateNonce();

  const securityHeaders: Record<string, string> = {
    "X-DNS-Prefetch-Control": "off",
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy":
      "camera=(), microphone=(), geolocation=(), interest-cohort=()",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
  };

  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  const csp = [
    `default-src 'self'`,
    `media-src 'self' https: data: blob:;`, 
    `script-src 'self' 'nonce-${nonce}'`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob: https:`,
    `font-src 'self' data:`,
    `connect-src 'self' https:`,
    `frame-ancestors 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
  ].join("; ");

  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("x-nonce", nonce);

   if (pathname.startsWith('/admin') && !pathname.startsWith('/api/auth/')) {
    const allowAdminOnMainSite = process.env.ALLOW_ADMIN_ON_MAIN_SITE === 'true';
    const adminUrl = process.env.ADMIN_URL;
    
    if (adminUrl && !allowAdminOnMainSite && isMainSite(request)) {
      console.log(
        `[SECURITY] Admin route ${pathname} blocked on main site (${host}). ` +
        `Redirecting to admin URL. IP: ${ip}`
      );
      
      const adminUrlObj = new URL(adminUrl);
      const redirectUrl = new URL(request.url);
      redirectUrl.host = adminUrlObj.host;
      redirectUrl.protocol = adminUrlObj.protocol;
      redirectUrl.port = '';
      
      return NextResponse.redirect(redirectUrl.toString(), 302);
    }
  }

  // Handle auth API routes differently - allow them on both domains
  if (pathname.startsWith('/api/auth/')) {
    // Only block auth if it's an admin-specific auth route AND on main site
    if (pathname.includes('admin') || pathname.includes('login')) {
      const allowAdminOnMainSite = process.env.ALLOW_ADMIN_ON_MAIN_SITE === 'true';
      const adminUrl = process.env.ADMIN_URL;
      
      if (adminUrl && !allowAdminOnMainSite && isMainSite(request)) {
        const adminUrlObj = new URL(adminUrl);
        const redirectUrl = new URL(request.url);
        redirectUrl.host = adminUrlObj.host;
        redirectUrl.protocol = adminUrlObj.protocol;
        redirectUrl.port = '';
        
        return NextResponse.redirect(redirectUrl.toString(), 302);
      }
    }
  }

  // Rate limiting for admin routes (but allow login page)
  if (pathname.startsWith("/admin")) {
    if (RATE_LIMIT_ENABLED && isRateLimited(ip, "/admin", 20, 60000)) {
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
	}

  // General rate limiting for API routes
  if (pathname.startsWith("/api/")) {
    if (RATE_LIMIT_ENABLED && isRateLimited(ip, "/api", 100, 60000)) {
      console.log(`[SECURITY] Rate limit exceeded for API from IP: ${ip}`);
      return NextResponse.json(
        { success: false, error: "Too Many Requests", retryAfter: 60 },
        {
          status: 429,
          headers: {
            "Retry-After": "60",
            ...securityHeaders,
          },
        },
      );
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
    "/admin/:path*",
    "/api/:path*",
  ],
};
