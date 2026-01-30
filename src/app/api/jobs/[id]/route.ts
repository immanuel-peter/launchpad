import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { companies, jobs } from "@/db/schema";
import { requireAuth } from "@/lib/auth/require";
import { generateJobEmbedding } from "@/lib/ai/embeddings";
import { eq } from "drizzle-orm";

const serializeJob = (job: typeof jobs.$inferSelect) => ({
  id: job.id,
  title: job.title,
  description: job.description,
  requirements: job.requirements,
  skills_required: job.skillsRequired,
  duration: job.duration,
  compensation: job.compensation,
  location_type: job.locationType,
  location: job.location,
  status: job.status,
  deadline: job.deadline,
  created_at: job.createdAt,
  updated_at: job.updatedAt,
  company_id: job.companyId,
});

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const [row] = await db
    .select({
      id: jobs.id,
      title: jobs.title,
      description: jobs.description,
      requirements: jobs.requirements,
      skills_required: jobs.skillsRequired,
      duration: jobs.duration,
      compensation: jobs.compensation,
      location_type: jobs.locationType,
      location: jobs.location,
      deadline: jobs.deadline,
      created_at: jobs.createdAt,
      company_id: companies.id,
      company_name: companies.name,
      company_logo_url: companies.logoUrl,
      company_description: companies.description,
      company_industry: companies.industry,
      company_website: companies.website,
    })
    .from(jobs)
    .leftJoin(companies, eq(jobs.companyId, companies.id))
    .where(eq(jobs.id, id));

  if (!row) {
    return NextResponse.json({ message: "Job not found." }, { status: 404 });
  }

  const job = {
    id: row.id,
    title: row.title,
    description: row.description,
    requirements: row.requirements,
    skills_required: row.skills_required,
    duration: row.duration,
    compensation: row.compensation,
    location_type: row.location_type,
    location: row.location,
    deadline: row.deadline,
    created_at: row.created_at,
    company: {
      id: row.company_id,
      name: row.company_name,
      logo_url: row.company_logo_url,
      description: row.company_description,
      industry: row.company_industry,
      website: row.company_website,
    },
  };

  return NextResponse.json(job);
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (!auth || auth.role !== "startup") {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  const { id } = await context.params;
  const [job] = await db
    .select({
      id: jobs.id,
      companyId: jobs.companyId,
      title: jobs.title,
      description: jobs.description,
      requirements: jobs.requirements,
      skillsRequired: jobs.skillsRequired,
    })
    .from(jobs)
    .where(eq(jobs.id, id));

  if (!job) {
    return NextResponse.json({ message: "Job not found." }, { status: 404 });
  }

  const [company] = await db
    .select()
    .from(companies)
    .where(eq(companies.id, job.companyId));

  if (!company || company.userId !== auth.sub) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  const body = await request.json();
  const embedding = await generateJobEmbedding({
    title: body.title ?? job.title,
    description: body.description ?? job.description,
    requirements: body.requirements ?? job.requirements ?? null,
    skillsRequired: body.skills_required ?? job.skillsRequired ?? null,
  });

  const [updated] = await db
    .update(jobs)
    .set({
      title: body.title ?? undefined,
      description: body.description ?? undefined,
      locationType: body.location_type ?? undefined,
      location: body.location ?? undefined,
      duration: body.duration ?? undefined,
      compensation: body.compensation ?? undefined,
      requirements: body.requirements ?? undefined,
      skillsRequired: body.skills_required ?? undefined,
      status: body.status ?? undefined,
      embedding,
      updatedAt: new Date(),
    })
    .where(eq(jobs.id, job.id))
    .returning();

  return NextResponse.json(serializeJob(updated));
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (!auth || auth.role !== "startup") {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  const { id } = await context.params;
  const [job] = await db
    .select({
      id: jobs.id,
      companyId: jobs.companyId,
    })
    .from(jobs)
    .where(eq(jobs.id, id));

  if (!job) {
    return NextResponse.json({ message: "Job not found." }, { status: 404 });
  }

  const [company] = await db
    .select()
    .from(companies)
    .where(eq(companies.id, job.companyId));

  if (!company || company.userId !== auth.sub) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  await db.delete(jobs).where(eq(jobs.id, job.id));
  return NextResponse.json({ success: true });
}
