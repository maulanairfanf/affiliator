# Coding Conventions

## Enums: Use Const Objects

**Rule:** Co-locate const objects and derived types. Never scatter string literals like `"threads"` or `"short_caption"` across call sites.

**Location:** `src/lib/constants.ts`

**Pattern:**
```ts
export const Platform = {
  Threads: "threads",
} as const;
export type Platform = (typeof Platform)[keyof typeof Platform];

export const ContentType = {
  ShortCaption: "short_caption",
  LongCaption: "long_caption",
  Hook: "hook",
  Cta: "cta",
  Hashtag: "hashtag",
  ProductSummary: "product_summary",
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
- ✅ `content.platform === Platform.Threads`
- ❌ `content.platform === "threads"`
- ✅ `content.type === ContentType.ShortCaption`
- ❌ `content.type === "short_caption"`

---

## Zod Validation

**Rule:** Every mutating API route must validate input server-side with Zod.

**Location:** `src/lib/validation/schemas.ts`

**Pattern:**
```ts
import { z } from "zod";
import { Platform, ContentType, ProductSource } from "@/lib/constants";

export const createProductSchema = z.object({
  title: z.string().min(1),
  price: z.number().positive(),
  source: z.enum(Object.values(ProductSource) as [string, ...string[]]),
  // ... more fields
});

// In route file:
const parsed = createProductSchema.safeParse(body);
if (!parsed.success) {
  return NextResponse.json(
    { error: "Validation failed", errors: parsed.error.flatten().fieldErrors },
    { status: 400 }
  );
}
```

**Note:** Cast `parsed.data as TargetType` at call site when Zod infers `string` instead of const object literal types (e.g., `ProductSource`).

---

## Imports: Server vs Client Separation

**Critical Rule:** Client components cannot import from files that use server-only APIs (`next/headers`, `next/server`, etc.).

**Pattern:**
- `src/lib/constants.ts` — Shared types and const objects (NO server-only imports)
- `src/lib/auth.ts` — Server-only functions (session handling)
- `src/lib/db/` — Server-only (Prisma queries)
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

**Never:** Import `@/lib/auth`, `@/lib/db`, or `@/lib/db/*` in client components.

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
- No `asChild` on Button (Base UI doesn't support it)

### Known reusable components

| Component | Used by | Purpose |
|-----------|---------|---------|
| `product-card.tsx` | search results, product list | Display product info |
| `content-card.tsx` | generator output, library | Display generated content |
| `affiliate-link-input.tsx` | product detail, content edit | Input + validate affiliate link |
| `dashboard-sidebar.tsx` | dashboard layout | Sidebar navigation |

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
  baseURL?: string;
  defaultHeaders?: Record<string, string>;
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
| API Route | HTTP handling + Zod validation | `src/app/api/**/route.ts` |
| Business Logic | Domain rules | `src/lib/*/service.ts` |
| DB Query | Prisma access | `src/lib/db/*.ts` |
| Validation | Zod schemas | `src/lib/validation/schemas.ts` |
| Type | Shape definitions | `src/types/*.ts` |

**Rule:** One file = one responsibility. If a file does two things, split it.

### O — Open/Closed

**Pattern:** Registry pattern for extensible components.

```typescript
// lib/contents/generator.ts — registry
const prompts = {
  threads: {
    short_caption: { system, user },
    long_caption: { system, user },
    hook: { system, user },
    cta: { system, user },
    hashtag: { system, user },
    product_summary: { system, user },
  },
};
```

Adding a new content type? Add to registry. No edits to existing handlers.

### L — Liskov Substitution

**Pattern:** All AI providers implement the `AiProvider` interface.

```ts
interface AiProvider {
  generate(request: GenerationRequest): Promise<ReadableStream>;
}
```

Any provider implementing this interface can be swapped in without breaking consumers.

### I — Interface Segregation

**Pattern:** Small, focused interfaces instead of one big `AffiliatorService`.

```ts
interface ProductProvider {
  search(query: string): Promise<ProductSearchResult[]>;
}

interface AiProvider {
  generate(request: GenerationRequest): Promise<ReadableStream>;
}

interface SchedulePublisher {
  postBatch(items: PostItem[]): Promise<PostResult[]>;
}
```

**Rule:** If a type needs only 2 fields from a 10-field interface, create a focused interface.

### D — Dependency Inversion

**Pattern:** High-level modules depend on abstractions, not concretions.

```ts
// lib/contents/service.ts — high level
import type { AiProvider } from "@/types/ai";

export class ContentService {
  constructor(private provider: AiProvider) {}

  async generate(request: GenerationRequest) {
    return this.provider.generate(request);
  }
}

// Dependency injection at route level
const openaiProvider = new OpenAIProvider(config);
const service = new ContentService(openaiProvider);
```

Testability: swap `openaiProvider` with a mock in tests.

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
- `delete<X>(id, userId)` — deletes with ownership verification
- `count<X>(userId, filter?)` — number

**Ownership filter:**
```ts
export async function listProducts(userId: string, filter?: ProductFilter) {
  return prisma.product.findMany({
    where: { userId, ...buildWhere(filter) },
    orderBy: { createdAt: "desc" },
  });
}
```

**Ownership verification on delete:**
```ts
export async function deleteContent(id: string, userId: string) {
  const existing = await prisma.content.findUnique({
    where: { id },
    select: { userId: true },
  });
  if (!existing || existing.userId !== userId) {
    throw new Error("Content not found");
  }
  return prisma.content.delete({ where: { id } });
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

2. **Zod validation** — Every mutating handler validates input server-side with `safeParse`.

3. **Ownership verification** — POST endpoints referencing `productId`/`contentId` must verify the referenced entity belongs to the session user. DELETE endpoints must verify ownership before deleting.

```ts
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createProductSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Validation failed", errors: parsed.error.flatten() }, { status: 400 });
    }

    // ... business logic
  } catch (error) {
    console.error("Failed to create product:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

4. **Return shape:**
   - `{ data: ... }` for read
   - `{ success: true, data: ... }` for create/update
   - `{ error: "message" }` for failures
   - Validation errors: `{ error: "Validation failed", errors: { field: ["msg1"] } }`

5. **Status codes:**
   - 200 — OK (read or update)
   - 201 — Created (POST)
   - 400 — Bad Request (validation)
   - 401 — Unauthorized (no session)
   - 403 — Forbidden (wrong ownership)
   - 404 — Not Found
   - 500 — Internal Server Error

6. **Wrap in try/catch** — Always. Log error, return 500 with generic message.

7. **Use `prisma.$transaction`** — When mutating multiple records atomically.

---

## Server vs Client Components

- Default: **server components** (no `"use client"`)
- Add `"use client"` only when needed: useState, useEffect, event handlers, browser APIs
- Data fetching: prefer server component + async. Use React Query only for interactive refetching.

---

## Scheduler Worker Conventions

**File structure:**
```
scheduler/
├── index.ts                — Entry point: persistent browser launch, cron, graceful shutdown
├── jobs/publish.ts         — Cron job logic: fetch due schedules, call publishBatch
└── lib/
    ├── db.ts               — Prisma client
    ├── types.ts            — Schedule type
    ├── publisher.ts        — Routes to ThreadsProvider (platform-based dispatch)
    └── social/
        ├── login.ts        — Playwright session login (press Enter to save)
        └── threads.ts      — ThreadsProvider: post batch via Playwright
```

**Browser lifecycle:**
- Start: launch `chromium.launch({ headless })` with session from `threads-state.json`
- Cron ticks: reuse same browser instance for every `checkAndPublish()` call
- Shutdown: `browser.close()` on SIGINT/SIGTERM

**Posting:**
- Use `ThreadsProvider.postBatch()` for batch posting — one browser, multiple posts
- Use keyboard shortcut `Cmd+Enter` / `Ctrl+Enter` instead of DOM button click
- Each post navigated via `page.goto()` → compose → fill → keyboard shortcut
- Individual post failures caught with screenshot saved to `storage/errors/`

**Session:**
- Session file: `scheduler/storage/threads-state.json` (gitignored)
- Login: `cd scheduler && npx tsx lib/social/login.ts`
- Session auto-refreshed after each successful cron tick via `context.storageState()`

---

## What NOT to Do

- ❌ Don't put `prisma` calls in page or component files
- ❌ Don't use `any` type — use `unknown` and narrow
- ❌ Don't use `console.log` in committed code — `console.error` allowed in catch blocks
- ❌ Don't use string literals for platforms, content types, template styles — use const objects
- ❌ Don't define interfaces locally in components — import from `src/types/`
- ❌ Don't pre-extract components for hypothetical reuse — wait for second occurrence
- ❌ Don't skip auth/Zod checks in API routes
- ❌ Don't skip ownership verification on DELETE or entity-referencing POST endpoints
- ❌ Don't fetch in `useEffect` for page-load data — use server component
- ❌ Don't import server-only modules (`@/lib/auth`, `@/lib/db`) in client components
- ❌ Don't create barrel files (`index.ts` re-exports) — they hurt tree-shaking
- ❌ Don't use raw HTML `<form>` — use `shadcn/ui` form components
- ❌ Don't hardcode API URLs — use relative paths (`/api/...`)
- ❌ Don't open/close Chromium per schedule — use persistent browser

## When to Refactor

| Signal | Action |
|--------|--------|
| File > 300 lines | Extract largest responsibility |
| Three+ `if (platform === ...)` on same value | Replace with registry map |
| Same logic duplicated 3+ times | Extract pure helper to `lib/<module>/utils.ts` |
| Component renders JSX + holds state + parses data | Split: renderer + hook + parser |
| Two+ callers need same derived value | Extract a `use<X>` hook |
