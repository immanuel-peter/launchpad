import { z } from "zod";

export const scoreBreakdownSchema = z.object({
  skillsMatch: z.object({
    score: z.number().min(0).max(100),
    reasoning: z.string(),
  }),
  experienceFit: z.object({
    score: z.number().min(0).max(100),
    reasoning: z.string(),
  }),
  educationMatch: z.object({
    score: z.number().min(0).max(100),
    reasoning: z.string(),
  }),
  overallRecommendation: z.string(),
});

export type ScoreBreakdown = z.infer<typeof scoreBreakdownSchema>;

export const resumeSkillsSchema = z.object({
  skills: z.array(z.string()).describe("List of technical and soft skills"),
});

export const resumeLinksSchema = z.object({
  linkedin_url: z.string().nullable(),
  github_url: z.string().nullable(),
  portfolio_url: z.string().nullable(),
});

export const jobRequirementsSchema = z.object({
  requirements: z.array(z.string()),
});

export const jobSkillsSchema = z.object({
  skills: z.array(z.string()),
});

export const enhancedDescriptionSchema = z.object({
  description: z.string().describe("Enhanced job description"),
});
