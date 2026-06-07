import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('sb-token')?.value;
  const isLoginPage = request.nextUrl.pathname.startsWith('/admin/login');

  // If visiting an admin route and do not have a cookie token, redirect to login
  if (request.nextUrl.pathname.startsWith('/admin') && !isLoginPage) {
    if (!token) {
      const loginUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // If already authorized and visiting login page, redirect to dashboard
  if (isLoginPage && token) {
    const dashboardUrl = new URL('/admin/dashboard', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
