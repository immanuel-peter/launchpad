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

  const rows = await db
    .select({
      id: applications.id,
      status: applications.status,
      score: applications.score,
      score_breakdown: applications.scoreBreakdown,
      cover_letter: applications.coverLetter,
      applied_at: applications.appliedAt,
      student_id: studentProfiles.id,
      student_bio: studentProfiles.bio,
      student_university: studentProfiles.university,
      student_major: studentProfiles.major,
      student_graduation_year: studentProfiles.graduationYear,
      student_skills: studentProfiles.skills,
      student_linkedin_url: studentProfiles.linkedinUrl,
      student_github_url: studentProfiles.githubUrl,
      student_portfolio_url: studentProfiles.portfolioUrl,
      user_full_name: profiles.fullName,
      user_email: profiles.email,
    })
    .from(applications)
    .leftJoin(studentProfiles, eq(applications.studentId, studentProfiles.id))
    .leftJoin(profiles, eq(studentProfiles.userId, profiles.id))
    .where(eq(applications.jobId, job.id))
    .orderBy(desc(applications.score));

  const results = rows.map(row => ({
    id: row.id,
    status: row.status,
    score: row.score,
    score_breakdown: row.score_breakdown,
    cover_letter: row.cover_letter,
    applied_at: row.applied_at,
    student: {
      id: row.student_id,
      bio: row.student_bio,
      university: row.student_university,
      major: row.student_major,
      graduation_year: row.student_graduation_year,
      skills: row.student_skills,
      linkedin_url: row.student_linkedin_url,
      github_url: row.student_github_url,
      portfolio_url: row.student_portfolio_url,
      user: {
        full_name: row.user_full_name,
        email: row.user_email,
      },
    },
  }));

  return NextResponse.json({ job: { id: job.id, title: job.title }, applications: results });
}
