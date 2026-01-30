import { NextResponse } from "next/server";
import { db } from "@/db";
import { companies, companyWorkflows } from "@/db/schema";
import { requireRole } from "@/lib/auth/require";
import { eq } from "drizzle-orm";

const DEFAULT_ACCEPTANCE_EMAIL = [
  "Congratulations! We are pleased to inform you that you have been selected.",
  "We were impressed by your qualifications and believe you will be a great addition to our team.",
  "",
  "Our team will reach out shortly with next steps regarding onboarding and start date details.",
].join("\n");

const DEFAULT_REJECTION_EMAIL = [
  "Thank you for your interest in this position.",
  "After careful consideration, we have decided to move forward with other candidates whose experience more closely matches our current needs.",
  "",
  "We appreciate the time you invested in applying and encourage you to apply for future opportunities that align with your skills.",
].join("\n");

async function getCompany(userId: string) {
  const [company] = await db.select().from(companies).where(eq(companies.userId, userId));
  return company ?? null;
}

async function getOrCreateWorkflow(companyId: string) {
  const [existing] = await db
    .select()
    .from(companyWorkflows)
    .where(eq(companyWorkflows.companyId, companyId));

  if (existing) {
    return existing;
  }

  const [created] = await db
    .insert(companyWorkflows)
    .values({
      companyId,
      emailOnDecision: false,
      acceptanceEmailBody: DEFAULT_ACCEPTANCE_EMAIL,
      rejectionEmailBody: DEFAULT_REJECTION_EMAIL,
    })
    .returning();

  return created;
}

const serializeWorkflow = (workflow: typeof companyWorkflows.$inferSelect) => ({
  id: workflow.id,
  company_id: workflow.companyId,
  email_on_decision: workflow.emailOnDecision,
  acceptance_email_body: workflow.acceptanceEmailBody,
  rejection_email_body: workflow.rejectionEmailBody,
  created_at: workflow.createdAt,
  updated_at: workflow.updatedAt,
});

export async function GET() {
  const auth = await requireRole("startup");
  if (!auth) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  const company = await getCompany(auth.sub);
  if (!company) {
    return NextResponse.json({ message: "Company not found." }, { status: 404 });
  }

  const workflow = await getOrCreateWorkflow(company.id);
  return NextResponse.json(serializeWorkflow(workflow));
}

export async function PATCH(request: Request) {
  const auth = await requireRole("startup");
  if (!auth) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  const company = await getCompany(auth.sub);
  if (!company) {
    return NextResponse.json({ message: "Company not found." }, { status: 404 });
  }

  const body = await request.json();
  const workflow = await getOrCreateWorkflow(company.id);

  const [updated] = await db
    .update(companyWorkflows)
    .set({
      emailOnDecision: typeof body.email_on_decision === "boolean" ? body.email_on_decision : workflow.emailOnDecision,
      acceptanceEmailBody:
        typeof body.acceptance_email_body === "string"
          ? body.acceptance_email_body
          : workflow.acceptanceEmailBody,
      rejectionEmailBody:
        typeof body.rejection_email_body === "string"
          ? body.rejection_email_body
          : workflow.rejectionEmailBody,
      updatedAt: new Date(),
    })
    .where(eq(companyWorkflows.id, workflow.id))
    .returning();

  return NextResponse.json(serializeWorkflow(updated));
}
