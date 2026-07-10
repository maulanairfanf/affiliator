import OpenAI from "openai";
import type { AiProvider, AiProviderConfig } from "@/types/ai";
import type { GenerationRequest, GenerationResponse, GeneratedContent } from "@/types/content";
import { buildSystemPrompt, buildUserPrompt } from "@/lib/contents/prompts";

export class OpenAIProvider implements AiProvider {
  private client: OpenAI;
  private config: AiProviderConfig;

  constructor(config: AiProviderConfig) {
    this.config = config;
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
      defaultHeaders: config.defaultHeaders,
    });
  }

  async generate(request: GenerationRequest): Promise<ReadableStream<Uint8Array>> {
    const systemPrompt = buildSystemPrompt(request.platform, request.types, request.style);
    const product = await this.loadProduct(request.productId);
    const userPrompt = buildUserPrompt(product);

    const stream = await this.client.chat.completions.create({
      model: this.config.model,
      temperature: this.config.temperature ?? 0.7,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      stream: true,
      response_format: { type: "json_object" },
    });

    const encoder = new TextEncoder();

    return new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const delta = chunk.choices?.[0]?.delta?.content;
            if (delta) {
              controller.enqueue(encoder.encode(delta));
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });
  }

  async generateSync(request: GenerationRequest): Promise<GenerationResponse> {
    const systemPrompt = buildSystemPrompt(request.platform, request.types, request.style);
    const product = await this.loadProduct(request.productId);
    const userPrompt = buildUserPrompt(product);

    const completion = await this.client.chat.completions.create({
      model: this.config.model,
      temperature: this.config.temperature ?? 0.7,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(raw);

    const content: GeneratedContent = {};
    for (const type of request.types) {
      const value = parsed[type];
      if (value !== undefined) {
        (content as Record<string, unknown>)[type] = value;
      }
    }

    return { content, platform: request.platform, types: request.types };
  }

  private async loadProduct(productId: string) {
    const { getProduct } = await import("@/lib/db/products");
    const product = await getProduct(productId);
    return {
      title: product?.title || "Produk",
      price: product?.price || 0,
      currency: product?.currency || "IDR",
      description: product?.description || null,
      imageUrl: product?.imageUrl || null,
    };
  }
}
