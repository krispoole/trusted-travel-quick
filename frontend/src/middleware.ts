import { NextRequest, NextResponse } from "next/server"
import { getAuth } from "firebase-admin/auth"
import { initializeApp, cert, getApps } from "firebase-admin/app"

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  })
}

// Routes that require authentication
const authRoutes = ["/dashboard", "/profile", "/settings"]

// Routes that are exempt from email verification
const verificationExemptRoutes = [
  "/auth/login", 
  "/auth/verify-email", 
  "/auth/verify-email-success"
]

export async function middleware(request: NextRequest) {
  const session = request.cookies.get("__session")?.value
  const pathname = request.nextUrl.pathname

  // Check if the route requires authentication
  const requiresAuth = authRoutes.some(route => pathname.startsWith(route))

  if (!requiresAuth) {
    // If the route doesn't require auth, continue
    return NextResponse.next()
  }

  // If no session cookie, redirect to login
  if (!session) {
    return redirectToLogin(request)
  }

  try {
    // Verify the session cookie
    const decodedClaims = await getAuth().verifySessionCookie(session, true)
    const uid = decodedClaims.uid

    // Get the user to check email verification
    const user = await getAuth().getUser(uid)

    // If email is not verified and the route is not exempt, redirect to verification page
    if (!user.emailVerified && !verificationExemptRoutes.includes(pathname)) {
      return redirectToVerification(request)
    }

    // User is authenticated and email is verified, continue
    return NextResponse.next()
  } catch (error) {
    // Invalid session cookie, redirect to login
    console.error("Error verifying session cookie:", error)
    return redirectToLogin(request)
  }
}

// Redirect to login page
function redirectToLogin(request: NextRequest) {
  const url = request.nextUrl.clone()
  url.pathname = "/auth/login"
  url.searchParams.set("from", request.nextUrl.pathname)
  return NextResponse.redirect(url)
}

// Redirect to email verification page
function redirectToVerification(request: NextRequest) {
  const url = request.nextUrl.clone()
  url.pathname = "/auth/verify-email"
  return NextResponse.redirect(url)
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