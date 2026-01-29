import { openai, EMBEDDING_MODEL } from "./openai";

export interface StudentEmbeddingInput {
  fullName?: string | null;
  university?: string | null;
  major?: string | null;
  graduationYear?: number | null;
  bio?: string | null;
  skills?: string[] | null;
}

export interface JobEmbeddingInput {
  title: string;
  description: string;
  requirements?: string[] | null;
  skillsRequired?: string[] | null;
}

function compactList(items?: string[] | null) {
  return items && items.length > 0 ? items.join(", ") : "None listed";
}

export function buildStudentEmbeddingInput(profile: StudentEmbeddingInput) {
  return [
    "Student Profile",
    `Name: ${profile.fullName || "Not provided"}`,
    `University: ${profile.university || "Not provided"}`,
    `Major: ${profile.major || "Not provided"}`,
    `Graduation: ${profile.graduationYear ?? "Not provided"}`,
    `Skills: ${compactList(profile.skills)}`,
    `Bio: ${profile.bio || "Not provided"}`,
  ].join("\n");
}

export function buildJobEmbeddingInput(job: JobEmbeddingInput) {
  return [
    "Job Posting",
    `Title: ${job.title}`,
    `Description: ${job.description}`,
    `Requirements: ${compactList(job.requirements)}`,
    `Required Skills: ${compactList(job.skillsRequired)}`,
  ].join("\n");
}

export async function generateStudentEmbedding(profile: StudentEmbeddingInput) {
  const input = buildStudentEmbeddingInput(profile);
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input,
  });
  return response.data[0].embedding;
}

export async function generateJobEmbedding(job: JobEmbeddingInput) {
  const input = buildJobEmbeddingInput(job);
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input,
  });
  return response.data[0].embedding;
}
