import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { applications, companies, companyWorkflows, jobs, profiles, studentProfiles } from "@/db/schema";
import { requireAuth } from "@/lib/auth/require";
import { enqueueEmail } from "@/queue/email";
import { eq } from "drizzle-orm";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (!auth) {
    return NextResponse.json({ message: "Not authenticated." }, { status: 401 });
  }

  const { id } = await context.params;
  const [row] = await db
    .select({
      id: applications.id,
      status: applications.status,
      score: applications.score,
      score_breakdown: applications.scoreBreakdown,
      applied_at: applications.appliedAt,
      job_id: jobs.id,
      job_title: jobs.title,
      company_id: companies.id,
      company_name: companies.name,
      student_id: studentProfiles.id,
      student_user_id: studentProfiles.userId,
      company_owner: companies.userId,
    })
    .from(applications)
    .leftJoin(jobs, eq(applications.jobId, jobs.id))
    .leftJoin(companies, eq(jobs.companyId, companies.id))
    .leftJoin(studentProfiles, eq(applications.studentId, studentProfiles.id))
    .where(eq(applications.id, id));

  if (!row) {
    return NextResponse.json({ message: "Application not found." }, { status: 404 });
  }

  if (auth.role === "student" && row.student_user_id !== auth.sub) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  if (auth.role === "startup" && row.company_owner !== auth.sub) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  const record = {
    id: row.id,
    status: row.status,
    score: row.score,
    score_breakdown: row.score_breakdown,
    applied_at: row.applied_at,
    job: {
      id: row.job_id,
      title: row.job_title,
      company: {
        id: row.company_id,
        name: row.company_name,
      },
    },
    student: {
      id: row.student_id,
      user_id: row.student_user_id,
    },
  };

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
  const status = body.status as "pending" | "scoring" | "reviewing" | "accepted" | "rejected" | undefined;

  if (!status) {
    return NextResponse.json({ message: "Status is required." }, { status: 400 });
  }

  const validStatuses: Array<"pending" | "scoring" | "reviewing" | "accepted" | "rejected"> = [
    "pending",
    "scoring",
    "reviewing",
    "accepted",
    "rejected",
  ];

  if (!validStatuses.includes(status)) {
    return NextResponse.json({ message: "Invalid status." }, { status: 400 });
  }

  const { id } = await context.params;
  const [record] = await db
    .select({
      id: applications.id,
      status: applications.status,
      companyOwner: companies.userId,
      companyName: companies.name,
      jobTitle: jobs.title,
      studentEmail: profiles.email,
      studentName: profiles.fullName,
      emailOnDecision: companyWorkflows.emailOnDecision,
      acceptanceEmailBody: companyWorkflows.acceptanceEmailBody,
      rejectionEmailBody: companyWorkflows.rejectionEmailBody,
    })
    .from(applications)
    .leftJoin(jobs, eq(applications.jobId, jobs.id))
    .leftJoin(companies, eq(jobs.companyId, companies.id))
    .leftJoin(studentProfiles, eq(applications.studentId, studentProfiles.id))
    .leftJoin(profiles, eq(studentProfiles.userId, profiles.id))
    .leftJoin(companyWorkflows, eq(companies.id, companyWorkflows.companyId))
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

  const shouldSendDecisionEmail =
    (status === "accepted" || status === "rejected") && status !== record.status;

  console.log(`[Application PATCH] Decision email check:`, {
    applicationId: id,
    oldStatus: record.status,
    newStatus: status,
    shouldSendDecisionEmail,
    emailOnDecision: record.emailOnDecision,
    studentEmail: record.studentEmail || "NOT FOUND",
    hasAcceptanceBody: !!record.acceptanceEmailBody,
    hasRejectionBody: !!record.rejectionEmailBody,
  });

  if (shouldSendDecisionEmail && record.emailOnDecision && record.studentEmail) {
    const companyName = record.companyName ?? "Company";
    const jobTitle = record.jobTitle ?? "the role";
    const studentName = record.studentName ?? "there";
    const emailBody =
      status === "accepted" ? record.acceptanceEmailBody ?? null : record.rejectionEmailBody ?? null;

    console.log(`[Application PATCH] Enqueuing decision email:`, {
      studentEmail: record.studentEmail,
      studentName,
      jobTitle,
      companyName,
      status,
      hasEmailBody: !!emailBody,
    });

    try {
      await enqueueEmail({
        type: "decision",
        studentEmail: record.studentEmail,
        studentName,
        jobTitle,
        companyName,
        status,
        emailBody,
      });
      console.log(`[Application PATCH] Decision email enqueued successfully`);
    } catch (error) {
      console.error("[Application PATCH] Failed to enqueue decision email", error);
    }
  } else if (shouldSendDecisionEmail) {
    console.warn(`[Application PATCH] Decision email NOT sent because:`, {
      emailOnDecision: record.emailOnDecision ? "enabled" : "DISABLED",
      studentEmail: record.studentEmail ? "found" : "MISSING",
    });
  }

  return NextResponse.json(updated);
}
