import { NextResponse } from "next/server";
import { db } from "@/db";
import { companies } from "@/db/schema";
import { requireRole } from "@/lib/auth/require";
import { enhanceJobDescription } from "@/lib/ai/parsing";
import { eq } from "drizzle-orm";

const buildCompanyContext = (company: typeof companies.$inferSelect) =>
  [
    `Company Name: ${company.name}`,
    company.description ? `Description: ${company.description}` : null,
    company.industry ? `Industry: ${company.industry}` : null,
    company.companySize ? `Company Size: ${company.companySize}` : null,
    company.location ? `Location: ${company.location}` : null,
    company.foundedYear ? `Founded: ${company.foundedYear}` : null,
    company.website ? `Website: ${company.website}` : null,
  ]
    .filter(Boolean)
    .join("\n");

export async function POST(request: Request) {
  const auth = await requireRole("startup");
  if (!auth) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  const body = await request.json();
  const jobTitle = (body.job_title as string | undefined)?.trim();
  const description = (body.description as string | undefined)?.trim();

  if (!jobTitle || !description) {
    return NextResponse.json({ message: "Job title and description are required." }, { status: 400 });
  }

  const [company] = await db.select().from(companies).where(eq(companies.userId, auth.sub));
  if (!company) {
    return NextResponse.json({ message: "Company not found." }, { status: 404 });
  }

  const companyContext = buildCompanyContext(company);
  const enhanced = await enhanceJobDescription({
    companyContext,
    jobTitle,
    description,
  });

  return NextResponse.json({ description: enhanced });
}
