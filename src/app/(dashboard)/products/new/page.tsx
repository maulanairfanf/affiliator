"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function NewProductPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [description, setDescription] = useState("");
  const [affiliateLink, setAffiliateLink] = useState("");
  const [scrapeUrl, setScrapeUrl] = useState("");
  const [isScraping, setIsScraping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleScrape() {
    if (!scrapeUrl.trim()) return;

    setIsScraping(true);
    setError(null);

    try {
      const res = await fetch("/api/products/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: scrapeUrl.trim() }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Failed to scrape URL");
        return;
      }

      const product = json.data;
      setTitle(product.title || "");
      setImageUrl(product.imageUrl || "");
      setDescription(product.description || "");
      if (json.affiliateUrl) {
        setAffiliateLink(json.affiliateUrl);
      }
    } catch {
      setError("Failed to scrape URL. Try filling manually.");
    } finally {
      setIsScraping(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          imageUrl: imageUrl || undefined,
          description: description || undefined,
          affiliateLink: affiliateLink || undefined,
          source: "manual",
        }),
      });

      if (res.ok) {
        router.push("/products");
      } else {
        const json = await res.json();
        setError(json.error || "Failed to create product");
      }
    } catch {
      setError("Failed to create product");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-2xl font-bold">Add Product</h1>

      <Card className="mb-4 p-4">
        <div className="space-y-2">
          <Label>Product Link</Label>
          <div className="flex gap-2">
            <Input
              value={scrapeUrl}
              onChange={(e) => setScrapeUrl(e.target.value)}
              placeholder="https://shopee.co.id/... or https://amazon.com/..."
              onKeyDown={(e) => e.key === "Enter" && handleScrape()}
              className="flex-1"
            />
            <Button
              type="button"
              variant="secondary"
              onClick={handleScrape}
              disabled={isScraping || !scrapeUrl.trim()}
              className="shrink-0"
            >
              {isScraping ? "Scraping..." : "Scrape"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Paste a product link to auto-fill the form below.
          </p>
        </div>
      </Card>

      <Card className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Product Title *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nama produk"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Image URL</Label>
            <Input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Deskripsi produk..."
              className="flex min-h-24 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30"
            />
          </div>

          <div className="space-y-2">
            <Label>Affiliate Link</Label>
            <Input
              value={affiliateLink}
              onChange={(e) => setAffiliateLink(e.target.value)}
              placeholder="https://shope.ee/..."
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Saving..." : "Save Product"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
