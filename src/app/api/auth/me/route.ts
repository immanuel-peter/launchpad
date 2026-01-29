import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { profiles } from "@/db/schema";
import { getAuthCookie, toAuthUser } from "@/lib/auth/server";
import { verifyToken } from "@/lib/auth/jwt";
import { eq } from "drizzle-orm";

const serializeProfile = (profile: typeof profiles.$inferSelect) => ({
  id: profile.id,
  email: profile.email,
  role: profile.role,
  full_name: profile.fullName,
  avatar_url: profile.avatarUrl,
});

export async function GET() {
  const token = await getAuthCookie();
  if (!token) {
    return NextResponse.json({ message: "Not authenticated." }, { status: 401 });
  }

  try {
    const payload = await verifyToken(token);
    const [profile] = await db.select().from(profiles).where(eq(profiles.id, payload.sub));
    if (!profile) {
      return NextResponse.json({ message: "Profile not found." }, { status: 404 });
    }

    return NextResponse.json({
      user: toAuthUser({ sub: profile.id, email: profile.email, role: profile.role }),
      profile: serializeProfile(profile),
    });
  } catch {
    return NextResponse.json({ message: "Invalid session." }, { status: 401 });
  }
}
