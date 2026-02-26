import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

// Routes that require authentication
const protectedRoutes = [
  "/dashboard",
  "/matches",
  "/interests",
  "/messages",
  "/profile",
  "/settings",
  "/membership",
  "/activity",
  "/shortlist",
  "/contact-packs",
  "/admin",
];

// Routes that should redirect to dashboard if already logged in
const authRoutes = ["/login", "/register", "/forgot-password", "/reset-password"];

// Dashboard routes that normal users access but admins should not
const userOnlyRoutes = [
  "/dashboard",
  "/matches",
  "/interests",
  "/messages",
  "/profile",
  "/settings",
  "/membership",
  "/activity",
  "/shortlist",
  "/contact-packs",
];

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const isAdmin = !!req.auth?.user?.isAdmin;

  const isProtectedRoute = protectedRoutes.some((route) => nextUrl.pathname.startsWith(route));
  const isAuthRoute = authRoutes.some((route) => nextUrl.pathname.startsWith(route));
  const isUserOnlyRoute = userOnlyRoutes.some((route) => nextUrl.pathname.startsWith(route));

  // Redirect logged-in users away from auth pages
  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL(isAdmin ? "/admin" : "/dashboard", nextUrl));
  }

  // Redirect logged-in users from landing page
  if (nextUrl.pathname === "/" && isLoggedIn) {
    return NextResponse.redirect(new URL(isAdmin ? "/admin" : "/dashboard", nextUrl));
  }

  // Redirect admin users away from normal user routes to admin panel
  // Allow admins to view public profiles (e.g. /profile/123) from admin panel
  const isViewingPublicProfile = /^\/profile\/\d+/.test(nextUrl.pathname);
  if (isUserOnlyRoute && isLoggedIn && isAdmin && !isViewingPublicProfile) {
    return NextResponse.redirect(new URL("/admin", nextUrl));
  }

  // Redirect non-logged-in users to login
  if (isProtectedRoute && !isLoggedIn) {
    // Only allow relative paths as callback URLs to prevent open redirect
    const rawPath = nextUrl.pathname + nextUrl.search;
    const callbackUrl = rawPath.startsWith("/")
      ? encodeURIComponent(rawPath)
      : encodeURIComponent("/dashboard");
    return NextResponse.redirect(new URL(`/login?callbackUrl=${callbackUrl}`, nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     * - public folder
     */
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|images|icons|.*\\.png|.*\\.jpg|.*\\.svg).*)",
  ],
};
