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
