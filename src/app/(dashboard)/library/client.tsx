"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  createdAt: Date | string;
  product: {
    title: string;
    imageUrl: string | null;
    sourceUrl: string | null;
    affiliateLink: string | null;
  } | null;
}

interface LibraryClientProps {
  contents: ContentItem[];
}

const typeLabels: Record<string, string> = {
  short_caption: "Short Caption",
  long_caption: "Long Caption",
  hook: "Hooks",
  cta: "Call to Action",
  hashtag: "Hashtags",
  product_summary: "Product Summary",
};

const platformOptions = [
  { value: "all", label: "All Platforms" },
  { value: Platform.Threads, label: "Threads" },
];

export function LibraryClient({ contents }: LibraryClientProps) {
  const router = useRouter();
  const [filter, setFilter] = useState("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered =
    filter === "all"
      ? contents
      : contents.filter((c) => c.platform === filter);

  async function handleCopy(item: ContentItem) {
    const link = item.product?.affiliateLink || item.product?.sourceUrl;
    const text = link ? `${item.content}\n\n🔗 ${link}` : item.content;
    await navigator.clipboard.writeText(text);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this content?")) return;
    await fetch(`/api/contents`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    router.refresh();
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Content Library</h1>
          <p className="text-muted-foreground">
            {filtered.length} item{filtered.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Select items={platformOptions} value={filter} onValueChange={(v) => v && setFilter(v)}>
          <SelectTrigger className="w-40">
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

      {filtered.length === 0 ? (
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
        <div className="space-y-3">
          {filtered.map((item) => {
            const productLink = item.product?.affiliateLink || item.product?.sourceUrl;

            return (
              <Card key={item.id} className="p-4">
                <div className="flex items-start gap-4">
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
                    <div className="mb-2 flex items-center gap-2">
                      <Badge variant="secondary">{typeLabels[item.type] || item.type}</Badge>
                      <Badge>{item.platform}</Badge>
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
                    </div>
                    <p className="whitespace-pre-wrap text-sm">{item.content}</p>
                    {productLink && (
                      <p className="mt-1.5 truncate text-xs text-blue-600 dark:text-blue-400">
                        🔗 {productLink}
                      </p>
                    )}
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        {new Date(item.createdAt).toLocaleDateString("id-ID", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      <div className="flex gap-1">
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
                          onClick={() => handleDelete(item.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
