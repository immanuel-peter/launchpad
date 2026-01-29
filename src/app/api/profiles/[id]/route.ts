import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { profiles } from "@/db/schema";
import { requireAuth } from "@/lib/auth/require";
import { eq } from "drizzle-orm";

const serializeProfile = (profile: typeof profiles.$inferSelect) => ({
  id: profile.id,
  email: profile.email,
  role: profile.role,
  full_name: profile.fullName,
  avatar_url: profile.avatarUrl,
  created_at: profile.createdAt,
  updated_at: profile.updatedAt,
});

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (!auth) {
    return NextResponse.json({ message: "Not authenticated." }, { status: 401 });
  }

  const { id: paramId } = await context.params;
  const id = paramId === "me" ? auth.sub : paramId;
  if (id !== auth.sub) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  const [profile] = await db.select().from(profiles).where(eq(profiles.id, id));
  if (!profile) {
    return NextResponse.json({ message: "Profile not found." }, { status: 404 });
  }

  return NextResponse.json(serializeProfile(profile));
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (!auth) {
    return NextResponse.json({ message: "Not authenticated." }, { status: 401 });
  }

  const { id: paramId } = await context.params;
  const id = paramId === "me" ? auth.sub : paramId;
  if (id !== auth.sub) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  const body = await request.json();
  const { full_name, avatar_url } = body as {
    full_name?: string | null;
    avatar_url?: string | null;
  };

  const [updated] = await db
    .update(profiles)
    .set({
      fullName: full_name ?? null,
      avatarUrl: avatar_url ?? null,
      updatedAt: new Date(),
    })
    .where(eq(profiles.id, id))
    .returning();

  return NextResponse.json(serializeProfile(updated));
}
