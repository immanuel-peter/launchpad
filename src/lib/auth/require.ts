import { getAuthCookie } from "@/lib/auth/server";
import { verifyToken } from "@/lib/auth/jwt";
import type { UserRole } from "@/lib/types";

export async function requireAuth() {
  const token = await getAuthCookie();
  if (!token) {
    return null;
  }
  try {
    return await verifyToken(token);
  } catch {
    return null;
  }
}

export async function requireRole(role: UserRole) {
  const payload = await requireAuth();
  if (!payload || payload.role !== role) {
    return null;
  }
  return payload;
}
