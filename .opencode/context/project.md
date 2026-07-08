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
  Shopee API      OpenAI GPT-4o      Content History    node-cron
  Amazon API      Prompt Temp.       Copy/Re-gen        Worker
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
      ┌──────────────┬───────────────┬─────────────┐
      ▼              ▼               ▼             ▼
  Shopee API      Amazon API      OpenAI API   PostgreSQL
  (PA-API 5)                                   (Prisma)
```

## MVP Modules (5)

| # | Module | Description | Status |
|---|--------|-------------|--------|
| 1 | **Product Manager** | Search Shopee/Amazon via API, paste manual link, save favorites | MVP |
| 2 | **AI Content Generator** | Generate captions, scripts, hashtags, CTA per platform + template style | MVP |
| 3 | **Content Library** | Save & browse all generated content history | MVP |
| 4 | **Scheduler** | Schedule content for auto-publication | MVP |
| 5 | **Media** | Product images/videos (auto-fetch or manual upload) | Post-MVP |
| 6 | **Link Management** | Flexible affiliate link replacement in generated content | Post-MVP |
| 7 | **Templates** | User-created custom templates | Post-MVP |

## User Personas

- **Affiliator pemula** — punya 1-2 produk, butuh konten cepat untuk TikTok/IG
- **Affiliator profesional** — punya banyak produk, butuh schedule posting harian, template khusus
- **Affiliator agency** — manage multiple clients, butuh team features (post-MVP)

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | **Next.js 16** (App Router, Turbopack) | Full-stack React framework |
| Language | **TypeScript 5** (strict mode) | Type safety |
| UI Library | **React 19** + **shadcn/ui** | Accessible component primitives |
| Styling | **Tailwind CSS 4** | Utility-first styling |
| ORM | **Prisma 6** | Database access + migrations |
| Database | **PostgreSQL 16** | Primary data store |
| Auth | **NextAuth v5** (Auth.js) | Authentication |
| AI | **OpenAI API** (GPT-4o-mini) | Content generation |
| Validation | **Zod** | Schema validation (client + server) |
| Scheduler | **node-cron** (worker terpisah) | Cron job for scheduled posts |
| Icons | **lucide-react** | Icon library |
| Package Manager | **npm** | Dependency management |

## AI Integration

### Provider: OpenAI GPT-4o-mini

- Cost-effective for content generation
- Streaming support via server-sent events
- Temperature: 0.7 for creative content

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

Output format per platform:
- tiktok → caption pendek (max 150 char), hook di awal
- instagram → caption visual + storytelling
- facebook → informatif, lebih panjang
- x → thread (multiple tweets)
- youtube → script narasi video
```

### Streaming Flow

```
Client → POST /api/contents/generate → OpenAI API (stream: true)
                                             │
                                    Response ReadableStream
                                             │
                                    Client receives chunks
                                             │
                                    Render progressively
```

### Registry Pattern (OCP)

```typescript
// New platform = new entry in registry, no edits to existing code
const platformPrompts: Record<ContentPlatform, PromptConfig> = {
  [Platform.Tiktok]: { ... },
  [Platform.Instagram]: { ... },
  // Add new platform here without editing other entries
}
```

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
- **Content** — AI-generated content, linked to product + optional template
- **Template** — user-created prompt templates
- **Schedule** — scheduled publication, checked by cron worker

### Ownership

Every record belongs to a user. All API queries filter by `userId` from session.

## Scheduler Architecture

```
scheduler/
├── index.ts            — Cron setup, runs every minute
├── jobs/publish.ts     — Fetches due schedules, executes
└── lib/
    ├── db.ts           — Prisma client (separate instance)
    └── publisher.ts    — Publish logic per platform (placeholder)
```

Flow:
```
cron tick (every 1 min)
  → query Schedule where scheduledAt <= now AND status = "pending"
  → for each: execute publish → update status to "published" or "failed"
```

## Key Design Decisions

1. **Next.js monolith first** — API routes + frontend in one project. Split when needed.
2. **Scheduler worker terpisah** — decoupled from Next.js, runs as separate process.
3. **AI streaming** — real-time UX for content generation.
4. **Registry pattern** — new platform/template style = new file, no edits to existing.
5. **Const objects** — `Platform`, `ContentType`, `TemplateStyle` — never string literals.
6. **Interface segregation** — `Searcher`, `Scraper`, `Generator`, `Publisher` — small, focused interfaces.
