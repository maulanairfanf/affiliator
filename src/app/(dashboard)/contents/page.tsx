"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import type { Platform, TemplateStyle } from "@/lib/constants";
import {
  Platform as PlatformConst,
  ContentType as ContentTypeConst,
  TemplateStyle as TemplateStyleConst,
} from "@/lib/constants";
import { api } from "@/lib/api";
import type { Product } from "@/types/product";

interface ProductOption {
  value: string;
  label: string;
  affiliateLink?: string;
}

interface ProductsResponse {
  data: Product[];
}

const contentTypes = [
  { value: ContentTypeConst.LongCaption, label: "Long Caption" },
  { value: ContentTypeConst.Hook, label: "Hooks (20x)" },
  { value: ContentTypeConst.Cta, label: "CTA (10x)" },
  { value: ContentTypeConst.Hashtag, label: "Hashtags" },
  { value: ContentTypeConst.ProductSummary, label: "Product Summary" },
];

const platforms = [
  { value: PlatformConst.Threads, label: "Threads" },
];

const styles = [
  { value: TemplateStyleConst.SoftSelling, label: "Soft Selling" },
  { value: TemplateStyleConst.HardSelling, label: "Hard Selling" },
  { value: TemplateStyleConst.Storytelling, label: "Storytelling" },
  { value: TemplateStyleConst.Review, label: "Review" },
  { value: TemplateStyleConst.ProblemSolution, label: "Problem Solution" },
];

export default function ContentsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [productId, setProductId] = useState("");
  const [affiliateLink, setAffiliateLink] = useState("");
  const [platform, setPlatform] = useState<Platform>(PlatformConst.Threads);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([ContentTypeConst.LongCaption]);
  const [style, setStyle] = useState<TemplateStyle>(TemplateStyleConst.SoftSelling);
  const [contentTitle, setContentTitle] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    api<ProductsResponse>("/products")
      .then((json) => {
        setProducts(
          json.data.map((p: Product) => ({
            value: p.id,
            label: p.title,
            affiliateLink: p.affiliateLink || undefined,
          }))
        );
      })
      .catch(() => {});
  }, []);

  function handleProductSelect(value: string | null) {
    if (!value) return;
    setProductId(value);
    const product = products.find((p) => p.value === value);
    setAffiliateLink(product?.affiliateLink || "");
  }

  function toggleType(value: string) {
    setSelectedTypes((prev) =>
      prev.includes(value)
        ? prev.filter((t) => t !== value)
        : [...prev, value]
    );
  }

  async function handleGenerate() {
    if (!productId || selectedTypes.length === 0) return;

    setIsGenerating(true);
    setError(null);
    setContent("");

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/contents/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          platform,
          types: selectedTypes,
          style,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const json = await res.json();
        setError(json.error || "Generation failed");
        setIsGenerating(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        try {
          const parsed = JSON.parse(buffer);
          const val = parsed.content || parsed.long_caption;
          if (val) {
            setContent(String(val));
          }
        } catch {
          // incomplete JSON, wait for more
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        setError("Generation failed. Please try again.");
      }
    }

    setIsGenerating(false);
    abortRef.current = null;
  }

  function handleStop() {
    abortRef.current?.abort();
    setIsGenerating(false);
  }

  async function handleSave() {
    if (!content) return;
    try {
      const res = await fetch("/api/contents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          platform,
          type: selectedTypes[0] || "long_caption",
          content,
          title: contentTitle || undefined,
        }),
      });
      if (res.ok) {
        router.push("/library");
      } else {
        const json = await res.json();
        setError(json.error || "Failed to save");
      }
    } catch {
      setError("Failed to save content");
    }
  }

  async function handlePostNow() {
    if (!content) return;
    try {
      const contentRes = await fetch("/api/contents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          platform,
          type: selectedTypes[0] || "long_caption",
          content,
          title: contentTitle || undefined,
        }),
      });
      if (!contentRes.ok) {
        const json = await contentRes.json();
        setError(json.error || "Failed to save");
        return;
      }

      const contentId = (await contentRes.json()).data.id;

      const scheduleRes = await fetch("/api/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform,
          contentId,
          productId,
          scheduledAt: new Date().toISOString(),
        }),
      });

      if (!scheduleRes.ok) {
        const json = await scheduleRes.json();
        setError(json.error || "Failed to schedule");
        return;
      }

      router.push("/schedules");
    } catch {
      setError("Failed to post now");
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="mb-6 text-2xl font-bold">Content Generator</h1>

      <Card className="mb-6 p-4">
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label>Product</Label>
            <Select
              items={products}
              value={productId}
              onValueChange={handleProductSelect}
            >
              <SelectTrigger className="w-full truncate">
                <SelectValue placeholder="Select a product..." />
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Platform</Label>
            <Select
              items={platforms}
              value={platform}
              onValueChange={(v) => v && setPlatform(v as Platform)}
            >
              <SelectTrigger className="w-full truncate">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {platforms.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Template Style</Label>
            <Select
              items={styles}
              value={style}
              onValueChange={(v) => v && setStyle(v as TemplateStyle)}
            >
              <SelectTrigger className="w-full truncate">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {styles.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Content Types</Label>
            <div className="flex flex-wrap gap-3">
              {contentTypes.map((ct) => (
                <label
                  key={ct.value}
                  className="flex items-center gap-1.5 text-sm"
                >
                  <Checkbox
                    checked={selectedTypes.includes(ct.value)}
                    onCheckedChange={() => toggleType(ct.value)}
                  />
                  {ct.label}
                </label>
              ))}
            </div>
          </div>

       
        </div>

        {productId && (
          <div className="mt-4 space-y-2">
            <Label>Affiliate Link</Label>
            <Input
              value={affiliateLink}
              onChange={(e) => setAffiliateLink(e.target.value)}
              placeholder="https://shope.ee/..."
            />
            {!affiliateLink && (
              <p className="text-xs text-muted-foreground">
                No affiliate link set for this product.{" "}
                <a
                  href={`/products/${productId}`}
                  className="text-primary hover:underline"
                >
                  Add one
                </a>
              </p>
            )}
          </div>
        )}

        {productId && (
          <div className="mt-4 space-y-2">
            <Label>Content Title</Label>
            <Input
              value={contentTitle}
              onChange={(e) => setContentTitle(e.target.value)}
              placeholder="e.g. Post promosi Jumat"
            />
          </div>
        )}

        <div className="mt-4 flex">
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !productId || selectedTypes.length === 0}
          >
            {isGenerating ? "Generating..." : "Generate"}
          </Button>
          {isGenerating && (
            <Button variant="outline" onClick={handleStop}>
              Stop
            </Button>
          )}
        </div>

        {error && (
          <p className="mt-2 text-sm text-destructive">{error}</p>
        )}
      </Card>

      {(content || isGenerating) && (
        <Card className="p-4">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-sm font-medium">Generated Content</span>
            {isGenerating && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                Generating...
              </span>
            )}
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full resize-y rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            rows={12}
            disabled={isGenerating}
          />
          {!isGenerating && content && (
            <div className="mt-2 flex gap-2">
              <Button onClick={handleSave} variant="outline">
                Save to Library
              </Button>
              <Button onClick={handlePostNow}>
                Post Now
              </Button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
