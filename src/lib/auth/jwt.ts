import { SignJWT, jwtVerify } from "jose";
import type { UserRole } from "@/lib/types";

const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

export interface AuthTokenPayload {
  sub: string;
  email: string;
  role: UserRole;
}

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set");
  }
  return new TextEncoder().encode(secret);
}

export async function signToken(payload: AuthTokenPayload) {
  const secret = getJwtSecret();
  return new SignJWT({ email: payload.email, role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secret);
}

export async function verifyToken(token: string): Promise<AuthTokenPayload> {
  const secret = getJwtSecret();
  const { payload } = await jwtVerify(token, secret);
  return {
    sub: payload.sub as string,
    email: payload.email as string,
    role: payload.role as UserRole,
  };
}

export { SESSION_MAX_AGE };
