import { NextRequest, NextResponse } from "next/server"

// For static export, we can't use server-side middleware with Firebase Admin
// This is a simplified middleware that just passes through all requests
export function middleware(request: NextRequest) {
  return NextResponse.next()
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     * - api (API routes)
     */
    "/((?!_next/static|_next/image|favicon.ico|public|api).*)",
  ],
} 