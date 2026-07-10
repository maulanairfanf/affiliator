import type { AiProvider, AiProviderConfig } from "@/types/ai";
import type { GenerationRequest, GenerationResponse } from "@/types/content";
import { OpenAIProvider } from "@/lib/contents/providers/openai";

const apiKey = process.env.OPENAI_API_KEY;

const defaultConfig: AiProviderConfig = {
  apiKey: apiKey || "",
  model: process.env.OPENAI_MODEL || "gpt-4o-mini",
  temperature: 0.7,
  baseURL: process.env.OPENAI_BASE_URL || "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": process.env.APP_URL || "https://affiliator.local",
    "X-Title": "Affiliator",
  },
};

let provider: AiProvider | null = null;

function getProvider(): AiProvider {
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is not configured. Set it in .env file."
    );
  }
  if (!provider) {
    provider = new OpenAIProvider(defaultConfig);
  }
  return provider;
}

export async function generateContent(
  request: GenerationRequest
): Promise<ReadableStream<Uint8Array>> {
  const p = getProvider();
  return p.generate(request);
}

export async function generateContentSync(
  request: GenerationRequest
): Promise<GenerationResponse> {
  const p = getProvider();
  return p.generateSync(request);
}
