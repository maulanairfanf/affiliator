# Affiliator Development Guide

> Rules and patterns for AI agents and human contributors working on **Affiliator** — an affiliate content automation platform.
> If a future you (human or LLM) reads this and disagrees with a rule, fix the rule first, then the code.

## AI Context

This project uses `.opencode/context/` for background knowledge that AI agents should always have:

- `context/project.md` — Tech stack, architecture, module details, database schema
- `context/conventions.md` — Coding standards, SOLID principles, reusable components/interfaces

## Quick Start

1. Read `context/project.md` for architecture overview
2. Read `context/conventions.md` for coding standards
3. Invoke the appropriate agent for your task

## See also

- `.opencode/context/` — detailed context files
- `README.md` — project overview, setup

---

## Project Overview

**Affiliator** is an affiliate content automation platform — not just an "AI tool". The core value is workflow automation: search products, generate promotional content, manage affiliate links, and schedule distribution across platforms.

### MVP Modules (5)

| # | Module | Description |
|---|--------|-------------|
| 1 | **Product Manager** | Search Shopee/Amazon via API, paste manual link, save favorites |
| 2 | **AI Content Generator** | Generate captions, scripts, hashtags, CTA per platform + template style |
| 3 | **Content Library** | Save & browse all generated content history |
| 4 | **Scheduler** | Schedule content for auto-publication (premium feature) |

### Architecture

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

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | **Next.js 16** (App Router, Turbopack) |
| Language | **TypeScript 5** (strict mode) |
| UI Library | **React 19** + **shadcn/ui** (Radix primitives) |
| Styling | **Tailwind CSS 4** |
| ORM | **Prisma 6** |
| Database | **PostgreSQL 16** |
| Auth | **NextAuth v5** (Auth.js) |
| AI | **OpenAI API** (GPT-4o-mini, streaming) |
| Validation | **Zod** |
| Scheduler | **node-cron** (worker terpisah) |
| Icons | **lucide-react** |

### Key Directories

```
src/
├── app/
│   ├── (landing)/          — Public landing page
│   ├── (dashboard)/
│   │   ├── layout.tsx      — Dashboard shell (sidebar + topbar)
│   │   ├── products/       — Product management pages
│   │   ├── contents/       — AI content generator pages
│   │   ├── library/        — Content library / history pages
│   │   └── schedules/      — Scheduler pages
│   └── api/
│       ├── auth/           — NextAuth route handlers
│       ├── products/       — Product CRUD + search
│       ├── contents/       — Content CRUD + AI generate
│       ├── schedules/      — Schedule CRUD
│       └── media/          — File upload
├── components/
│   ├── ui/                 — shadcn/ui primitives — DO NOT modify
│   └── features/           — Reusable feature components
│       ├── product-card.tsx
│       ├── content-card.tsx
│       ├── platform-badge.tsx
│       ├── affiliate-link-input.tsx
│       └── schedule-picker.tsx
├── lib/
│   ├── db.ts               — Prisma client singleton
│   ├── utils.ts            — cn() helper (clsx + tailwind-merge)
│   ├── auth.ts             — Auth configuration
│   ├── ai.ts               — OpenAI client wrapper
│   ├── constants.ts        — Const objects (Platform, ContentType, TemplateStyle, etc.)
│   ├── db/                 — Prisma query functions (one file per entity)
│   ├── products/           — Product business logic + scrapers
│   ├── contents/           — Content generation logic
│   └── schedules/          — Scheduling logic
├── types/
│   ├── product.ts          — Product, ProductSearchResult, ProductSource, ProductFilter
│   ├── content.ts          — Content, GeneratedContent, ContentPlatform, ContentType
│   ├── template.ts         — Template, TemplateStyle, TemplateConfig
│   ├── schedule.ts         — Schedule, ScheduleStatus, ScheduleFilter
│   ├── ai.ts               — AiProvider, GenerationRequest, GenerationResponse
│   └── common.ts           — PaginatedResponse<T>, SelectOption, ApiResponse<T>, WithPagination
└── styles/
    └── globals.css         — Global styles + Tailwind
scheduler/                  — node-cron worker (terpisah dari Next.js)
├── index.ts                — Entry point, cron setup
├── jobs/
│   └── publish.ts          — Check due schedules + publish
└── lib/
    ├── db.ts               — Prisma client
    └── publisher.ts        — Publish logic (placeholder for real API)
```

### Database Schema (Prisma)

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  products  Product[]
  contents  Content[]
  schedules Schedule[]
  templates Template[]
}

model Product {
  id            String   @id @default(cuid())
  userId        String
  title         String
  price         Float
  currency      String   @default("IDR")
  imageUrl      String?
  videoUrl      String?
  description   String?
  source        String   // "shopee" | "amazon" | "manual"
  sourceUrl     String?
  affiliateLink String?
  user          User     @relation(fields: [userId], references: [id])
  contents      Content[]
  schedules     Schedule[]
}

model Content {
  id         String   @id @default(cuid())
  userId     String
  productId  String?
  platform   String   // "tiktok" | "instagram" | "facebook" | "x" | "youtube"
  type       String   // "caption" | "script" | "cta" | "hashtag" | "title" | "seo" | "faq"
  content    String   @db.Text
  templateId String?
  product    Product? @relation(fields: [productId], references: [id])
  user       User     @relation(fields: [userId], references: [id])
  schedules  Schedule[]
}

model Template {
  id          String   @id @default(cuid())
  userId      String
  name        String
  description String?
  style       String   // "soft_selling" | "hard_selling" | "storytelling" | "review" | "problem_solution"
  prompt      String   @db.Text
  user        User     @relation(fields: [userId], references: [id])
  contents    Content[]
}

model Schedule {
  id          String   @id @default(cuid())
  userId      String
  productId   String
  contentId   String
  platform    String
  scheduledAt DateTime
  status      String   @default("pending") // "pending" | "published" | "failed"
  user        User     @relation(fields: [userId], references: [id])
  product     Product  @relation(fields: [productId], references: [id])
  content     Content  @relation(fields: [contentId], references: [id])
}
```

### Module Details

#### Product Manager
- **Alur**: User search via Shopee API / Amazon PA-API → tampilkan hasil → pilih & simpan → edit affiliate link manual
- **File structure**:
  ```
  src/
  ├── app/(dashboard)/products/
  │   ├── page.tsx            — Daftar produk tersimpan
  │   ├── search/page.tsx     — Pencarian produk
  │   └── [id]/page.tsx       — Detail produk
  ├── app/api/products/
  │   ├── route.ts            — CRUD produk
  │   └── search/route.ts     — Pencarian via API Shopee/Amazon
  ├── lib/products/
  │   ├── service.ts          — Business logic
  │   ├── shopee.ts           — Shopee API wrapper
  │   └── amazon.ts           — Amazon PA-API 5 wrapper
  └── lib/db/products.ts      — Prisma queries
  ```

#### AI Content Generator
- **Alur**: Pilih produk + platform + style → stream generate → preview → edit → simpan
- **Platform**: TikTok, Instagram, Facebook, X, YouTube
- **Type**: caption, script, hashtag, CTA, judul, FAQ, SEO
- **Template Style**: soft_selling, hard_selling, storytelling, review, problem_solution
- **File structure**:
  ```
  src/
  ├── app/(dashboard)/contents/
  │   ├── page.tsx            — Generator form
  │   └── [id]/page.tsx       — Edit hasil generate
  ├── app/api/contents/
  │   ├── route.ts            — CRUD content
  │   └── generate/route.ts   — AI generate (streaming)
  ├── lib/contents/
  │   ├── service.ts          — Business logic
  │   ├── generator.ts        — Registry + orchestrator
  │   ├── prompts.ts          — Prompt templates per platform
  │   └── providers/
  │       └── openai.ts       — OpenAI implementation
  └── lib/db/contents.ts      — Prisma queries
  ```

#### Content Library
- **Alur**: Browse all generated content → filter by product/platform/date → copy → re-generate
- **File structure**:
  ```
  src/
  ├── app/(dashboard)/library/
  │   └── page.tsx            — Grid/list view with filters
  └── app/api/library/
      └── route.ts            — List content with pagination + filter
  ```

#### Scheduler
- **Alur**: Pilih content + platform + waktu → simpan → cron worker cek tiap menit → update status
- **File structure**:
  ```
  src/
  ├── app/(dashboard)/schedules/
  │   ├── page.tsx            — Daftar jadwal
  │   └── new/page.tsx        — Buat jadwal baru
  ├── app/api/schedules/
  │   └── route.ts            — CRUD schedule
  └── lib/db/schedules.ts     — Prisma queries

  scheduler/                   — Worker terpisah
  ├── index.ts                — node-cron: * /1 * * * *
  ├── jobs/publish.ts         — Check + execute due schedules
  └── lib/
      ├── db.ts               — Prisma client
      └── publisher.ts        — Publish logic (placeholder)
  ```

---

## AI Agents

Specialized AI agents for different tasks. Invoke by name when you need specific expertise.

---

### reviewer

**Focus:** Code quality, SOLID compliance, TypeScript strictness, auth security

**Responsibilities:**
- Check SOLID principle violations (god objects, tight coupling, interface segregation)
- Verify TypeScript strict mode compliance
- Look for missing auth checks in API routes
- Check error handling patterns (try/catch in API routes, proper error types)
- Identify security issues (missing Zod validation, direct prisma calls in components)
- Review database transaction usage
- Ensure reusable component patterns are followed

**Rules:**
- Use `Platform.Tiktok`, NEVER `"tiktok"`
- Use `ContentType.Caption`, NEVER `"caption"`
- Use `TemplateStyle.SoftSelling`, NEVER `"soft_selling"`
- Every mutating API route must have session check + ownership validation
- No `any` type — use `unknown` and narrow
- No `console.log` in committed code
- Wrap API route logic in try/catch
- Direct prisma calls only in `src/lib/db/` files
- Components > 300 lines must be decomposed

**Tools:** Read-only access to all files

**Trigger phrases:**
- "review this code"
- "check this file"
- "audit SOLID compliance"
- "verify auth patterns"

---

### frontend

**Focus:** React components, UI, Tailwind, shadcn/ui, reusable components

**Responsibilities:**
- Build reusable feature components in `components/features/`
- Implement forms with Zod validation
- Style with Tailwind + shadcn/ui primitives
- Handle loading, empty, error states for every data view
- Implement streaming UI for AI content generation
- Use server components by default, client components only when needed

**Rules:**
- Default: server components (no `"use client"` unless needed)
- Add `"use client"` only for: useState, useEffect, browser APIs, event handlers
- Use `cn()` for conditional classes
- Named exports, typed props with `interface <Name>Props`
- Optional `className?: string` for composition
- Components in `components/features/` must be reusable (used by 2+ pages)
- Search existing components before writing new ones — don't re-invent
- Every data view must handle: loading skeleton, empty state, error state

**Tools:** Full access to `src/components/`, `src/app/` pages, `src/lib/utils.ts`

**Trigger phrases:**
- "build a component"
- "create a page"
- "fix UI"
- "add a form"
- "style this"

---

### backend

**Focus:** API routes, Prisma, AI integration, scheduler, business logic

**Responsibilities:**
- Build REST API endpoints following established patterns
- Design Prisma schemas and write query functions
- Implement AI content generation with streaming
- Integrate Shopee API and Amazon PA-API 5
- Implement scheduler worker logic
- Apply SOLID principles: registry pattern for generators, interface-based design

**Rules:**
- Auth check first: session validation + user ownership
- Use `src/lib/db/<entity>.ts` for Prisma calls (never in pages/components)
- Wrap mutations in `prisma.$transaction` when affecting multiple records
- Return shape: `{ data }` or `{ error }` or `{ success: true, data: ... }`
- Validate input server-side with Zod (never trust client)
- Use const objects for platforms, content types, template styles
- AI providers implement `AiProvider` interface — easily swappable
- New platform/content type = new entry in registry, no editing existing code (OCP)

**Tools:** Full access to `src/app/api/`, `src/lib/db/`, `src/lib/products/`, `src/lib/contents/`, `prisma/`, `scheduler/`

**Trigger phrases:**
- "create API endpoint"
- "fix database query"
- "implement AI generation"
- "add Shopee/Amazon integration"
- "design schema"
- "build scheduler worker"

---

### docs

**Focus:** Documentation, AGENTS.md, context files, inline comments

**Responsibilities:**
- Write and update AGENTS.md
- Update `.opencode/context/` when project structure changes
- Write inline comments (only "why", not "what")
- Document architecture decisions
- Update conventions when patterns evolve

**Rules:**
- Never modify logic code (read-only + markdown files only)
- Update `.opencode/context/` when project structure changes
- Follow existing documentation patterns
- Write clear, concise documentation
- Include code examples for complex concepts

**Tools:** Read-only + markdown files only (`*.md`)

**Trigger phrases:**
- "write documentation"
- "update AGENTS.md"
- "add comments"
- "update context files"

---

## Usage

When you need a specific agent, invoke by name:

```
@reviewer check SOLID compliance in this API route
@frontend build a product search result card component
@backend add AI content generation for YouTube platform
@docs update conventions.md with the new error handling pattern
```

The agent will use the context files in `.opencode/context/` as background knowledge and apply its specialized rules.
