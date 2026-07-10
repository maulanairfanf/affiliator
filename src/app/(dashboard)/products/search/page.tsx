"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductSearchCard } from "@/components/features/product-search-card";
import { ProductSource } from "@/lib/constants";
import type { ProductSearchResult, ProductFormData } from "@/types/product";

const productSources = [
  { value: ProductSource.Shopee, label: "Shopee" },
  { value: ProductSource.Amazon, label: "Amazon" },
  { value: ProductSource.Manual, label: "Paste Link" },
];

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [source, setSource] = useState<string>(ProductSource.Shopee);
  const [results, setResults] = useState<ProductSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setError(null);
    setHasSearched(true);

    try {
      const res = await fetch(
        `/api/products/search?q=${encodeURIComponent(query)}&source=${source}`
      );
      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Search failed");
        setResults([]);
      } else {
        setResults(json.data);
      }
    } catch {
      setError("Failed to search. Please try again.");
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }

  async function handleSave(result: ProductSearchResult) {
    setSavingId(result.sourceUrl);

    const payload: ProductFormData = {
      title: result.title,
      price: result.price,
      currency: result.currency,
      imageUrl: result.imageUrl ?? undefined,
      description: result.description ?? undefined,
      source: result.source,
      sourceUrl: result.sourceUrl,
    };

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        router.push("/products");
      }
    } finally {
      setSavingId(null);
    }
  }

  const isManual = source === ProductSource.Manual;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Search Products</h1>

      <form onSubmit={handleSearch} className="mb-8 flex gap-3">
        <Select items={productSources} value={source} onValueChange={(value) => value && setSource(value)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {productSources.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          placeholder={
            isManual
              ? "Paste Shopee or Amazon URL..."
              : "Search products..."
          }
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1"
        />

        <Button type="submit" disabled={isSearching || !query.trim()}>
          {isSearching ? "Searching..." : "Search"}
        </Button>
      </form>

      {error && (
        <div className="mb-6 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {isSearching ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="aspect-square rounded-lg" />
              <Skeleton className="mt-2 h-4 w-3/4" />
              <Skeleton className="mt-1 h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : hasSearched && results.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-lg font-medium">No results found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Try a different search term or source.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {results.map((result) => (
            <ProductSearchCard
              key={result.sourceUrl}
              result={result}
              onSave={handleSave}
              isSaving={savingId === result.sourceUrl}
            />
          ))}
        </div>
      )}
    </div>
  );
}
