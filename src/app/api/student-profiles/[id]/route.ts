import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { profiles, studentProfiles } from "@/db/schema";
import { requireAuth } from "@/lib/auth/require";
import { generateStudentEmbedding } from "@/lib/ai/embeddings";
import { eq } from "drizzle-orm";

const serializeStudentProfile = (profile: typeof studentProfiles.$inferSelect) => ({
  id: profile.id,
  user_id: profile.userId,
  university: profile.university,
  major: profile.major,
  graduation_year: profile.graduationYear,
  bio: profile.bio,
  skills: profile.skills,
  resume_url: profile.resumeUrl,
  linkedin_url: profile.linkedinUrl,
  github_url: profile.githubUrl,
  portfolio_url: profile.portfolioUrl,
  created_at: profile.createdAt,
  updated_at: profile.updatedAt,
});

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (!auth) {
    return NextResponse.json({ message: "Not authenticated." }, { status: 401 });
  }

  const { id } = await context.params;
  if (id === "me") {
    const [profile] = await db
      .select()
      .from(studentProfiles)
      .where(eq(studentProfiles.userId, auth.sub));
    if (!profile) {
      return NextResponse.json({ message: "Student profile not found." }, { status: 404 });
    }
    return NextResponse.json(serializeStudentProfile(profile));
  }

  const [profile] = await db
    .select()
    .from(studentProfiles)
    .where(eq(studentProfiles.id, id));

  if (!profile) {
    return NextResponse.json({ message: "Student profile not found." }, { status: 404 });
  }

  if (auth.role === "student" && profile.userId !== auth.sub) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  return NextResponse.json(serializeStudentProfile(profile));
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (!auth || auth.role !== "student") {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  const body = await request.json();
  const { id: paramId } = await context.params;
  const targetId = paramId === "me" ? null : paramId;

  const [profile] = targetId
    ? await db.select().from(studentProfiles).where(eq(studentProfiles.id, targetId))
    : await db.select().from(studentProfiles).where(eq(studentProfiles.userId, auth.sub));

  if (!profile) {
    return NextResponse.json({ message: "Student profile not found." }, { status: 404 });
  }

  if (profile.userId !== auth.sub) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  const [userProfile] = await db
    .select({ fullName: profiles.fullName })
    .from(profiles)
    .where(eq(profiles.id, auth.sub));

  const embedding = await generateStudentEmbedding({
    fullName: userProfile?.fullName ?? null,
    university: body.university ?? profile.university,
    major: body.major ?? profile.major,
    graduationYear: body.graduation_year ?? profile.graduationYear,
    bio: body.bio ?? profile.bio,
    skills: body.skills ?? profile.skills,
  });

  const [updated] = await db
    .update(studentProfiles)
    .set({
      university: body.university ?? null,
      major: body.major ?? null,
      graduationYear: body.graduation_year ?? null,
      bio: body.bio ?? null,
      skills: body.skills ?? null,
      linkedinUrl: body.linkedin_url ?? null,
      githubUrl: body.github_url ?? null,
      portfolioUrl: body.portfolio_url ?? null,
      embedding,
      updatedAt: new Date(),
    })
    .where(eq(studentProfiles.id, profile.id))
    .returning();

  return NextResponse.json(serializeStudentProfile(updated));
}
