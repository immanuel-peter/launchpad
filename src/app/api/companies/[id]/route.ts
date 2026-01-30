import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { companies } from "@/db/schema";
import { requireAuth } from "@/lib/auth/require";
import { eq } from "drizzle-orm";

const serializeCompany = (company: typeof companies.$inferSelect) => ({
  id: company.id,
  user_id: company.userId,
  name: company.name,
  description: company.description,
  logo_url: company.logoUrl,
  website: company.website,
  industry: company.industry,
  company_size: company.companySize,
  location: company.location,
  founded_year: company.foundedYear,
  created_at: company.createdAt,
  updated_at: company.updatedAt,
});

const serializePublicCompany = (company: typeof companies.$inferSelect) => ({
  id: company.id,
  name: company.name,
  description: company.description,
  logo_url: company.logoUrl,
  website: company.website,
  industry: company.industry,
  company_size: company.companySize,
  location: company.location,
  founded_year: company.foundedYear,
});

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  const { id } = await context.params;
  
  if (id === "me") {
    if (!auth) {
      return NextResponse.json({ message: "Not authenticated." }, { status: 401 });
    }
    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.userId, auth.sub));
    if (!company) {
      return NextResponse.json({ message: "Company not found." }, { status: 404 });
    }
    return NextResponse.json(serializeCompany(company));
  }

  const [company] = await db
    .select()
    .from(companies)
    .where(eq(companies.id, id));

  if (!company) {
    return NextResponse.json({ message: "Company not found." }, { status: 404 });
  }

  // Return public version if not authenticated, full version if authenticated
  if (!auth) {
    return NextResponse.json(serializePublicCompany(company));
  }

  return NextResponse.json(serializeCompany(company));
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (!auth || auth.role !== "startup") {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  const body = await request.json();
  const { id: paramId } = await context.params;
  const targetId = paramId === "me" ? null : paramId;

  const [company] = targetId
    ? await db.select().from(companies).where(eq(companies.id, targetId))
    : await db.select().from(companies).where(eq(companies.userId, auth.sub));

  if (!company) {
    return NextResponse.json({ message: "Company not found." }, { status: 404 });
  }

  if (company.userId !== auth.sub) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  const [updated] = await db
    .update(companies)
    .set({
      name: body.name?.trim() || company.name,
      description: body.description ?? null,
      website: body.website ?? null,
      industry: body.industry ?? null,
      companySize: body.company_size ?? null,
      location: body.location ?? null,
      foundedYear: body.founded_year ?? null,
      updatedAt: new Date(),
    })
    .where(eq(companies.id, company.id))
    .returning();

  return NextResponse.json(serializeCompany(updated));
}
