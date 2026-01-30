import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { vector } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["student", "startup"]);
export const applicationStatusEnum = pgEnum("application_status", [
  "pending",
  "scoring",
  "reviewing",
  "accepted",
  "rejected",
]);
export const jobStatusEnum = pgEnum("job_status", ["draft", "open", "closed", "filled"]);

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull().unique(),
  role: userRoleEnum("role").notNull(),
  fullName: text("full_name"),
  avatarUrl: text("avatar_url"),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const studentProfiles = pgTable("student_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => profiles.id).notNull().unique(),
  university: text("university"),
  major: text("major"),
  graduationYear: integer("graduation_year"),
  bio: text("bio"),
  skills: text("skills").array(),
  resumeUrl: text("resume_url"),
  linkedinUrl: text("linkedin_url"),
  githubUrl: text("github_url"),
  portfolioUrl: text("portfolio_url"),
  embedding: vector("embedding", { dimensions: 1536 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const companies = pgTable("companies", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => profiles.id).notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  logoUrl: text("logo_url"),
  website: text("website"),
  industry: text("industry"),
  companySize: text("company_size"),
  location: text("location"),
  foundedYear: integer("founded_year"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const companyWorkflows = pgTable("company_workflows", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").references(() => companies.id).notNull().unique(),
  emailOnDecision: boolean("email_on_decision").default(false),
  acceptanceEmailBody: text("acceptance_email_body"),
  rejectionEmailBody: text("rejection_email_body"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const jobs = pgTable("jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").references(() => companies.id).notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  requirements: text("requirements").array(),
  skillsRequired: text("skills_required").array(),
  duration: text("duration"),
  compensation: text("compensation"),
  locationType: text("location_type").default("remote"),
  location: text("location"),
  status: jobStatusEnum("status").default("open"),
  deadline: timestamp("deadline", { withTimezone: true }),
  embedding: vector("embedding", { dimensions: 1536 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const applications = pgTable(
  "applications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    jobId: uuid("job_id").references(() => jobs.id).notNull(),
    studentId: uuid("student_id").references(() => studentProfiles.id).notNull(),
    coverLetter: text("cover_letter"),
    status: applicationStatusEnum("status").default("pending"),
    score: integer("score"),
    scoreBreakdown: jsonb("score_breakdown").$type<Record<string, unknown>>(),
    appliedAt: timestamp("applied_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    uniqueApplication: unique().on(table.jobId, table.studentId),
  })
);
