import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Define role-based home pages
const ROLE_DASHBOARDS: Record<string, string> = {
  ES: "/es/dashboard",
  RC: "/rc/dashboard",
  FIN: "/fin/dashboard",
  Manager: "/manager/dashboard",
  ADMIN: "/manager/dashboard",
  "Dist User": "/es/dashboard", // District users use ES interface
  "Data Entry": "/rc/dashboard", // Data entry uses RC interface
};

// Public routes that don't require authentication
const PUBLIC_ROUTES = ["/login"];

// API routes to exclude from middleware
const API_ROUTES = ["/api"];

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const userRole = req.auth?.user?.role;

  // Allow API routes through
  if (API_ROUTES.some((route) => nextUrl.pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Allow public routes
  const isPublicRoute = PUBLIC_ROUTES.includes(nextUrl.pathname);
  
  if (!isLoggedIn && !isPublicRoute) {
    // Redirect to login if not authenticated
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isLoggedIn && isPublicRoute) {
    // Redirect logged-in users away from login page to their dashboard
    const dashboardUrl = userRole ? ROLE_DASHBOARDS[userRole] : "/es/dashboard";
    return NextResponse.redirect(new URL(dashboardUrl, req.url));
  }

  // Home page redirect
  if (isLoggedIn && nextUrl.pathname === "/") {
    const dashboardUrl = userRole ? ROLE_DASHBOARDS[userRole] : "/es/dashboard";
    return NextResponse.redirect(new URL(dashboardUrl, req.url));
  }

  // Role-based access control for specific routes
  if (isLoggedIn && userRole) {
    const path = nextUrl.pathname;

    // ES routes - accessible by ES, Dist User
    if (path.startsWith("/es/") && !["ES", "Dist User"].includes(userRole)) {
      return NextResponse.redirect(new URL(ROLE_DASHBOARDS[userRole] || "/", req.url));
    }

    // RC routes - accessible by RC, Data Entry
    if (path.startsWith("/rc/") && !["RC", "Data Entry"].includes(userRole)) {
      return NextResponse.redirect(new URL(ROLE_DASHBOARDS[userRole] || "/", req.url));
    }

    // FIN routes - accessible by FIN only
    if (path.startsWith("/fin/") && userRole !== "FIN") {
      return NextResponse.redirect(new URL(ROLE_DASHBOARDS[userRole] || "/", req.url));
    }

    // Manager routes - accessible by Manager, ADMIN
    if (path.startsWith("/manager/") && !["Manager", "ADMIN"].includes(userRole)) {
      return NextResponse.redirect(new URL(ROLE_DASHBOARDS[userRole] || "/", req.url));
    }
  }

  return NextResponse.next();
});

// Configure which routes should run the proxy
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.svg$).*)",
  ],
};
