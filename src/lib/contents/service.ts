import { generateContent, generateContentSync } from "@/lib/contents/generator";
import type { GenerationRequest } from "@/types/content";

export async function generate(request: GenerationRequest): Promise<ReadableStream<Uint8Array>> {
  return generateContent(request);
}

export async function generateSync(request: GenerationRequest) {
  return generateContentSync(request);
}
