import type { GenerationRequest, GenerationResponse } from "@/types/content";

export interface AiProvider {
  generate(request: GenerationRequest): Promise<ReadableStream<Uint8Array>>;
  generateSync(request: GenerationRequest): Promise<GenerationResponse>;
}

export interface AiProviderConfig {
  apiKey: string;
  model: string;
  temperature?: number;
  baseURL?: string;
  defaultHeaders?: Record<string, string>;
}

export interface AiGenerateRequest {
  productName: string;
  productPrice: number;
  productDescription: string;
  platform: string;
  types: string[];
  style: string;
}
