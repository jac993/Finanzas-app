import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseMiddlewareClient } from "@/lib/supabase/middleware";

const AUTH_ROUTES = new Set<string>(["/login", "/register"]);

export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const isAuthRoute = AUTH_ROUTES.has(pathname);
  const isDashboardRoute = pathname === "/dashboard" || pathname.startsWith("/dashboard/");

  const res = NextResponse.next();
  const supabase = createSupabaseMiddlewareClient(req, res);

  // Importante: getUser() valida el JWT con Supabase.
  const { data, error } = await supabase.auth.getUser();
  const user = error ? null : data.user;

  if (!user && isDashboardRoute) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }

  if (user && isAuthRoute) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register"],
};

