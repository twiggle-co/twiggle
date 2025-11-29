import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

/**
 * Protected routes that require authentication
 */
const PROTECTED_ROUTES = ["/dashboard", "/project", "/leaflet"]

/**
 * Check if a path is a protected route
 */
function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some((route) => pathname.startsWith(route))
}

/**
 * Get session token from cookies
 * Supports both NextAuth v5 and legacy cookie names
 */
function getSessionToken(request: NextRequest): string | null {
  return (
    request.cookies.get("authjs.session-token")?.value ||
    request.cookies.get("__Secure-authjs.session-token")?.value ||
    request.cookies.get("next-auth.session-token")?.value ||
    request.cookies.get("__Secure-next-auth.session-token")?.value ||
    null
  )
}

/**
 * Middleware to protect routes
 */
export async function middleware(request: NextRequest) {
  const sessionToken = getSessionToken(request)
  const isProtected = isProtectedRoute(request.nextUrl.pathname)

  // Redirect to sign in if accessing protected route without session
  if (isProtected && !sessionToken) {
    const signInUrl = new URL("/api/auth/signin", request.url)
    signInUrl.searchParams.set("callbackUrl", request.nextUrl.pathname)
    return NextResponse.redirect(signInUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
