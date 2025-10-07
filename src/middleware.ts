import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Environment variables for Edge Runtime
// Note: These must be defined at the module level for Edge Runtime to access them
// In some dev setups, process.env may not be injected into Middleware.
// Provide safe fallbacks using your public Supabase URL and anon key (anon key is safe to expose).
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://jlfedjiwqvujzihwamgk.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpsZmVkaml3cXZ1anppaHdhbWdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3MjU1MzUsImV4cCI6MjA3NTMwMTUzNX0.aIEMItTDI6eiKxSRA4H_QEzHsvRQi6WX3KyYJN3Uwd0";

const PROTECTED_PATHS = ["/dashboard"];
const PUBLIC_ONLY_PATHS = [
  "/",
  "/landing",
  "/login",
  "/signup",
  "/confirm-email",
  "/reset-password",
  "/design-system",
  "/setup-required",
];

function matchesPath(pathname: string, candidate: string) {
  if (candidate === "/") {
    return pathname === "/";
  }

  return pathname === candidate || pathname.startsWith(`${candidate}/`);
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set({
          name,
          value,
          ...options,
        });
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        response.cookies.set({
          name,
          value,
          ...options,
        });
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set({
          name,
          value: "",
          ...options,
        });
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        response.cookies.set({
          name,
          value: "",
          ...options,
        });
      },
    },
  });

  const [
    {
      data: { user },
    },
    sessionResult,
  ] = await Promise.all([supabase.auth.getUser(), supabase.auth.getSession()]);

  const pathname = request.nextUrl.pathname.replace(/\/$/, "") || "/";
  const isProtectedPath = PROTECTED_PATHS.some((path) =>
    matchesPath(pathname, path)
  );
  const isPublicOnlyPath = PUBLIC_ONLY_PATHS.some((path) =>
    matchesPath(pathname, path)
  );

  const copyCookiesTo = (target: NextResponse) => {
    for (const cookie of response.cookies.getAll()) {
      target.cookies.set(cookie);
    }
    return target;
  };

  if (!user && isProtectedPath) {
    const redirectResponse = NextResponse.redirect(
      new URL("/login", request.url)
    );
    return copyCookiesTo(redirectResponse);
  }

  if (user && isPublicOnlyPath) {
    const redirectResponse = NextResponse.redirect(
      new URL("/dashboard", request.url)
    );
    return copyCookiesTo(redirectResponse);
  }

  if (sessionResult.error) {
    return response;
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
