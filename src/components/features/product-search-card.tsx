"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { ProductSearchResult } from "@/types/product";

type SearchResult = ProductSearchResult;

interface ProductSearchCardProps {
  result: SearchResult;
  onSave: (result: SearchResult) => void;
  isSaving?: boolean;
  className?: string;
}

function formatPrice(price: number, currency: string) {
  if (currency === "IDR") {
    return `Rp ${price.toLocaleString("id-ID")}`;
  }
  return `$${price.toFixed(2)}`;
}

export function ProductSearchCard({
  result,
  onSave,
  isSaving,
  className,
}: ProductSearchCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <div className="aspect-square bg-muted">
        {result.imageUrl ? (
          <img
            src={result.imageUrl}
            alt={result.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            No Image
          </div>
        )}
      </div>
      <div className="p-3">
        <Badge variant="secondary" className="mb-1">
          {result.source}
        </Badge>
        <h3 className="line-clamp-2 text-sm font-medium">{result.title}</h3>
        {result.description && (
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
            {result.description}
          </p>
        )}
        <p className="mt-1 text-sm font-semibold">
          {formatPrice(result.price, result.currency)}
        </p>
        <Button
          className="mt-2 w-full"
          size="sm"
          onClick={() => onSave(result)}
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : "Save Product"}
        </Button>
      </div>
    </Card>
  );
}
