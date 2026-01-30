import { Worker } from "bullmq";
import { redisConnection } from "@/queue/connection";
import { db } from "@/db/index";
import { applications, companies, jobs, profiles, studentProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { scoreApplication } from "@/lib/ai/scoring";

const worker = new Worker(
  "application-scoring",
  async (job) => {
    const { applicationId } = job.data as { applicationId: string };

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
  },
  { connection: redisConnection, concurrency: 2 }
);

worker.on("failed", (job, error) => {
  console.error("Scoring job failed", job?.id, error);
});

worker.on("completed", (job) => {
  console.log("Scoring job completed", job.id);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, closing worker...");
  await worker.close();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("SIGINT received, closing worker...");
  await worker.close();
  process.exit(0);
});

console.log("Worker started, listening for jobs on queue 'application-scoring'");
