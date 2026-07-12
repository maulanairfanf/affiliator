import { z } from "zod";
import { ProductSource, Platform, ContentType, TemplateStyle, ScheduleStatus } from "@/lib/constants";

export const createProductSchema = z.object({
  title: z.string().min(1, "Title is required"),
  price: z.number().optional().default(0),
  currency: z.string().default("IDR"),
  imageUrl: z.string().url().optional(),
  videoUrl: z.string().url().optional(),
  description: z.string().optional(),
  source: z.enum(Object.values(ProductSource) as [string, ...string[]]),
  sourceUrl: z.string().url().optional(),
  affiliateLink: z.string().url().optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const createContentSchema = z.object({
  productId: z.string().optional(),
  platform: z.enum(Object.values(Platform) as [string, ...string[]]),
  type: z.enum(Object.values(ContentType) as [string, ...string[]]),
  content: z.string().min(1, "Content is required"),
  templateId: z.string().optional(),
});

export const generateContentSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  platform: z.enum(Object.values(Platform) as [string, ...string[]]),
  types: z.array(z.enum(Object.values(ContentType) as [string, ...string[]])).min(1, "At least one type required"),
  style: z.enum(Object.values(TemplateStyle) as [string, ...string[]]).optional(),
  templateId: z.string().optional(),
});

export const createScheduleSchema = z.object({
  productId: z.string().optional(),
  contentId: z.string().min(1, "Content ID is required"),
  platform: z.enum(Object.values(Platform) as [string, ...string[]]),
  scheduledAt: z.string().min(1, "Schedule time is required"),
});
