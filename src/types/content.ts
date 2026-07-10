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
  short_caption?: string;
  long_caption?: string;
  hook?: string[];
  cta?: string[];
  hashtag?: string[];
  product_summary?: string;
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
