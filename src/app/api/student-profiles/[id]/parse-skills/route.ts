import { NextResponse } from "next/server";
import { db } from "@/db";
import { profiles, studentProfiles } from "@/db/schema";
import { requireRole } from "@/lib/auth/require";
import { generateStudentEmbedding } from "@/lib/ai/embeddings";
import { parseResumeSkills } from "@/lib/ai/parsing";
import { parsePdf } from "@/lib/pdf-parser";
import { eq } from "drizzle-orm";

async function getProfile(authUserId: string, paramId: string) {
  const [profile] =
    paramId === "me"
      ? await db.select().from(studentProfiles).where(eq(studentProfiles.userId, authUserId))
      : await db.select().from(studentProfiles).where(eq(studentProfiles.id, paramId));

  if (!profile) {
    return { error: NextResponse.json({ message: "Student profile not found." }, { status: 404 }) };
  }

  if (profile.userId !== authUserId) {
    return { error: NextResponse.json({ message: "Forbidden." }, { status: 403 }) };
  }

  return { profile };
}

const mergeSkills = (existing: string[] | null, incoming: string[]) => {
  const seen = new Set((existing ?? []).map((skill) => skill.toLowerCase()));
  const merged = [...(existing ?? [])];
  for (const skill of incoming) {
    const normalized = skill.toLowerCase();
    if (!seen.has(normalized)) {
      seen.add(normalized);
      merged.push(skill);
    }
  }
  return merged;
};

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireRole("student");
  if (!auth) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  const { id } = await context.params;
  const { profile, error } = await getProfile(auth.sub, id);
  if (error) {
    return error;
  }

  if (!profile.resumeUrl) {
    return NextResponse.json({ message: "Resume not uploaded." }, { status: 400 });
  }

  // Lazy-load storage module to avoid Turbopack static analysis of AWS SDK
  const { extractKeyFromPublicUrl, getFileBuffer } = await import("@/lib/storage");

  const key = extractKeyFromPublicUrl(profile.resumeUrl);
  if (!key) {
    return NextResponse.json({ message: "Resume URL is invalid." }, { status: 400 });
  }

  const buffer = await getFileBuffer(key);
  const parsedPdf = await parsePdf(buffer);
  const resumeText = parsedPdf.text?.trim();

  if (!resumeText) {
    return NextResponse.json({ message: "Unable to read resume text." }, { status: 400 });
  }

  const parsedSkills = await parseResumeSkills(resumeText);
  const mergedSkills = mergeSkills(profile.skills, parsedSkills);

  const [userProfile] = await db
    .select({ fullName: profiles.fullName })
    .from(profiles)
    .where(eq(profiles.id, profile.userId));

  const embedding = await generateStudentEmbedding({
    fullName: userProfile?.fullName ?? null,
    university: profile.university,
    major: profile.major,
    graduationYear: profile.graduationYear,
    bio: profile.bio,
    skills: mergedSkills,
  });

  const [updated] = await db
    .update(studentProfiles)
    .set({
      skills: mergedSkills,
      embedding,
      updatedAt: new Date(),
    })
    .where(eq(studentProfiles.id, profile.id))
    .returning();

  return NextResponse.json({ skills: updated.skills ?? [] });
}
