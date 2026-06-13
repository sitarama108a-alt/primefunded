import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simplified in-memory rate limiter for Edge
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();

export function middleware(request: NextRequest) {
  const ip = request.ip ?? '127.0.0.1';
  const now = Date.now();
  const limit = 100; // max 100 requests
  const windowMs = 60 * 1000; // per 1 minute

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

  // Reinforce security headers in middleware
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}

export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
};
