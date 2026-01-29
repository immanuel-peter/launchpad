import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";

const protectedPrefixes = ["/student", "/startup"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));

  if (!isProtected) {
    return NextResponse.next();
  }

  const token = request.cookies.get("launchpad_session")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/auth", request.url));
  }

  try {
    const payload = await verifyToken(token);
    if (pathname.startsWith("/student") && payload.role !== "student") {
      return NextResponse.redirect(new URL("/startup", request.url));
    }
    if (pathname.startsWith("/startup") && payload.role !== "startup") {
      return NextResponse.redirect(new URL("/student", request.url));
    }
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/auth", request.url));
  }
}

export const config = {
  matcher: ["/student/:path*", "/startup/:path*"],
};
