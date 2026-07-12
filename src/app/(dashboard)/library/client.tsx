"use client";

import { useState, useEffect, startTransition } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Platform } from "@/lib/constants";

interface ContentItem {
  id: string;
  platform: string;
  type: string;
  content: string;
  title: string | null;
  productId: string | null;
  createdAt: Date | string;
  product: {
    id: string;
    title: string;
    imageUrl: string | null;
    sourceUrl: string | null;
    affiliateLink: string | null;
  } | null;
}

interface FetchResult {
  data: ContentItem[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

const typeLabels: Record<string, string> = {
  long_caption: "Long Caption",
  hook: "Hooks",
  cta: "Call to Action",
  hashtag: "Hashtags",
  product_summary: "Product Summary",
  riddle: "Riddle",
};

const platformOptions = [
  { value: "all", label: "All Platforms" },
  { value: Platform.Threads, label: "Threads" },
];

export function LibraryClient() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editTitle, setEditTitle] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  function fetchItems(pageNum: number, append: boolean) {
    startTransition(() => setIsLoading(true));
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (platformFilter !== "all") params.set("platform", platformFilter);
    params.set("page", String(pageNum));
    params.set("pageSize", "20");

    fetch(`/api/contents?${params}`)
      .then((res) => res.json())
      .then((result: FetchResult) => {
        startTransition(() => {
          setItems((prev) => (append ? [...prev, ...result.data] : result.data));
          setTotal(result.total);
          setPage(result.page);
          setHasMore(result.hasMore);
        });
      })
      .catch(() => {})
      .finally(() => startTransition(() => setIsLoading(false)));
  }

  useEffect(() => {
    fetchItems(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, platformFilter]);

  function handleLoadMore() {
    fetchItems(page + 1, true);
  }

  async function handlePostNow(item: ContentItem) {
    try {
      await fetch("/api/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: item.platform,  
          contentId: item.id,
          productId: item.productId || undefined,
          scheduledAt: new Date().toISOString(),
        }),
      });
    } catch {
      // silent
    }
  }

  async function handleCopy(item: ContentItem) {
    const link = item.product?.affiliateLink || item.product?.sourceUrl;
    const text = link ? `${item.content}\n\n🔗 ${link}` : item.content;
    await navigator.clipboard.writeText(text);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function handleStartEdit(item: ContentItem) {
    setEditingId(item.id);
    setEditContent(item.content);
    setEditTitle(item.title || "");
  }

  function handleCancelEdit() {
    setEditingId(null);
    setEditContent("");
    setEditTitle("");
  }

  async function handleSaveEdit(id: string) {
    try {
      await fetch("/api/contents", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, content: editContent, title: editTitle || null }),
      });
      setItems((prev) =>
        prev.map((i) =>
          i.id === id
            ? { ...i, content: editContent, title: editTitle || null }
            : i
        )
      );
      setEditingId(null);
      setEditContent("");
      setEditTitle("");
    } catch {
      // silent
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this content?")) return;
    await fetch(`/api/contents`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setItems((prev) => prev.filter((i) => i.id !== id));
    setTotal((prev) => prev - 1);
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Content Library</h1>
          <p className="text-muted-foreground">{total} item{total !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Search content..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-48"
          />
          <Select
            items={platformOptions}
            value={platformFilter}
            onValueChange={(v) => v && setPlatformFilter(v)}
          >
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {platformOptions.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading && items.length === 0 ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-4">
              <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
              <div className="mt-2 h-12 w-full animate-pulse rounded bg-muted" />
            </Card>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-lg font-medium">No content yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Generate content from the Content Generator page.
          </p>
          <a
            href="/contents"
            className="mt-4 inline-flex h-8 items-center justify-center rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/80"
          >
            Generate Content
          </a>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {items.map((item) => {
              const productLink =
                item.product?.affiliateLink || item.product?.sourceUrl;

              return (
                <Card key={item.id} className="p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
                    {item.product?.imageUrl && (
                      <a
                        href={productLink || "#"}
                        target={productLink ? "_blank" : undefined}
                        rel="noopener noreferrer"
                        className="shrink-0"
                        >
                          <img
                          src={item.product.imageUrl}
                          alt={item.product.title}
                          className="h-16 w-16 rounded-lg border object-cover"
                        />
                      </a>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        {item.product && (
                          <a
                            href={productLink || "#"}
                            target={productLink ? "_blank" : undefined}
                            rel="noopener noreferrer"
                            className="truncate text-xs font-medium text-muted-foreground hover:text-foreground"
                          >
                            {item.product.title}
                          </a>
                        )}
                        <br/>
                        <Badge variant="secondary">
                          {typeLabels[item.type] || item.type}
                        </Badge>
                        <Badge>{item.platform}</Badge>
                
                      </div>
                      {editingId === item.id ? (
                        <div className="space-y-2">
                          <input
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            placeholder="Content title..."
                            className="w-full rounded-lg border border-input bg-transparent px-3 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                          />
                          <textarea
                            value={editContent}
                            onChange={(e) => {
                              setEditContent(e.target.value);
                              e.target.style.height = "auto";
                              e.target.style.height = e.target.scrollHeight + "px";
                            }}
                            className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-none overflow-hidden"
                            rows={3}
                          />
                        </div>
                      ) : (
                        <div>
                          {item.title && (
                            <p className="text-sm font-semibold">{item.title}</p>
                          )}
                          <p className="whitespace-pre-wrap text-sm">{item.content}</p>
                        </div>
                      )}
                      {productLink && (
                        <p className="mt-1.5 truncate text-xs text-blue-600 dark:text-blue-400">
                          🔗 {productLink}
                        </p>
                      )}
                      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs text-muted-foreground">
                          {new Date(item.createdAt).toLocaleDateString(
                            "id-ID",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </p>
                        <div className="flex gap-1">
                          {editingId === item.id ? (
                            <>
                              <Button
                                size="xs"
                                onClick={() => handleSaveEdit(item.id)}
                              >
                                Save
                              </Button>
                              <Button
                                size="xs"
                                variant="outline"
                                onClick={handleCancelEdit}
                              >
                                Cancel
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="xs"
                                onClick={() => handlePostNow(item)}
                              >
                                Post Now
                              </Button>
                              <Button
                                size="xs"
                                variant="outline"
                                onClick={() => handleCopy(item)}
                              >
                                {copiedId === item.id ? "Copied!" : "Copy"}
                              </Button>
                              <Button
                                size="xs"
                                variant="outline"
                                onClick={() => handleStartEdit(item)}
                              >
                                Edit
                              </Button>
                              <Button
                                size="xs"
                                variant="outline"
                                onClick={() => handleDelete(item.id)}
                              >
                                Delete
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {hasMore && (
            <div className="mt-6 text-center">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={isLoading}
              >
                {isLoading ? "Loading..." : `Load More (${total - items.length} remaining)`}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
