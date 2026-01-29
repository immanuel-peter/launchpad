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
  const [job] = await db
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
      company: {
        id: companies.id,
        name: companies.name,
        logo_url: companies.logoUrl,
        description: companies.description,
        industry: companies.industry,
        website: companies.website,
      },
    })
    .from(jobs)
    .leftJoin(companies, eq(jobs.companyId, companies.id))
    .where(eq(jobs.id, id));

  if (!job) {
    return NextResponse.json({ message: "Job not found." }, { status: 404 });
  }

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
