import { Worker } from "bullmq";
import { redisConnection } from "@/queue/connection";
import { db } from "@/db/index";
import { applications, companies, jobs, profiles, studentProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { scoreApplication } from "@/lib/ai/scoring";
import { EmailJobData, enqueueEmail } from "@/queue/email";
import { emailFrom, resend } from "@/lib/email/resend";
import {
  getDecisionEmail,
  getNewApplicationEmail,
  getWelcomeEmail,
} from "@/lib/email/templates";

const scoringWorker = new Worker(
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

      console.log(`[Scoring Worker] Company owner lookup:`, {
        companyId: jobRow.companyId,
        found: !!companyOwner,
        email: companyOwner?.email || "NOT FOUND",
      });

      if (companyOwner?.email) {
        console.log(`[Scoring Worker] Enqueuing new application email for company:`, {
          companyEmail: companyOwner.email,
          applicantName: studentRow.fullName ?? "Applicant",
          jobTitle: jobRow.title,
          score: result.overallScore,
        });
        await enqueueEmail({
          type: "new-application",
          companyEmail: companyOwner.email,
          companyName: companyOwner.companyName ?? jobRow.companyName ?? "Company",
          applicantName: studentRow.fullName ?? "Applicant",
          jobTitle: jobRow.title,
          score: result.overallScore,
        });
      } else {
        console.warn(`[Scoring Worker] Cannot send email: company owner email not found for company ID ${jobRow.companyId}`);
      }
    } catch (error) {
      console.error("[Scoring Worker] Failed to enqueue new application email", error);
    }
  },
  { connection: redisConnection, concurrency: 2 }
);

const emailWorker = new Worker(
  "email-notifications",
  async (job) => {
    console.log(`[Email Worker] Processing job ${job.id}:`, job.data);
    const data = job.data as EmailJobData;
    let recipient = "";
    let template;

    if (data.type === "welcome") {
      recipient = data.email;
      template = getWelcomeEmail(data.fullName, data.role);
      console.log(`[Email Worker] Welcome email template generated for: ${recipient}`);
    } else if (data.type === "new-application") {
      recipient = data.companyEmail;
      template = getNewApplicationEmail({
        companyName: data.companyName,
        applicantName: data.applicantName,
        jobTitle: data.jobTitle,
        score: data.score,
      });
      console.log(`[Email Worker] New application email template generated for: ${recipient}`);
    } else {
      recipient = data.studentEmail;
      template = getDecisionEmail({
        studentName: data.studentName,
        companyName: data.companyName,
        jobTitle: data.jobTitle,
        status: data.status,
        emailBody: data.emailBody,
      });
      console.log(`[Email Worker] Decision email template generated for: ${recipient}, status: ${data.status}`);
    }

    if (!recipient) {
      throw new Error("Email recipient is missing");
    }

    console.log(`[Email Worker] Sending email via Resend:`, {
      from: emailFrom,
      to: recipient,
      subject: template.subject,
    });

    try {
      const { data, error } = await resend.emails.send({
        from: emailFrom,
        to: recipient,
        subject: template.subject,
        html: template.html,
      });

      if (error) {
        console.error(`[Email Worker] Resend API error:`, {
          error: error.message || String(error),
          recipient,
          subject: template.subject,
          from: emailFrom,
        });
        throw error;
      }

      console.log(`[Email Worker] Resend API response:`, {
        success: true,
        emailId: data?.id,
        recipient,
        subject: template.subject,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorDetails = error instanceof Error ? error.stack : String(error);
      console.error(`[Email Worker] Resend API error (catch):`, {
        error: errorMessage,
        details: errorDetails,
        recipient,
        subject: template.subject,
        from: emailFrom,
      });
      throw error;
    }
  },
  { connection: redisConnection, concurrency: 5 }
);

scoringWorker.on("failed", (job, error) => {
  console.error("Scoring job failed", job?.id, error);
});

scoringWorker.on("completed", (job) => {
  console.log("Scoring job completed", job.id);
});

emailWorker.on("failed", (job, error) => {
  console.error("[Email Worker] Job failed:", {
    jobId: job?.id,
    jobData: job?.data,
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });
});

emailWorker.on("completed", (job) => {
  console.log("[Email Worker] Job completed successfully:", {
    jobId: job.id,
    jobType: (job.data as EmailJobData).type,
  });
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, closing worker...");
  await Promise.all([scoringWorker.close(), emailWorker.close()]);
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("SIGINT received, closing worker...");
  await Promise.all([scoringWorker.close(), emailWorker.close()]);
  process.exit(0);
});

console.log("Workers started, listening for scoring and email jobs");
console.log(`[Email Worker] Resend configured with FROM: ${emailFrom}`);
console.log(`[Email Worker] RESEND_API_KEY is ${process.env.RESEND_API_KEY ? "SET" : "NOT SET"}`);
