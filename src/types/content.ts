import type { Platform, ContentType, TemplateStyle } from "@/lib/constants";

export interface Content {
  id: string;
  userId: string;
  productId: string | null;
  platform: Platform;
  type: ContentType;
  content: string;
  templateId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GeneratedContent {
  caption?: string;
  hashtags?: string[];
  cta?: string;
  script?: string;
  faq?: Array<{ question: string; answer: string }>;
  seo?: { title: string; description: string };
}

export interface GenerationRequest {
  productId: string;
  platform: Platform;
  types: ContentType[];
  style?: TemplateStyle;
  templateId?: string;
}

export interface GenerationResponse {
  content: GeneratedContent;
  platform: Platform;
  types: ContentType[];
}
