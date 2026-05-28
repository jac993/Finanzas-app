import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseMiddlewareClient } from "@/lib/supabase/middleware";

export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const res = NextResponse.next();

  try {
    const supabase = createSupabaseMiddlewareClient(req, res);
    const { data, error } = await supabase.auth.getUser();
    const user = error ? null : data.user;

    if (!user) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname + search);
      return NextResponse.redirect(url);
    }

    return res;
  } catch {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }
}

export const config = {
  // Solo protegemos el dashboard. /login y /register deben cargar siempre.
  matcher: ["/dashboard/:path*"],
};
