import { db } from "@/db/index";
import { companies, jobs, studentProfiles } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";

function vectorLiteral(embedding: number[]) {
  return `[${embedding.join(",")}]`;
}

export async function getMatchedJobsForUser(userId: string) {
  const [studentProfile] = await db
    .select({
      id: studentProfiles.id,
      skills: studentProfiles.skills,
      embedding: studentProfiles.embedding,
    })
    .from(studentProfiles)
    .where(eq(studentProfiles.userId, userId));

  if (!studentProfile?.id) {
    return [];
  }

  if (!studentProfile.embedding) {
    return db
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
        company: {
          id: companies.id,
          name: companies.name,
          logo_url: companies.logoUrl,
          industry: companies.industry,
        },
      })
      .from(jobs)
      .leftJoin(companies, eq(jobs.companyId, companies.id))
      .where(eq(jobs.status, "open"))
      .orderBy(desc(jobs.createdAt));
  }

  const skillList = studentProfile.skills ?? [];
  const vector = vectorLiteral(studentProfile.embedding);

  // Create a PostgreSQL array literal for skills - escape single quotes
  const skillsArrayLiteral = skillList.length > 0 
    ? `ARRAY[${skillList.map(s => `'${s.replace(/'/g, "''")}'`).join(',')}]`
    : `ARRAY[]::text[]`;

  const result = await db.execute(sql.raw(`
    SELECT
      j.id,
      j.title,
      j.description,
      j.skills_required,
      j.duration,
      j.compensation,
      j.location_type,
      j.location,
      j.created_at,
      c.id AS company_id,
      c.name AS company_name,
      c.logo_url AS company_logo_url,
      c.industry AS company_industry,
      1 - (j.embedding <=> '${vector}'::vector) AS similarity,
      array_length(
        array(
          SELECT unnest(COALESCE(j.skills_required, '{}')) 
          INTERSECT SELECT unnest(${skillsArrayLiteral})
        ),
        1
      ) AS skills_overlap
    FROM jobs j
    JOIN companies c ON c.id = j.company_id
    WHERE j.status = 'open'
    ORDER BY similarity DESC NULLS LAST, skills_overlap DESC NULLS LAST
  `));

  // postgres-js returns rows directly as an array, not wrapped in .rows
  return (result as Array<Record<string, unknown>>).map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    skills_required: row.skills_required ?? null,
    duration: row.duration ?? null,
    compensation: row.compensation ?? null,
    location_type: row.location_type ?? null,
    location: row.location ?? null,
    created_at: row.created_at,
    match_score: row.similarity,
    company: {
      id: row.company_id,
      name: row.company_name,
      logo_url: row.company_logo_url ?? null,
      industry: row.company_industry ?? null,
    },
  }));
}
