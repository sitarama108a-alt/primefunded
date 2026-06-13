import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const rateLimitMap = new Map<string, { count: number; lastReset: number }>();

export function middleware(request: NextRequest) {
  const ip = request.ip ?? '127.0.0.1';
  const now = Date.now();
  const limit = 100;
  const windowMs = 60 * 1000;

  // Define critical paths
  const isApiRoute = request.nextUrl.pathname.startsWith('/api');
  const isMaintenancePage = request.nextUrl.pathname === '/maintenance';
  const isStaticAsset = request.nextUrl.pathname.startsWith('/_next') || request.nextUrl.pathname.startsWith('/favicon.ico');

  // CRITICAL: Bypassing middleware logic for API routes to ensure terminal compatibility
  if (isApiRoute) {
    return NextResponse.next();
  }

  // Maintenance mode check via environment variable
  const isMaintenanceMode = process.env.MAINTENANCE_MODE === 'true';

  if (isMaintenanceMode && !isMaintenancePage && !isStaticAsset) {
    return NextResponse.redirect(new URL('/maintenance', request.url));
  }

  // Rate Limiting (Skip for internal Next.js assets)
  if (!isStaticAsset) {
    const currentLimit = rateLimitMap.get(ip) ?? { count: 0, lastReset: now };
    if (now - currentLimit.lastReset > windowMs) {
      currentLimit.count = 1;
      currentLimit.lastReset = now;
    } else {
      currentLimit.count++;
    }
    rateLimitMap.set(ip, currentLimit);

    if (currentLimit.count > limit) {
      return new NextResponse('Too Many Requests', { status: 429 });
    }
  }

  const response = NextResponse.next();
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
