import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { applications, companies, jobs, profiles, studentProfiles } from "@/db/schema";
import { requireAuth } from "@/lib/auth/require";
import { desc, eq } from "drizzle-orm";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (!auth || auth.role !== "startup") {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  const { id } = await context.params;
  const [job] = await db
    .select({
      id: jobs.id,
      title: jobs.title,
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

  const results = await db
    .select({
      id: applications.id,
      status: applications.status,
      score: applications.score,
      score_breakdown: applications.scoreBreakdown,
      cover_letter: applications.coverLetter,
      applied_at: applications.appliedAt,
      student: {
        id: studentProfiles.id,
        bio: studentProfiles.bio,
        university: studentProfiles.university,
        major: studentProfiles.major,
        graduation_year: studentProfiles.graduationYear,
        skills: studentProfiles.skills,
        linkedin_url: studentProfiles.linkedinUrl,
        github_url: studentProfiles.githubUrl,
        portfolio_url: studentProfiles.portfolioUrl,
        user: {
          full_name: profiles.fullName,
          email: profiles.email,
        },
      },
    })
    .from(applications)
    .leftJoin(studentProfiles, eq(applications.studentId, studentProfiles.id))
    .leftJoin(profiles, eq(studentProfiles.userId, profiles.id))
    .where(eq(applications.jobId, job.id))
    .orderBy(desc(applications.score));

  return NextResponse.json({ job: { id: job.id, title: job.title }, applications: results });
}
