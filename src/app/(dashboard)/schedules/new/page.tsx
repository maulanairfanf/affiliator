"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Platform } from "@/lib/constants";
import type { Product } from "@/types/product";

const platforms = [
  { value: Platform.Threads, label: "Threads" },
];

export default function NewSchedulePage() {
  const router = useRouter();
  interface ItemOption { value: string; label: string; }
  const [products, setProducts] = useState<ItemOption[]>([]);
  const [contentOptions, setContentOptions] = useState<ItemOption[]>([]);
  const [productId, setProductId] = useState("");
  const [contentId, setContentId] = useState("");
  const [platform, setPlatform] = useState<Platform>(Platform.Threads);
  const [scheduledAt, setScheduledAt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    try {
      const res = await fetch("/api/products");
      const json = await res.json();
      if (json.data) setProducts(json.data.map((p: Product) => ({ value: p.id, label: p.title })));
    } catch {}
  }, []);

  const loadContents = useCallback(async () => {
    try {
      const res = await fetch("/api/contents");
      const json = await res.json();
      if (json.data) setContentOptions(json.data.map((c: { id: string; type: string; platform: string }) => ({ value: c.id, label: `${c.type} — ${c.platform}` })));
    } catch {}
  }, []);

  useState(() => {
    loadProducts();
    loadContents();
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!productId || !contentId || !scheduledAt) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, contentId, platform, scheduledAt }),
      });

      if (res.ok) {
        router.push("/schedules");
      } else {
        const json = await res.json();
        setError(json.error || "Failed to create schedule");
      }
    } catch {
      setError("Failed to create schedule");
    } finally {
      setIsLoading(false);
    }
  }

  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  const minDate = today.toISOString().slice(0, 16);

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-2xl font-bold">New Schedule</h1>

      <Card className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Product</Label>
            <Select items={products} value={productId} onValueChange={(v) => v && setProductId(v)}>
              <SelectTrigger className="w-full truncate">
                <SelectValue placeholder="Select product..." />
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
            <Label>Content</Label>
            <Select items={contentOptions} value={contentId} onValueChange={(v) => v && setContentId(v)}>
              <SelectTrigger className="w-full truncate">
                <SelectValue placeholder="Select content..." />
              </SelectTrigger>
              <SelectContent>
                {contentOptions.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Platform</Label>
            <Select items={platforms} value={platform} onValueChange={(v) => v && setPlatform(v as Platform)}>
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
            <Label>Schedule Date & Time</Label>
            <Input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              min={minDate}
              required
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Creating..." : "Create Schedule"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
