import type { TemplateStyle, Platform } from "@/lib/constants";

export interface Template {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  style: TemplateStyle;
  prompt: string;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateConfig {
  platform: Platform;
  style: TemplateStyle;
  customPrompt?: string;
}

export interface TemplateFormData {
  name: string;
  description?: string;
  style: TemplateStyle;
  prompt: string;
}
