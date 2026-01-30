import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { applications, companies, jobs, studentProfiles } from "@/db/schema";
import { requireAuth } from "@/lib/auth/require";
import { eq } from "drizzle-orm";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (!auth) {
    return NextResponse.json({ message: "Not authenticated." }, { status: 401 });
  }

  const { id } = await context.params;
  const [record] = await db
    .select({
      id: applications.id,
      status: applications.status,
      score: applications.score,
      score_breakdown: applications.scoreBreakdown,
      applied_at: applications.appliedAt,
      job: {
        id: jobs.id,
        title: jobs.title,
        company: {
          id: companies.id,
          name: companies.name,
        },
      },
      student: {
        id: studentProfiles.id,
        user_id: studentProfiles.userId,
      },
      company_owner: companies.userId,
    })
    .from(applications)
    .leftJoin(jobs, eq(applications.jobId, jobs.id))
    .leftJoin(companies, eq(jobs.companyId, companies.id))
    .leftJoin(studentProfiles, eq(applications.studentId, studentProfiles.id))
    .where(eq(applications.id, id));

  if (!record) {
    return NextResponse.json({ message: "Application not found." }, { status: 404 });
  }

  if (auth.role === "student" && record.student?.user_id !== auth.sub) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  if (auth.role === "startup" && record.company_owner !== auth.sub) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  if (auth.role === "student") {
    const { score, score_breakdown, ...rest } = record;
    return NextResponse.json(rest);
  }

  return NextResponse.json(record);
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (!auth || auth.role !== "startup") {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  const body = await request.json();
  const status = body.status as string | undefined;

  if (!status) {
    return NextResponse.json({ message: "Status is required." }, { status: 400 });
  }

  const { id } = await context.params;
  const [record] = await db
    .select({
      id: applications.id,
      companyOwner: companies.userId,
    })
    .from(applications)
    .leftJoin(jobs, eq(applications.jobId, jobs.id))
    .leftJoin(companies, eq(jobs.companyId, companies.id))
    .where(eq(applications.id, id));

  if (!record) {
    return NextResponse.json({ message: "Application not found." }, { status: 404 });
  }

  if (record.companyOwner !== auth.sub) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  const [updated] = await db
    .update(applications)
    .set({ status, updatedAt: new Date() })
    .where(eq(applications.id, record.id))
    .returning();

  return NextResponse.json(updated);
}
