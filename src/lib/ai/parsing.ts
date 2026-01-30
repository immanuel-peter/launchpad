import { zodToJsonSchema } from "zod-to-json-schema";
import { openai, LLM_MODEL } from "./openai";
import {
  enhancedDescriptionSchema,
  jobRequirementsSchema,
  jobSkillsSchema,
  resumeLinksSchema,
  resumeSkillsSchema,
} from "./schemas";

const RESUME_SKILLS_PROMPT = [
  "You extract a concise list of skills from resume text.",
  "Only include skills that are explicitly stated or clearly implied.",
  "Return JSON that matches the schema exactly.",
  "Use short, conventional skill names (e.g., React, Python, Leadership).",
].join(" ");

const RESUME_LINKS_PROMPT = [
  "You extract professional links from resume text.",
  "Return LinkedIn, GitHub, and portfolio/personal URLs if present.",
  "If a URL is not present, return null for that field.",
  "Return JSON that matches the schema exactly.",
].join(" ");

const JOB_REQUIREMENTS_PROMPT = [
  "You extract job requirements from a job description.",
  "Return a list of concise requirement statements.",
  "Avoid duplicates and avoid including the same item as a skill.",
  "Return JSON that matches the schema exactly.",
].join(" ");

const JOB_SKILLS_PROMPT = [
  "You extract required skills from a job description.",
  "Return a list of concise skill names.",
  "Avoid duplicates and keep each item short.",
  "Return JSON that matches the schema exactly.",
].join(" ");

const ENHANCE_DESCRIPTION_PROMPT = [
  "You improve a job description for clarity and completeness.",
  "Use the company context and job title to enrich the description.",
  "Preserve the original intent and keep it professional.",
  "Return JSON that matches the schema exactly.",
].join(" ");

export async function parseResumeSkills(resumeText: string) {
  const response = await openai.chat.completions.create({
    model: LLM_MODEL,
    messages: [
      { role: "system", content: RESUME_SKILLS_PROMPT },
      { role: "user", content: resumeText },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "resume_skills",
        schema: zodToJsonSchema(resumeSkillsSchema),
      },
    },
  });

  const content = response.choices[0]?.message?.content ?? "{}";
  const parsed = resumeSkillsSchema.parse(JSON.parse(content));
  return parsed.skills.map((skill) => skill.trim()).filter(Boolean);
}

export async function parseResumeLinks(resumeText: string) {
  const response = await openai.chat.completions.create({
    model: LLM_MODEL,
    messages: [
      { role: "system", content: RESUME_LINKS_PROMPT },
      { role: "user", content: resumeText },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "resume_links",
        schema: zodToJsonSchema(resumeLinksSchema),
      },
    },
  });

  const content = response.choices[0]?.message?.content ?? "{}";
  const parsed = resumeLinksSchema.parse(JSON.parse(content));
  return {
    linkedin_url: parsed.linkedin_url?.trim() || null,
    github_url: parsed.github_url?.trim() || null,
    portfolio_url: parsed.portfolio_url?.trim() || null,
  };
}

export async function parseJobRequirements(description: string) {
  const response = await openai.chat.completions.create({
    model: LLM_MODEL,
    messages: [
      { role: "system", content: JOB_REQUIREMENTS_PROMPT },
      { role: "user", content: description },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "job_requirements",
        schema: zodToJsonSchema(jobRequirementsSchema),
      },
    },
  });

  const content = response.choices[0]?.message?.content ?? "{}";
  const parsed = jobRequirementsSchema.parse(JSON.parse(content));
  return parsed.requirements.map((item) => item.trim()).filter(Boolean);
}

export async function parseJobSkills(description: string) {
  const response = await openai.chat.completions.create({
    model: LLM_MODEL,
    messages: [
      { role: "system", content: JOB_SKILLS_PROMPT },
      { role: "user", content: description },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "job_skills",
        schema: zodToJsonSchema(jobSkillsSchema),
      },
    },
  });

  const content = response.choices[0]?.message?.content ?? "{}";
  const parsed = jobSkillsSchema.parse(JSON.parse(content));
  return parsed.skills.map((item) => item.trim()).filter(Boolean);
}

export async function enhanceJobDescription(params: {
  companyContext: string;
  jobTitle: string;
  description: string;
}) {
  const response = await openai.chat.completions.create({
    model: LLM_MODEL,
    messages: [
      { role: "system", content: ENHANCE_DESCRIPTION_PROMPT },
      {
        role: "user",
        content: JSON.stringify({
          company_context: params.companyContext,
          job_title: params.jobTitle,
          description: params.description,
        }),
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "enhanced_description",
        schema: zodToJsonSchema(enhancedDescriptionSchema),
      },
    },
  });

  const content = response.choices[0]?.message?.content ?? "{}";
  const parsed = enhancedDescriptionSchema.parse(JSON.parse(content));
  return parsed.description.trim();
}
