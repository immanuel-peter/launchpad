import { NextResponse } from "next/server";
import { db } from "@/db";
import { studentProfiles } from "@/db/schema";
import { requireRole } from "@/lib/auth/require";
import { parseResumeLinks } from "@/lib/ai/parsing";
import { parsePdf } from "@/lib/pdf-parser";
import { eq } from "drizzle-orm";

// Force Node.js runtime for PDF parsing (uses child processes)
export const runtime = 'nodejs';

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

  const parsedLinks = await parseResumeLinks(resumeText);

  const [updated] = await db
    .update(studentProfiles)
    .set({
      linkedinUrl: profile.linkedinUrl || parsedLinks.linkedin_url,
      githubUrl: profile.githubUrl || parsedLinks.github_url,
      portfolioUrl: profile.portfolioUrl || parsedLinks.portfolio_url,
      updatedAt: new Date(),
    })
    .where(eq(studentProfiles.id, profile.id))
    .returning();

  return NextResponse.json({
    linkedin_url: updated.linkedinUrl,
    github_url: updated.githubUrl,
    portfolio_url: updated.portfolioUrl,
  });
}
