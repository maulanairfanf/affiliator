"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { ContentCard } from "@/components/features/content-card";
import type { Platform, ContentType, TemplateStyle } from "@/lib/constants";
import { Platform as PlatformConst, ContentType as ContentTypeConst, TemplateStyle as TemplateStyleConst } from "@/lib/constants";
import type { Product } from "@/types/product";

interface ProductOption {
  value: string;
  label: string;
}

const contentTypes = [
  { value: ContentTypeConst.ShortCaption, label: "Short Caption" },
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
  const [platform, setPlatform] = useState<Platform>(PlatformConst.Threads);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([ContentTypeConst.ShortCaption]);
  const [style, setStyle] = useState<TemplateStyle>(TemplateStyleConst.SoftSelling);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, string>>({});
  const [streamingTypes, setStreamingTypes] = useState<Set<string>>(new Set());
  const abortRef = useRef<AbortController | null>(null);

  const loadProducts = useCallback(async () => {
    try {
      const res = await fetch("/api/products");
      const json = await res.json();
      if (json.data) {
        setProducts(
          json.data.map((p: Product) => ({ value: p.id, label: p.title }))
        );
      }
    } catch {
      // silent — products will show empty
    }
  }, []);

  useState(() => {
    loadProducts();
  });

  async function handleGenerate() {
    if (!productId || selectedTypes.length === 0) return;

    setIsGenerating(true);
    setError(null);
    setResults({});
    setStreamingTypes(new Set(selectedTypes));

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
          const newResults: Record<string, string> = {};

          for (const type of selectedTypes) {
            const val = parsed[type];
            if (val !== undefined && val !== null) {
              newResults[type] = Array.isArray(val) ? val.join("\n\n") : String(val);
            }
          }

          setResults(newResults);

          const doneTypes = new Set(Object.keys(newResults));
          setStreamingTypes((prev) => {
            const next = new Set(prev);
            doneTypes.forEach((t) => next.delete(t));
            return next;
          });
        } catch {
          // incomplete JSON, wait for more chunks
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        setError("Generation failed. Please try again.");
      }
    } finally {
      setIsGenerating(false);
      setStreamingTypes(new Set());
      abortRef.current = null;
    }
  }

  function handleStop() {
    abortRef.current?.abort();
    setIsGenerating(false);
    setStreamingTypes(new Set());
  }

  function toggleType(value: string) {
    setSelectedTypes((prev) =>
      prev.includes(value)
        ? prev.filter((t) => t !== value)
        : [...prev, value]
    );
  }

  async function handleSave(type: string) {
    if (!results[type]) return;

    try {
      const res = await fetch("/api/contents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          platform,
          type,
          content: results[type],
        }),
      });

      if (res.ok) {
        router.push("/library");
      }
    } catch {
      setError("Failed to save content");
    }
  }

  async function handleSaveAll() {
    const entries = Object.entries(results);
    if (entries.length === 0) return;

    try {
      for (const [type, content] of entries) {
        await fetch("/api/contents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId, platform, type, content }),
        });
      }
      router.push("/library");
    } catch {
      setError("Failed to save content");
    }
  }

  const hasResults = Object.keys(results).length > 0;

  return (
    <div className="max-w-3xl">
      <h1 className="mb-6 text-2xl font-bold">Content Generator</h1>

      <Card className="mb-6 p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Product</Label>
            <Select items={products} value={productId} onValueChange={(v) => v && setProductId(v)}>
              <SelectTrigger>
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
            <Select items={platforms} value={platform} onValueChange={(v) => v && setPlatform(v as Platform)}>
              <SelectTrigger>
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

          <div className="space-y-2">
            <Label>Template Style</Label>
            <Select
              items={styles}
              value={style}
              onValueChange={(v) => v && setStyle(v as TemplateStyle)}
            >
              <SelectTrigger>
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
        </div>

        <div className="mt-4 flex gap-2">
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

      {isGenerating && !hasResults && (
        <div className="space-y-3">
          {selectedTypes.map((type) => (
            <div key={type}>
              <Skeleton className="mb-1 h-5 w-20" />
              <Skeleton className="h-24 w-full" />
            </div>
          ))}
        </div>
      )}

      {hasResults && (
        <div className="space-y-3">
          {Object.entries(results).map(([type, content]) => (
            <ContentCard
              key={type}
              type={type}
              content={content}
              isStreaming={streamingTypes.has(type)}
              onSave={() => handleSave(type)}
            />
          ))}

          <div className="flex gap-2 pt-2">
            <Button onClick={handleSaveAll}>
              Save All to Library
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
