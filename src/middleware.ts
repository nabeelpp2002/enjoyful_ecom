import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify, decodeJwt } from 'jose';

const ADMIN_COOKIE = 'admin_access_token';

function redirectToLogin(request: NextRequest, pathname: string) {
  const loginUrl = new URL('/admin/login', request.url);
  loginUrl.searchParams.set('from', pathname);
  const res = NextResponse.redirect(loginUrl);
  // Drop the stale / invalid cookie so the browser stops re-sending it.
  res.cookies.delete(ADMIN_COOKIE);
  return res;
}

/**
 * Guards every /admin/* route (except the login page).
 *
 * The old check only verified that the `admin_access_token` cookie EXISTED — a
 * persisted-but-expired cookie (or a hand-forged one) still granted access. We
 * now actually verify the JWT:
 *   - signature (HS256 with JWT_ACCESS_SECRET — same secret the NestJS API signs with)
 *   - expiry (`exp`)
 *   - the `role` claim must be `admin`
 *
 * If JWT_ACCESS_SECRET is not exposed to the web app we fall back to a degraded
 * mode that still enforces expiry + role from the decoded payload (strictly
 * better than the old presence-only check). Set JWT_ACCESS_SECRET in the web
 * app's env to enable full cryptographic verification.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const token = request.cookies.get(ADMIN_COOKIE)?.value;
    if (!token) return redirectToLogin(request, pathname);

    const secret = process.env.JWT_ACCESS_SECRET;

    try {
      if (secret) {
        // Full verification — throws on bad signature or expired token.
        // Pin HS256 (the algorithm the NestJS API signs with) to prevent
        // algorithm-confusion attacks.
        const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), {
          algorithms: ['HS256'],
        });
        if (payload.role !== 'admin') return redirectToLogin(request, pathname);
      } else {
        // Degraded mode: no secret available to verify the signature, but we
        // still reject expired tokens and non-admin roles.
        const payload = decodeJwt(token);
        const exp = typeof payload.exp === 'number' ? payload.exp : 0;
        if (!exp || exp * 1000 < Date.now() || payload.role !== 'admin') {
          return redirectToLogin(request, pathname);
        }
      }
    } catch {
      // Invalid signature, expired, or malformed token → treat as unauthenticated.
      return redirectToLogin(request, pathname);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
