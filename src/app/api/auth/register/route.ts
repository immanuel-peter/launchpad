import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { companies, profiles, studentProfiles } from "@/db/schema";
import { hashPassword } from "@/lib/password";
import { signToken } from "@/lib/auth/jwt";
import { setAuthCookie, toAuthUser } from "@/lib/auth/server";
import { enqueueEmail } from "@/queue/email";
import { eq } from "drizzle-orm";

const serializeProfile = (profile: typeof profiles.$inferSelect) => ({
  id: profile.id,
  email: profile.email,
  role: profile.role,
  full_name: profile.fullName,
  avatar_url: profile.avatarUrl,
});

interface RegisterPayload {
  email: string;
  password: string;
  role: "student" | "startup";
  fullName?: string;
  companyName?: string;
}

export async function POST(request: Request) {
  const body = (await request.json()) as RegisterPayload;
  const { email, password, role, fullName, companyName } = body;

  if (!email || !password || !role) {
    return NextResponse.json({ message: "Missing required fields." }, { status: 400 });
  }

  const existing = await db.select().from(profiles).where(eq(profiles.email, email));
  if (existing.length > 0) {
    return NextResponse.json({ message: "User already registered." }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const userId = crypto.randomUUID();

  const [profile] = await db.transaction(async (tx) => {
    const [createdProfile] = await tx
      .insert(profiles)
      .values({
        id: userId,
        email,
        role,
        fullName: fullName ?? null,
        avatarUrl: null,
        passwordHash,
      })
      .returning();

    if (role === "student") {
      await tx.insert(studentProfiles).values({ userId });
    } else {
      await tx.insert(companies).values({
        userId,
        name: companyName?.trim() || "My Company",
      });
    }

    return [createdProfile];
  });

  try {
    console.log(`[Register] Enqueuing welcome email for:`, {
      email: profile.email,
      fullName: profile.fullName,
      role: profile.role,
    });
    await enqueueEmail({
      type: "welcome",
      email: profile.email,
      fullName: profile.fullName,
      role: profile.role,
    });
    console.log(`[Register] Welcome email enqueued successfully`);
  } catch (error) {
    console.error("[Register] Failed to enqueue welcome email", error);
  }

  const token = await signToken({ sub: profile.id, email: profile.email, role: profile.role });
  await setAuthCookie(token);

  return NextResponse.json({
    user: toAuthUser({ sub: profile.id, email: profile.email, role: profile.role }),
    profile: serializeProfile(profile),
  });
}
