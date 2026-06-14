import { NextRequest, NextResponse } from "next/server";
import { verifyJWT } from "@/lib/jwt";

const PUBLIC_ROUTES = ["/", "/search", "/plots"];
const AUTH_ROUTES = ["/login", "/register", "/verify"];
const PROTECTED_ROUTES = ["/dashboard", "/plots/new"];
const ADMIN_ROUTES = ["/admin"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("auth-token")?.value;

  let payload = null;
  if (token) {
    try {
      payload = await verifyJWT(token);
    } catch {
      // Invalid token — treat as unauthenticated
    }
  }

  // Redirect logged-in users away from auth pages
  if (AUTH_ROUTES.some((r) => pathname.startsWith(r)) && payload) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Protect dashboard routes
  if (PROTECTED_ROUTES.some((r) => pathname.startsWith(r)) && !payload) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Protect admin routes
  if (ADMIN_ROUTES.some((r) => pathname.startsWith(r))) {
    if (!payload) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (payload.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // Attach user info to API routes via headers
  const requestHeaders = new Headers(req.headers);
  if (payload) {
    requestHeaders.set("x-user-id", payload.userId);
    requestHeaders.set("x-user-role", payload.role);
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
