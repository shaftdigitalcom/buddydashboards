import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { envClient } from "@/lib/env.client";

const PROTECTED_PREFIXES = ["/dashboard", "/settings", "/onboarding"];
const AUTH_ROUTES = ["/login", "/register"];

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    envClient.NEXT_PUBLIC_SUPABASE_URL,
    envClient.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options?: any) {
          response.cookies.set(name, value, options);
        },
        remove(name: string) {
          response.cookies.delete(name);
        },
      } as any,
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { pathname, search } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
  const isAuthRoute = AUTH_ROUTES.includes(pathname);

  if (!session && isProtected) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirectTo", `${pathname}${search}`);
    return NextResponse.redirect(redirectUrl);
  }

  if (session && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/settings/:path*", "/onboarding/:path*", "/login", "/register"],
};
