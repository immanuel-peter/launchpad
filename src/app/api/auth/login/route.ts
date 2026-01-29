import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { profiles } from "@/db/schema";
import { verifyPassword } from "@/lib/password";
import { signToken } from "@/lib/auth/jwt";
import { setAuthCookie, toAuthUser } from "@/lib/auth/server";
import { eq } from "drizzle-orm";

const serializeProfile = (profile: typeof profiles.$inferSelect) => ({
  id: profile.id,
  email: profile.email,
  role: profile.role,
  full_name: profile.fullName,
  avatar_url: profile.avatarUrl,
});

interface LoginPayload {
  email: string;
  password: string;
}

export async function POST(request: Request) {
  const body = (await request.json()) as LoginPayload;
  const { email, password } = body;

  if (!email || !password) {
    return NextResponse.json({ message: "Email and password are required." }, { status: 400 });
  }

  const [profile] = await db.select().from(profiles).where(eq(profiles.email, email));
  if (!profile) {
    return NextResponse.json({ message: "Invalid login credentials." }, { status: 401 });
  }

  const validPassword = await verifyPassword(password, profile.passwordHash);
  if (!validPassword) {
    return NextResponse.json({ message: "Invalid login credentials." }, { status: 401 });
  }

  const token = await signToken({ sub: profile.id, email: profile.email, role: profile.role });
  await setAuthCookie(token);

  return NextResponse.json({
    user: toAuthUser({ sub: profile.id, email: profile.email, role: profile.role }),
    profile: serializeProfile(profile),
  });
}
