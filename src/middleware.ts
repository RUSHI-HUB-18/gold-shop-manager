import { NextResponse, NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Define authentication APIs that should bypass checks
  const isAuthApi = pathname.startsWith('/api/auth/login') ||
                    pathname.startsWith('/api/auth/register') ||
                    pathname.startsWith('/api/auth/forgot-password') ||
                    pathname.startsWith('/api/auth/logout');

  const token = request.cookies.get('auth_token')?.value;

  // Protect API routes (excluding auth endpoints)
  if (pathname.startsWith('/api')) {
    // If it's a general API route or a non-whitelisted auth route
    if (!pathname.startsWith('/api/auth') || (pathname.startsWith('/api/auth') && !isAuthApi)) {
      if (!token) {
        return NextResponse.json(
          { success: false, message: 'Unauthorized' },
          { status: 401 }
        );
      }
    }
  }

  // Protect admin panel pages
  if (pathname.startsWith('/admin')) {
    if (!token) {
      // Redirect to home/login screen
      const loginUrl = new URL('/', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
