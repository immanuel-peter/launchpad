import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { applications, companies, jobs, profiles, studentProfiles } from "@/db/schema";
import { requireAuth, requireRole } from "@/lib/auth/require";
import { enqueueScoring } from "@/queue/scoring";
import { and, desc, eq } from "drizzle-orm";

export async function GET() {
  const auth = await requireAuth();
  if (!auth) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  if (auth.role === "student") {
    const [studentProfile] = await db
      .select()
      .from(studentProfiles)
      .where(eq(studentProfiles.userId, auth.sub));

    if (!studentProfile) {
      return NextResponse.json([]);
    }

    const rows = await db
      .select({
        id: applications.id,
        status: applications.status,
        applied_at: applications.appliedAt,
        cover_letter: applications.coverLetter,
        job_id: jobs.id,
        job_title: jobs.title,
        company_name: companies.name,
        company_logo_url: companies.logoUrl,
      })
      .from(applications)
      .leftJoin(jobs, eq(applications.jobId, jobs.id))
      .leftJoin(companies, eq(jobs.companyId, companies.id))
      .where(eq(applications.studentId, studentProfile.id))
      .orderBy(desc(applications.appliedAt));

    const results = rows.map(row => ({
      id: row.id,
      status: row.status,
      applied_at: row.applied_at,
      cover_letter: row.cover_letter,
      job: {
        id: row.job_id,
        title: row.job_title,
        company: {
          name: row.company_name,
          logo_url: row.company_logo_url,
        },
      },
    }));

    return NextResponse.json(results);
  }

  const [company] = await db.select().from(companies).where(eq(companies.userId, auth.sub));
  if (!company) {
    return NextResponse.json([]);
  }

  const rows = await db
    .select({
      id: applications.id,
      status: applications.status,
      applied_at: applications.appliedAt,
      score: applications.score,
      score_breakdown: applications.scoreBreakdown,
      job_id: jobs.id,
      job_title: jobs.title,
      student_id: studentProfiles.id,
      student_university: studentProfiles.university,
      user_full_name: profiles.fullName,
      user_email: profiles.email,
    })
    .from(applications)
    .leftJoin(jobs, eq(applications.jobId, jobs.id))
    .leftJoin(companies, eq(jobs.companyId, companies.id))
    .leftJoin(studentProfiles, eq(applications.studentId, studentProfiles.id))
    .leftJoin(profiles, eq(studentProfiles.userId, profiles.id))
    .where(eq(companies.id, company.id))
    .orderBy(desc(applications.appliedAt));

  const results = rows.map(row => ({
    id: row.id,
    status: row.status,
    applied_at: row.applied_at,
    score: row.score,
    score_breakdown: row.score_breakdown,
    job: {
      id: row.job_id,
      title: row.job_title,
    },
    student: {
      id: row.student_id,
      university: row.student_university,
      user: {
        full_name: row.user_full_name,
        email: row.user_email,
      },
    },
  }));

  return NextResponse.json(results);
}

export async function POST(request: Request) {
  const auth = await requireRole("student");
  if (!auth) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  const body = await request.json();
  const { job_id, cover_letter } = body as { job_id?: string; cover_letter?: string };

  if (!job_id) {
    return NextResponse.json({ message: "Job ID is required." }, { status: 400 });
  }

  const [studentProfile] = await db
    .select()
    .from(studentProfiles)
    .where(eq(studentProfiles.userId, auth.sub));

  if (!studentProfile) {
    return NextResponse.json({ message: "Student profile not found." }, { status: 404 });
  }

  const existing = await db
    .select()
    .from(applications)
    .where(and(eq(applications.jobId, job_id), eq(applications.studentId, studentProfile.id)));

  if (existing.length > 0) {
    return NextResponse.json({ message: "Already applied." }, { status: 409 });
  }

  const [created] = await db
    .insert(applications)
    .values({
      jobId: job_id,
      studentId: studentProfile.id,
      coverLetter: cover_letter ?? null,
      status: "scoring",
    })
    .returning();

  await enqueueScoring(created.id);

  return NextResponse.json(created, { status: 201 });
}
