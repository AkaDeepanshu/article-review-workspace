import { edgeAuth } from "easySLR/server/auth/edge";
import { NextResponse } from "next/server";

export default edgeAuth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  const protectedPaths = ["/orgs", "/projects"];
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));

  if (isProtected && !isLoggedIn) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === "/login" && isLoggedIn) {
    return NextResponse.redirect(new URL("/orgs", req.nextUrl.origin));
  }

  if (pathname === "/register" && isLoggedIn) {
    return NextResponse.redirect(new URL("/orgs", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/orgs/:path*", "/projects/:path*", "/login", "/register"],
};
