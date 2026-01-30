import { NextResponse } from "next/server";
import { db } from "@/db";
import { studentProfiles } from "@/db/schema";
import { requireRole } from "@/lib/auth/require";
import { eq } from "drizzle-orm";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

const sanitizeFileName = (name: string) =>
  name
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .slice(0, 80);

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

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireRole("student");
  if (!auth) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  const { id } = await context.params;
  const { profile, error } = await getProfile(auth.sub, id);
  if (error) {
    return error;
  }

  const formData = await request.formData();
  const file = formData.get("resume");

  if (!(file instanceof File)) {
    return NextResponse.json({ message: "Resume file is required." }, { status: 400 });
  }

  if (!file.type.includes("pdf") && !file.name.toLowerCase().endsWith(".pdf")) {
    return NextResponse.json({ message: "Resume must be a PDF." }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json({ message: "Resume must be smaller than 10MB." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const fileName = sanitizeFileName(file.name || "resume.pdf") || "resume.pdf";
  const key = `resumes/${profile.userId}/${Date.now()}-${fileName}`;

  // Lazy-load storage module to avoid Turbopack static analysis of AWS SDK
  const { uploadFile, deleteFile, extractKeyFromPublicUrl } = await import("@/lib/storage");

  if (profile.resumeUrl) {
    const previousKey = extractKeyFromPublicUrl(profile.resumeUrl);
    if (previousKey) {
      await deleteFile(previousKey);
    }
  }

  const { url } = await uploadFile({
    key,
    body: buffer,
    contentType: "application/pdf",
  });

  const [updated] = await db
    .update(studentProfiles)
    .set({
      resumeUrl: url,
      updatedAt: new Date(),
    })
    .where(eq(studentProfiles.id, profile.id))
    .returning();

  return NextResponse.json({ resume_url: updated.resumeUrl });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireRole("student");
  if (!auth) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  const { id } = await context.params;
  const { profile, error } = await getProfile(auth.sub, id);
  if (error) {
    return error;
  }

  // Lazy-load storage module to avoid Turbopack static analysis of AWS SDK
  const { deleteFile, extractKeyFromPublicUrl } = await import("@/lib/storage");

  if (profile.resumeUrl) {
    const key = extractKeyFromPublicUrl(profile.resumeUrl);
    if (key) {
      await deleteFile(key);
    }
  }

  await db
    .update(studentProfiles)
    .set({
      resumeUrl: null,
      updatedAt: new Date(),
    })
    .where(eq(studentProfiles.id, profile.id));

  return NextResponse.json({ resume_url: null });
}
