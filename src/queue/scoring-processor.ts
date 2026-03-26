import { db } from "@/db/index";
import { applications, companies, jobs, profiles, studentProfiles } from "@/db/schema";
import { scoreApplication } from "@/lib/ai/scoring";
import { enqueueEmail } from "@/queue/email";
import { eq } from "drizzle-orm";

export async function processScoringJob(applicationId: string) {
  const [application] = await db
    .select({
      id: applications.id,
      jobId: applications.jobId,
      studentId: applications.studentId,
      coverLetter: applications.coverLetter,
    })
    .from(applications)
    .where(eq(applications.id, applicationId));

  if (!application) {
    return;
  }

  const [jobRow] = await db
    .select({
      id: jobs.id,
      title: jobs.title,
      description: jobs.description,
      requirements: jobs.requirements,
      skillsRequired: jobs.skillsRequired,
      companyName: companies.name,
      companyId: companies.id,
    })
    .from(jobs)
    .leftJoin(companies, eq(jobs.companyId, companies.id))
    .where(eq(jobs.id, application.jobId));

  const [studentRow] = await db
    .select({
      id: studentProfiles.id,
      bio: studentProfiles.bio,
      university: studentProfiles.university,
      major: studentProfiles.major,
      graduationYear: studentProfiles.graduationYear,
      skills: studentProfiles.skills,
      linkedinUrl: studentProfiles.linkedinUrl,
      githubUrl: studentProfiles.githubUrl,
      portfolioUrl: studentProfiles.portfolioUrl,
      fullName: profiles.fullName,
      email: profiles.email,
    })
    .from(studentProfiles)
    .leftJoin(profiles, eq(studentProfiles.userId, profiles.id))
    .where(eq(studentProfiles.id, application.studentId));

  if (!jobRow || !studentRow) {
    return;
  }

  const result = await scoreApplication({
    student: {
      fullName: studentRow.fullName,
      email: studentRow.email,
      university: studentRow.university,
      major: studentRow.major,
      graduationYear: studentRow.graduationYear,
      bio: studentRow.bio,
      skills: studentRow.skills,
      linkedinUrl: studentRow.linkedinUrl,
      githubUrl: studentRow.githubUrl,
      portfolioUrl: studentRow.portfolioUrl,
      coverLetter: application.coverLetter,
    },
    job: {
      title: jobRow.title,
      description: jobRow.description,
      requirements: jobRow.requirements,
      skillsRequired: jobRow.skillsRequired,
      companyName: jobRow.companyName,
    },
  });

  await db
    .update(applications)
    .set({
      score: result.overallScore,
      scoreBreakdown: result.breakdown,
      status: "reviewing",
      updatedAt: new Date(),
    })
    .where(eq(applications.id, applicationId));

  try {
    const [companyOwner] = await db
      .select({
        email: profiles.email,
        companyName: companies.name,
      })
      .from(companies)
      .leftJoin(profiles, eq(companies.userId, profiles.id))
      .where(eq(companies.id, jobRow.companyId));

    console.log(`[Scoring Worker] Company owner lookup`, {
      companyId: jobRow.companyId,
      found: !!companyOwner,
      email: companyOwner?.email || "NOT FOUND",
    });

    if (companyOwner?.email) {
      await enqueueEmail({
        type: "new-application",
        companyEmail: companyOwner.email,
        companyName: companyOwner.companyName ?? jobRow.companyName ?? "Company",
        applicantName: studentRow.fullName ?? "Applicant",
        jobTitle: jobRow.title,
        score: result.overallScore,
      });
      return;
    }

    console.warn(
      `[Scoring Worker] Cannot send email: company owner email not found for company ID ${jobRow.companyId}`
    );
  } catch (error) {
    console.error("[Scoring Worker] Failed to enqueue new application email", error);
  }
}
