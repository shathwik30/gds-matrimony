import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { db, siteSettings } from "@/lib/db";
import { eq } from "drizzle-orm";

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
  "/staff",
];

// Routes that should redirect to dashboard if already logged in
const authRoutes = ["/login", "/register", "/forgot-password", "/reset-password"];

// Dashboard routes that normal users access but admins/staff should not
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

// Staff-only routes
const staffOnlyRoutes = ["/staff"];

export default auth(async (req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const isAdmin = !!req.auth?.user?.isAdmin;
  const isStaff = !!req.auth?.user?.isStaff;

  const isProtectedRoute = protectedRoutes.some((route) => nextUrl.pathname.startsWith(route));
  const isAuthRoute = authRoutes.some((route) => nextUrl.pathname.startsWith(route));
  const isUserOnlyRoute = userOnlyRoutes.some((route) => nextUrl.pathname.startsWith(route));
  const isStaffOnlyRoute = staffOnlyRoutes.some((route) => nextUrl.pathname.startsWith(route));

  // Check maintenance mode - block public access but allow admin and API routes
  if (!isAdmin && !nextUrl.pathname.startsWith("/admin") && !nextUrl.pathname.startsWith("/api")) {
    try {
      const [maintenance] = await db
        .select({ value: siteSettings.value })
        .from(siteSettings)
        .where(eq(siteSettings.key, "maintenanceMode"))
        .limit(1);
      if (maintenance?.value === "true") {
        // Allow login page so admins can log in
        if (!isAuthRoute) {
          return new NextResponse(
            `<!DOCTYPE html><html><head><title>Under Maintenance</title></head>
            <body style="display:flex;justify-content:center;align-items:center;min-height:100vh;font-family:sans-serif;background:#f9fafb;margin:0;">
              <div style="text-align:center;padding:2rem;">
                <h1 style="color:#C00F0C;font-size:2rem;">Under Maintenance</h1>
                <p style="color:#666;font-size:1.1rem;margin-top:1rem;">We are currently performing scheduled maintenance. Please check back shortly.</p>
              </div>
            </body></html>`,
            { status: 503, headers: { "Content-Type": "text/html", "Retry-After": "3600" } }
          );
        }
      }
    } catch {
      // Don't block requests if settings query fails
    }
  }

  const homeRoute = isAdmin ? "/admin" : isStaff ? "/staff" : "/dashboard";

  // Redirect logged-in users away from auth pages
  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL(homeRoute, nextUrl));
  }

  // Redirect logged-in users from landing page
  if (nextUrl.pathname === "/" && isLoggedIn) {
    return NextResponse.redirect(new URL(homeRoute, nextUrl));
  }

  // Redirect staff away from user/admin routes to staff panel
  if (isStaff && isLoggedIn && (isUserOnlyRoute || nextUrl.pathname.startsWith("/admin"))) {
    return NextResponse.redirect(new URL("/staff", nextUrl));
  }

  // Redirect admin users away from normal user routes to admin panel
  // Allow admins to view public profiles (e.g. /profile/123) from admin panel
  const isViewingPublicProfile = /^\/profile\/\d+/.test(nextUrl.pathname);
  if (isUserOnlyRoute && isLoggedIn && isAdmin && !isViewingPublicProfile) {
    return NextResponse.redirect(new URL("/admin", nextUrl));
  }

  // Redirect non-staff users away from staff routes
  if (isStaffOnlyRoute && isLoggedIn && !isStaff) {
    return NextResponse.redirect(new URL(isAdmin ? "/admin" : "/dashboard", nextUrl));
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
