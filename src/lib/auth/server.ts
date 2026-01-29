import { cookies } from "next/headers";
import type { AuthUser } from "@/lib/types";
import { SESSION_MAX_AGE, signToken, verifyToken, type AuthTokenPayload } from "@/lib/auth/jwt";

const SESSION_COOKIE = "launchpad_session";

export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
}

export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: "/",
  });
}

export async function getAuthCookie() {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value ?? null;
}

export function toAuthUser(payload: AuthTokenPayload): AuthUser {
  return { id: payload.sub, email: payload.email, role: payload.role };
}
