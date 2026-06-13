import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const rateLimitMap = new Map<string, { count: number; lastReset: number }>();

export function middleware(request: NextRequest) {
  const ip = request.ip ?? '127.0.0.1';
  const now = Date.now();
  const limit = 100;
  const windowMs = 60 * 1000;

  // Maintenance mode check via environment variable
  const isMaintenanceMode = process.env.MAINTENANCE_MODE === 'true';
  const isMaintenancePage = request.nextUrl.pathname === '/maintenance';
  const isStaticAsset = request.nextUrl.pathname.startsWith('/_next') || request.nextUrl.pathname.startsWith('/api');

  if (isMaintenanceMode && !isMaintenancePage && !isStaticAsset) {
    return NextResponse.redirect(new URL('/maintenance', request.url));
  }

  // Rate Limiting
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

  const response = NextResponse.next();
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}

export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
};
