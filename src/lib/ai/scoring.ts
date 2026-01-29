import { openai, LLM_MODEL } from "./openai";
import { scoreBreakdownSchema, type ScoreBreakdown } from "./schemas";
import { zodToJsonSchema } from "zod-to-json-schema";

export interface StudentScoreInput {
  fullName?: string | null;
  email?: string | null;
  university?: string | null;
  major?: string | null;
  graduationYear?: number | null;
  bio?: string | null;
  skills?: string[] | null;
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  portfolioUrl?: string | null;
  coverLetter?: string | null;
}

export interface JobScoreInput {
  title: string;
  description: string;
  requirements?: string[] | null;
  skillsRequired?: string[] | null;
  companyName?: string | null;
}

const SCORING_PROMPT = [
  "You are an AI matching assistant for a student-to-company platform.",
  "Score the candidate against the job posting.",
  "Return JSON that matches the provided schema exactly.",
  "Scores must be integers between 0 and 100.",
  "Reasoning should be 1-3 concise sentences per category.",
].join(" ");

export async function scoreApplication(input: {
  student: StudentScoreInput;
  job: JobScoreInput;
}): Promise<{ breakdown: ScoreBreakdown; overallScore: number }> {
  const response = await openai.chat.completions.create({
    model: LLM_MODEL,
    messages: [
      { role: "system", content: SCORING_PROMPT },
      { role: "user", content: JSON.stringify(input) },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "score_breakdown",
        schema: zodToJsonSchema(scoreBreakdownSchema),
      },
    },
  });

  const content = response.choices[0]?.message?.content ?? "{}";
  const parsed = scoreBreakdownSchema.parse(JSON.parse(content));
  const overallScore = Math.round(
    (parsed.skillsMatch.score + parsed.experienceFit.score + parsed.educationMatch.score) / 3
  );

  return { breakdown: parsed, overallScore };
}
