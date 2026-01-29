import OpenAI from "openai";

const baseURL = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  throw new Error("OPENAI_API_KEY is not set");
}

export const openai = new OpenAI({ baseURL, apiKey });
export const LLM_MODEL = process.env.LLM_MODEL || "gpt-5-mini";
export const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || "text-embedding-3-small";
