import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { applications, companies, jobs } from "@/db/schema";
import { requireAuth } from "@/lib/auth/require";
import { generateJobEmbedding } from "@/lib/ai/embeddings";
import { desc, eq, sql } from "drizzle-orm";

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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get("companyId");

  if (companyId) {
    const auth = await requireAuth();
    if (!auth || auth.role !== "startup") {
      return NextResponse.json({ message: "Forbidden." }, { status: 403 });
    }

    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, companyId));

    if (!company || company.userId !== auth.sub) {
      return NextResponse.json({ message: "Forbidden." }, { status: 403 });
    }

    const results = await db
      .select({
        id: jobs.id,
        title: jobs.title,
        status: jobs.status,
        location_type: jobs.locationType,
        created_at: jobs.createdAt,
        application_count: sql<number>`COALESCE(CAST(COUNT(${applications.id}) AS INTEGER), 0)`,
      })
      .from(jobs)
      .leftJoin(applications, eq(applications.jobId, jobs.id))
      .where(eq(jobs.companyId, companyId))
      .groupBy(jobs.id, jobs.title, jobs.status, jobs.locationType, jobs.createdAt)
      .orderBy(desc(jobs.createdAt));

    return NextResponse.json(
      results.map((row) => ({
        ...row,
        application_count: Number(row.application_count) || 0,
      }))
    );
  }

  const rows = await db
    .select({
      id: jobs.id,
      title: jobs.title,
      description: jobs.description,
      skills_required: jobs.skillsRequired,
      duration: jobs.duration,
      compensation: jobs.compensation,
      location_type: jobs.locationType,
      location: jobs.location,
      created_at: jobs.createdAt,
      company_id: companies.id,
      company_name: companies.name,
      company_logo_url: companies.logoUrl,
      company_industry: companies.industry,
    })
    .from(jobs)
    .leftJoin(companies, eq(jobs.companyId, companies.id))
    .where(eq(jobs.status, "open"))
    .orderBy(desc(jobs.createdAt));

  const results = rows.map(row => ({
    id: row.id,
    title: row.title,
    description: row.description,
    skills_required: row.skills_required,
    duration: row.duration,
    compensation: row.compensation,
    location_type: row.location_type,
    location: row.location,
    created_at: row.created_at,
    company: {
      id: row.company_id,
      name: row.company_name,
      logo_url: row.company_logo_url,
      industry: row.company_industry,
    },
  }));

  return NextResponse.json(results);
}

export async function POST(request: Request) {
  const auth = await requireAuth();
  if (!auth || auth.role !== "startup") {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  const body = await request.json();
  const [company] = await db
    .select()
    .from(companies)
    .where(eq(companies.userId, auth.sub));

  if (!company) {
    return NextResponse.json({ message: "Company not found." }, { status: 404 });
  }

  if (!body.title || !body.description) {
    return NextResponse.json({ message: "Title and description are required." }, { status: 400 });
  }

  const embedding = await generateJobEmbedding({
    title: body.title,
    description: body.description,
    requirements: body.requirements ?? null,
    skillsRequired: body.skills_required ?? null,
  });

  const [created] = await db
    .insert(jobs)
    .values({
      companyId: company.id,
      title: body.title,
      description: body.description,
      locationType: body.location_type ?? "remote",
      location: body.location ?? null,
      duration: body.duration ?? null,
      compensation: body.compensation ?? null,
      requirements: body.requirements ?? null,
      skillsRequired: body.skills_required ?? null,
      embedding,
      status: "open",
    })
    .returning();

  return NextResponse.json(serializeJob(created), { status: 201 });
}
