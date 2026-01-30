import { NextResponse } from "next/server";
import { db } from "@/db";
import { studentProfiles } from "@/db/schema";
import { requireRole, requireAuth } from "@/lib/auth/require";
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

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  const { id } = await context.params;

  // Get the student profile
  const [profileRow] = await db
    .select()
    .from(studentProfiles)
    .where(eq(studentProfiles.id, id));

  if (!profileRow) {
    return NextResponse.json({ message: "Student profile not found." }, { status: 404 });
  }

  // Check access permissions
  // Students can only view their own resume, but startups/companies and unauthenticated users can view any student's resume
  if (auth?.role === "student" && profileRow.userId !== auth.sub) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  if (!profileRow.resumeUrl) {
    return NextResponse.json({ message: "Resume not found." }, { status: 404 });
  }

  // Lazy-load storage module to avoid Turbopack static analysis of AWS SDK
  const { extractKeyFromPublicUrl, getFileBuffer } = await import("@/lib/storage");

  const key = extractKeyFromPublicUrl(profileRow.resumeUrl);
  if (!key) {
    return NextResponse.json({ message: "Resume URL is invalid." }, { status: 400 });
  }

  try {
    const buffer = await getFileBuffer(key);
    
    // Return the PDF with proper headers for iframe embedding
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="resume.pdf"`,
        "Cache-Control": "public, max-age=3600",
        // CORS headers to allow iframe embedding
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch (error) {
    console.error("Error fetching resume:", error);
    return NextResponse.json({ message: "Failed to fetch resume." }, { status: 500 });
  }
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
