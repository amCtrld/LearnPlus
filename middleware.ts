/**
 * Next.js middleware for route protection and security headers
 * Ensures only authenticated users can access protected routes
 * 
 * Protected routes: /select-mode, /dashboard, /problem/*
 * Public routes: /, /access-code
 * Admin routes: /admin/* (protected separately via API key)
 * 
 * Security Features:
 * - Cookie-based session validation
 * - Automatic redirect to access code page for unauthenticated users
 * - Admin routes allowed (protected by API routes)
 * - API routes exempt from middleware (handle own auth)
 * - Security headers (CSP, HSTS, etc.)
 */

import { NextRequest, NextResponse } from 'next/server';

const protectedRoutes = ['/select-mode', '/dashboard', '/problem'];
const publicRoutes = ['/', '/access-code'];
const adminRoutes = ['/admin'];

/**
 * Add security headers to response
 */
function addSecurityHeaders(response: NextResponse): NextResponse {
  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://api.openai.com",
      "frame-ancestors 'none'",
    ].join('; ')
  );
  
  // Strict Transport Security (HTTPS only)
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains'
  );
  
  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  // XSS Protection (legacy, but doesn't hurt)
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Referrer Policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions Policy (restrict browser features)
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );
  
  return response;
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip middleware for API routes (they handle their own authentication)
  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Allow admin routes (protected by API key authentication in API routes)
  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));
  if (isAdminRoute) {
    const response = NextResponse.next();
    return addSecurityHeaders(response);
  }

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));
  const isPublicRoute = publicRoutes.includes(pathname);

  // Allow public routes
  if (isPublicRoute) {
    const response = NextResponse.next();
    return addSecurityHeaders(response);
  }

  // For protected routes, verify authentication via cookie
  if (isProtectedRoute) {
    // Check for auth cookie (set by client after successful access code verification)
    const authToken = request.cookies.get('auth-token')?.value;
    const userId = request.cookies.get('user-id')?.value;

    // If no auth credentials, redirect to access code page
    if (!authToken || !userId) {
      const url = request.nextUrl.clone();
      url.pathname = '/access-code';
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }

    // TODO: In Phase 7, add Firebase Auth token verification here
    // For now, presence of cookie is sufficient (client-side auth handled by Firebase)
    const response = NextResponse.next();
    return addSecurityHeaders(response);
  }

  // Allow all other routes with security headers
  const response = NextResponse.next();
  return addSecurityHeaders(response);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.svg).*)',
  ],
};
