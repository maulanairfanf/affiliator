# Affiliator Project Overview

## What is Affiliator?

**Affiliator** is an affiliate content automation platform — an "Affiliate Marketing OS" that helps affiliates automate their daily workflow.

The core promise: *"Buka dashboard pagi hari, klik beberapa kali, lalu konten untuk hari ini sudah siap bahkan terjadwal."*

AI is the engine behind the scenes, but the value proposition is **workflow automation** — not AI itself.

## Business Flow

```
Search Product → Generate Content → Save to Library → Schedule Posting
      │                │                   │                │
      ▼                ▼                   ▼                ▼
  Shopee API      OpenRouter AI       Content History    node-cron
  (mock)          GPT-4o-mini         Copy w/ link       Playwright
```

## Module Architecture

```
                    Next.js 16 App Router
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
         ▼                 ▼                 ▼
     Products          Content AI       Scheduler
    Management         Generator          UI
         │                 │                 │
         └─────────────────┼─────────────────┘
                           │
                    API Routes (/api/*)
                           │
      ┌──────────────┬───────────────┬──────────────────┐
      ▼              ▼               ▼                  ▼
  Shopee API      Amazon API    OpenRouter AI      PostgreSQL
  (mock)          (mock)        (GPT-4o-mini)      (Prisma)

                           Scheduler Worker (separate process)
                                    │
                                    ▼
                               Playwright
                                    │
                                    ▼
                               Threads.net
```

## MVP Modules (5)

| # | Module | Description | Status |
|---|--------|-------------|--------|
| 1 | **Product Manager** | Search Shopee/Amazon via API (mock), Manual Add, save favorites. ProductProvider pattern | MVP |
| 2 | **AI Content Generator** | Generate ShortCaption, LongCaption, Hook, CTA, Hashtags, ProductSummary via OpenRouter | MVP |
| 3 | **Content Library** | Save & browse generated content with product thumbnail + affiliate link. Copy ready for Threads | MVP |
| 4 | **Scheduler** | Schedule content for auto-publication via Playwright (Threads only). Persistent browser batch posting | MVP |
| 5 | **Templates** | User-created custom templates with 5 style modifiers | Post-MVP |

## User Personas

- **Affiliator pemula** — punya 1-2 produk, butuh konten cepat untuk Threads
- **Affiliator profesional** — punya banyak produk, butuh schedule posting harian, template khusus
- **Affiliator agency** — manage multiple clients, butuh team features (post-MVP)

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | **Next.js 16** (App Router, Turbopack) | Full-stack React framework |
| Language | **TypeScript 5** (strict mode) | Type safety |
| UI Library | **React 19** + **shadcn/ui v4** | Base UI primitives |
| Styling | **Tailwind CSS 4** | Utility-first styling |
| ORM | **Prisma 6** | Database access + migrations |
| Database | **PostgreSQL 16** | Primary data store |
| Auth | **NextAuth v5** (Credentials + JWT) | Authentication |
| AI | **OpenRouter AI** (GPT-4o-mini, streaming) | Content generation |
| Validation | **Zod v4** | Schema validation (client + server) |
| Scheduler | **node-cron** (worker terpisah) | Cron job for scheduled posts |
| Social Posting | **Playwright** (session-based) | Automated posting to Threads |
| Icons | **lucide-react** | Icon library |
| Package Manager | **npm** | Dependency management |

## AI Integration

### Provider: OpenRouter AI (OpenAI-compatible, GPT-4o-mini)

- Cost-effective for content generation via OpenRouter
- Streaming support via server-sent events
- Configurable via env vars: `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_BASE_URL`

### Prompt Architecture

```
System: Kamu adalah asisten content creator untuk affiliate marketing.
Buat konten promosi berdasarkan data produk berikut.

Product:
- Nama: {name}
- Harga: {price}
- Deskripsi: {description}
- Gambar: {imageUrl}

Target Platform: {platform}
Template Style: {style}
Bahasa: Indonesia

Content types requested: {types}
- short_caption → max 150 char caption
- long_caption → 2-3 paragraph storytelling
- hook → 20 attention-grabbing hooks
- cta → 10 call-to-action variations
- hashtag → relevant hashtag suggestions
- product_summary → short 1-2 sentence summary
```

### Streaming Flow

```
Client → POST /api/contents/generate → OpenRouter API (stream: true)
                                              │
                                     Response ReadableStream
                                              │
                                     Client receives chunks
                                              │
                                     Render progressively
```

### Registry Pattern (OCP)

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

### ProductProvider Pattern (OCP)

```typescript
// lib/products/provider.ts — registry
const providers: Record<ProductSource, ProductProvider> = {
  shopee: new ShopeeProvider(),
  amazon: new AmazonProvider(),
  manual: new ManualProvider(),
};

export function getProvider(source: ProductSource): ProductProvider {
  return providers[source];
}
```

New source = new file + registry entry. No edits to existing providers.

## Database Schema

### Entity Relationship

```
User ──┬── Product ──┬── Content ──┬── Schedule
       │              │             │
       └── Template ──┘             │
                                    │
                              (scheduler worker)
```

### Models

See `prisma/schema.prisma` for the canonical schema. Key points:

- **User** — central entity, owns all other records
- **Product** — sourced from Shopee, Amazon, or manual entry
- **Content** — AI-generated content (threads only), 6 types
- **Template** — user-created prompt templates with 5 style modifiers
- **Schedule** — scheduled publication, checked by cron worker

### Ownership

Every record belongs to a user. All API queries filter by `userId` from session. Mutations verify ownership before delete/update. Zod schemas validate all inputs server-side.

## Scheduler Architecture

```
scheduler/
├── index.ts            — Cron setup, launches persistent Playwright browser
├── jobs/
│   └── publish.ts      — Fetches due schedules, calls publishBatch
└── lib/
    ├── db.ts           — Prisma client (separate instance)
    ├── types.ts        — Schedule type definitions
    ├── publisher.ts    — Routes to ThreadsProvider
    └── social/
        ├── login.ts    — Playwright session login (press Enter to save)
        └── threads.ts  — ThreadsProvider: post via Playwright, keyboard shortcut
```

Flow:
```
startup → launch persistent Chromium (reuses session)
        → cron tick (every 1 min)
            → query Schedule where scheduledAt <= now AND status = "pending"
            → ThreadsProvider.postBatch() — one browser, all posts
            → update status per schedule ("published" | "failed")
        → SIGINT/SIGTERM → close browser
```

### Session Management

- Session saved as `scheduler/storage/threads-state.json`
- Run `cd scheduler && npx tsx lib/social/login.ts` to login/refresh
- Error screenshots saved to `scheduler/storage/errors/`

### Posting Implementation

- Uses keyboard shortcut `Cmd+Enter` (Mac) / `Ctrl+Enter` (Linux) to post
- Avoids DOM-based button clicks that are intercepted by overlays
- Batch posts all due schedules in a single browser session

## Key Design Decisions

1. **Next.js monolith first** — API routes + frontend in one project. Split when needed.
2. **Scheduler worker terpisah** — decoupled from Next.js, runs as separate process via tsx.
3. **AI streaming** — real-time UX for content generation.
4. **Registry pattern** — new platform/content type = new file, no edits to existing (OCP).
5. **Product Provider pattern** — new product source = new file + registry entry.
6. **Const objects** — `Platform`, `ContentType`, `TemplateStyle` — never string literals.
7. **Interface segregation** — `ProductProvider`, `AiProvider`, `ContentGenerator` — small, focused interfaces.
8. **Persistent Chromium** — browser launches at scheduler startup, stays alive across cron ticks.
9. **Keyboard shortcut for Threads posting** — `Cmd+Enter` instead of button click (avoids overlay interception).
10. **Playwright over official API** — Threads API requires Meta review (weeks, no guarantee). Playwright works immediately.
11. **Threads only** — all other platforms removed. Adding new platforms requires new social provider.
