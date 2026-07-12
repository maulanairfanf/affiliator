export const Platform = {
  Threads: "threads",
} as const;
export type Platform = (typeof Platform)[keyof typeof Platform];

export const ContentType = {
  LongCaption: "long_caption",
  Hook: "hook",
  Cta: "cta",
  Hashtag: "hashtag",
  ProductSummary: "product_summary",
  Riddle: "riddle",
} as const;
export type ContentType = (typeof ContentType)[keyof typeof ContentType];

export const TemplateStyle = {
  SoftSelling: "soft_selling",
  HardSelling: "hard_selling",
  Storytelling: "storytelling",
  Review: "review",
  ProblemSolution: "problem_solution",
} as const;
export type TemplateStyle = (typeof TemplateStyle)[keyof typeof TemplateStyle];

export const ProductSource = {
  Shopee: "shopee",
  Amazon: "amazon",
  Manual: "manual",
} as const;
export type ProductSource = (typeof ProductSource)[keyof typeof ProductSource];

export const ScheduleStatus = {
  Pending: "pending",
  Published: "published",
  Failed: "failed",
} as const;
export type ScheduleStatus = (typeof ScheduleStatus)[keyof typeof ScheduleStatus];
