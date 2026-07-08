# Coding Conventions

## Enums: Use Const Objects

**Rule:** Co-locate const objects and derived types. Never scatter string literals like `"tiktok"` or `"caption"` across call sites.

**Location:** `src/lib/constants.ts`

**Pattern:**
```ts
export const Platform = {
  Tiktok: "tiktok",
  Instagram: "instagram",
  Facebook: "facebook",
  X: "x",
  Youtube: "youtube",
} as const;
export type Platform = (typeof Platform)[keyof typeof Platform];

export const ContentType = {
  Caption: "caption",
  Script: "script",
  Cta: "cta",
  Hashtag: "hashtag",
  Title: "title",
  Seo: "seo",
  Faq: "faq",
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
```

**Usage:**
- ✅ `content.platform === Platform.Tiktok`
- ❌ `content.platform === "tiktok"`
- ✅ `content.type === ContentType.Caption`
- ❌ `content.type === "caption"`

---

## Imports: Server vs Client Separation

**Critical Rule:** Client components cannot import from files that use server-only APIs (`next/headers`, `next/server`, etc.).

**Pattern:**
- `src/lib/constants.ts` — Shared types and const objects (NO server-only imports)
- `src/lib/auth.ts` — Server-only functions (session handling)
- `src/lib/ai.ts` — Server-only (OpenAI client wrapper)
- `src/lib/utils.ts` — Shared utilities (`cn()`)

**Client components:**
```ts
import type { Platform } from "@/lib/constants";
import { ContentType } from "@/lib/constants";
import { cn } from "@/lib/utils";
```

**Server components/API routes:**
```ts
import { auth } from "@/lib/auth";
import { Platform, ContentType } from "@/lib/constants";
```

**Never:** Import `@/lib/auth`, `@/lib/ai`, or `@/lib/db` in client components.

---

## Reusable Components

### Location: `src/components/features/<name>.tsx`

Components in `features/` must be used by 2+ pages before extraction. Don't pre-extract.

### Pattern

```ts
interface ProductCardProps {
  product: Product;
  onSelect?: (product: Product) => void;
  className?: string;
}

export function ProductCard({ product, onSelect, className }: ProductCardProps) {
  return (
    <div className={cn("rounded-lg border p-4", className)}>
      <img src={product.imageUrl} alt={product.title} />
      <h3>{product.title}</h3>
      <p>{product.price}</p>
      {onSelect && (
        <Button onClick={() => onSelect(product)}>Select</Button>
      )}
    </div>
  );
}
```

### Rules
- Named exports (no default exports)
- Typed props with `interface <Name>Props`
- Optional `className?: string` for composition
- Use `cn()` from `@/lib/utils` for conditional classes
- One component per file, filename matches export name
- Return `null` early when not applicable (avoid conditional wrappers)

### Known reusable components

| Component | Used by | Purpose |
|-----------|---------|---------|
| `product-card.tsx` | search results, product list | Display product info |
| `content-card.tsx` | generator output, library | Display generated content |
| `platform-badge.tsx` | content card, schedule list | Show platform label with icon |
| `affiliate-link-input.tsx` | product detail, content edit | Input + validate affiliate link |
| `schedule-picker.tsx` | new schedule, content page | Date/time + platform picker |

### State handling

Every data view must handle:
- **Loading** — skeleton or spinner
- **Empty** — illustration + message + CTA
- **Error** — error message + retry button
- **Success** — actual data

---

## Reusable Interfaces

### Location: `src/types/<entity>.ts`

All shared interfaces live in `src/types/` — never define locally in components or pages.

### Interface list

**`src/types/product.ts`**
```ts
export interface Product {
  id: string;
  userId: string;
  title: string;
  price: number;
  currency: string;
  imageUrl: string | null;
  videoUrl: string | null;
  description: string | null;
  source: ProductSource;
  sourceUrl: string | null;
  affiliateLink: string | null;
}

export interface ProductSearchResult {
  title: string;
  price: number;
  currency: string;
  imageUrl: string | null;
  videoUrl: string | null;
  description: string | null;
  sourceUrl: string;
  source: ProductSource;
}

export interface ProductFilter {
  source?: ProductSource;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
}
```

**`src/types/content.ts`**
```ts
export interface Content {
  id: string;
  userId: string;
  productId: string | null;
  platform: Platform;
  type: ContentType;
  content: string;
  templateId: string | null;
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
  type: ContentType[];
  style?: TemplateStyle;
  templateId?: string;
}

export interface GenerationResponse {
  content: GeneratedContent;
  platform: Platform;
  type: ContentType[];
}
```

**`src/types/template.ts`**
```ts
export interface Template {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  style: TemplateStyle;
  prompt: string;
}

export interface TemplateConfig {
  platform: Platform;
  style: TemplateStyle;
  customPrompt?: string;
}
```

**`src/types/schedule.ts`**
```ts
export interface Schedule {
  id: string;
  userId: string;
  productId: string;
  contentId: string;
  platform: Platform;
  scheduledAt: string; // ISO datetime
  status: ScheduleStatus;
}

export interface ScheduleFilter {
  status?: ScheduleStatus;
  platform?: Platform;
  startDate?: string;
  endDate?: string;
}
```

**`src/types/ai.ts`**
```ts
export interface AiProvider {
  generate(request: GenerationRequest): Promise<ReadableStream>;
  generateSync(request: GenerationRequest): Promise<GenerationResponse>;
}

export interface AiProviderConfig {
  apiKey: string;
  model: string;
  temperature?: number;
}
```

**`src/types/common.ts`**
```ts
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  success?: boolean;
}

export interface WithPagination {
  page?: number;
  pageSize?: number;
}
```

### Interface segregation principles
- Each interface has a focused responsibility
- No interface > 8 properties
- Split by module: product interfaces in `product.ts`, content in `content.ts`
- Use generics (`PaginatedResponse<T>`) for reusable patterns
- Never reuse a single `Result` type across different entities

---

## SOLID Principles Implementation

### S — Single Responsibility

| Layer | Responsibility | Location |
|-------|---------------|----------|
| UI Component | Render + user interaction | `src/components/features/*.tsx` |
| Page | Compose components + data fetching | `src/app/**/page.tsx` |
| API Route | HTTP handling + validation | `src/app/api/**/route.ts` |
| Business Logic | Domain rules | `src/lib/*/service.ts` |
| DB Query | Prisma access | `src/lib/db/*.ts` |
| Type | Shape definitions | `src/types/*.ts` |

**Rule:** One file = one responsibility. If a file does two things, split it.

### O — Open/Closed

**Pattern:** Registry pattern for extensible components.

```ts
// lib/contents/generator.ts — registry
const generators: Record<Platform, ContentGenerator> = {
  [Platform.Tiktok]: tiktokGenerator,
  [Platform.Instagram]: instagramGenerator,
  [Platform.Facebook]: facebookGenerator,
  [Platform.X]: xGenerator,
  [Platform.Youtube]: youtubeGenerator,
};

export async function generateContent(request: GenerationRequest) {
  const generator = generators[request.platform];
  return generator.generate(request);
}
```

Adding a new platform? Create a new generator file and add it to the registry. No edits to existing generators.

### L — Liskov Substitution

**Pattern:** All content generators implement the `ContentGenerator` interface.

```ts
interface ContentGenerator {
  generate(request: GenerationRequest): Promise<ReadableStream>;
}
```

Any generator implementing this interface can be swapped in without breaking consumers.

### I — Interface Segregation

**Pattern:** Small, focused interfaces instead of one big `AffiliatorService`.

```ts
interface ProductSearcher {
  search(query: string, source: ProductSource): Promise<ProductSearchResult[]>;
}

interface ProductScraper {
  scrape(url: string): Promise<ProductSearchResult>;
}

interface ContentGenerator {
  generate(request: GenerationRequest): Promise<ReadableStream>;
}

interface SchedulePublisher {
  publish(schedule: Schedule): Promise<void>;
}
```

**Rule:** If a type needs only 2 fields from a 10-field interface, create a focused interface.

### D — Dependency Inversion

**Pattern:** High-level modules depend on abstractions, not concretions.

```ts
// lib/contents/service.ts — high level
import type { ContentGenerator } from "@/types/ai";

export class ContentService {
  constructor(private generator: ContentGenerator) {}

  async generate(request: GenerationRequest) {
    return this.generator.generate(request);
  }
}

// Dependency injection at route level
const openaiGenerator = new OpenAIProvider(config);
const service = new ContentService(openaiGenerator);
```

Testability: swap `openaiGenerator` with a mock in tests.

---

## Clean Code Rules

### Naming
- Functions: verbs (`getProductById`, `generateContent`, `publishSchedule`)
- Variables: nouns (`product`, `contentList`, `scheduledAt`)
- Booleans: prefix with `is`, `has`, `should` (`isLoading`, `hasMore`, `shouldRefresh`)
- Constants: UPPER_SNAKE_CASE for config values
- Files: `kebab-case.ts` for lib, `PascalCase.tsx` for components

### Function size
- Max **30 lines** per function
- Extract pure helpers to `lib/<module>/utils.ts`
- Extract React hooks to `hooks/use<Feature>.ts`

### Early return
```ts
// ✅ Good
if (!product) return null;
if (!session) return { error: "Unauthorized" };

// ❌ Bad
if (product) {
  if (session) {
    // ... deeply nested logic
  }
}
```

### Error handling
- Wrap API route logic in try/catch
- Return structured error responses: `{ error: "message" }`
- Log errors server-side only (not client)
- Specific error messages for users, detailed logs for developers
- Use `console.error` in catch blocks, never `console.log`

### No magic strings
```ts
// ✅ Good
if (product.source === ProductSource.Shopee) { ... }

// ❌ Bad
if (product.source === "shopee") { ... }
```

### No `any`
```ts
// ✅ Good
function process(data: unknown): string { ... }

// ❌ Bad
function process(data: any): string { ... }
```

---

## Database Access

**Rule:** Never call `prisma` directly in pages, components, or API routes.

**File structure:**
```
src/lib/db/
├── products.ts       # CRUD for Product model
├── contents.ts       # CRUD for Content model
├── templates.ts      # CRUD for Template model
├── schedules.ts      # CRUD for Schedule model
└── index.ts          # Re-exports (used sparingly)
```

**Naming convention:**
- `get<X>(id)` — one record or null (`getProductById`, `getContentById`)
- `list<X>(options?)` — many records with filters + pagination (`listProducts`, `listContents`)
- `create<X>(data)` — created record
- `update<X>(id, data)` — updated record
- `delete<X>(id)` — Promise<void>
- `count<X>(filter?)` — number

**Ownership filter:**
```ts
export async function listProducts(userId: string, filter?: ProductFilter) {
  return prisma.product.findMany({
    where: { userId, ...buildWhere(filter) },
    orderBy: { createdAt: "desc" },
  });
}
```

**Transactions:**
```ts
await prisma.$transaction(async (tx) => {
  await tx.content.create({ data: contentData });
  await tx.schedule.create({ data: scheduleData });
});
```

---

## API Routes

**Hard rules:**

1. **Auth check first** — Every mutating handler checks session and ownership as first step.

```ts
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    // ...
  } catch (error) {
    console.error("Failed to create product:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

2. **Wrap in try/catch** — Always. Log error, return 500 with generic message.

3. **Return shape:**
   - `{ data: ... }` for read
   - `{ success: true, data: ... }` for create/update
   - `{ error: "message" }` for failures
   - Validation errors: `{ error: "Validation failed", errors: { field: ["msg1"] } }`

4. **Status codes:**
   - 200 — OK (read or update)
   - 201 — Created (POST)
   - 400 — Bad Request (validation)
   - 401 — Unauthorized (no session)
   - 403 — Forbidden (wrong ownership)
   - 404 — Not Found
   - 500 — Internal Server Error

5. **Validate input server-side** — Zod schemas on every mutation endpoint.

6. **Use `prisma.$transaction`** — When mutating multiple records atomically.

---

## Server vs Client Components

- Default: **server components** (no `"use client"`)
- Add `"use client"` only when needed: useState, useEffect, event handlers, browser APIs
- Data fetching: prefer server component + async. Use React Query only for interactive refetching.

---

## What NOT to Do

- ❌ Don't put `prisma` calls in page or component files
- ❌ Don't use `any` type — use `unknown` and narrow
- ❌ Don't use `console.log` in committed code — `console.error` allowed in catch blocks
- ❌ Don't use string literals for platforms, content types, template styles — use const objects
- ❌ Don't define interfaces locally in components — import from `src/types/`
- ❌ Don't pre-extract components for hypothetical reuse — wait for second occurrence
- ❌ Don't skip auth checks in API routes
- ❌ Don't fetch in `useEffect` for page-load data — use server component
- ❌ Don't import server-only modules (`@/lib/auth`, `@/lib/db`) in client components
- ❌ Don't create barrel files (`index.ts` re-exports) — they hurt tree-shaking
- ❌ Don't use raw HTML `<form>` — use `shadcn/ui` form components
- ❌ Don't hardcode API URLs — use relative paths (`/api/...`)

## When to Refactor

| Signal | Action |
|--------|--------|
| File > 300 lines | Extract largest responsibility |
| Three+ `if (platform === ...)` on same value | Replace with registry map |
| Same logic duplicated 3+ times | Extract pure helper to `lib/<module>/utils.ts` |
| Component renders JSX + holds state + parses data | Split: renderer + hook + parser |
| Two+ callers need same derived value | Extract a `use<X>` hook |
