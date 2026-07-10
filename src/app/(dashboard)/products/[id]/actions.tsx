"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

interface ProductDetailActionsProps {
  productId: string;
  affiliateLink: string | null;
  sourceUrl: string | null;
}

export function ProductDetailActions({
  productId,
  affiliateLink,
  sourceUrl,
}: ProductDetailActionsProps) {
  const router = useRouter();
  const [link, setLink] = useState(affiliateLink ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSaveLink() {
    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ affiliateLink: link || null }),
      });

      if (!res.ok) {
        const json = await res.json();
        setError(json.error || "Failed to save");
      } else {
        setSuccess(true);
      }
    } catch {
      setError("Failed to save affiliate link");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this product?")) return;

    setIsDeleting(true);
    setError(null);

    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const json = await res.json();
        setError(json.error || "Failed to delete");
      } else {
        router.push("/products");
      }
    } catch {
      setError("Failed to delete product");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <Label htmlFor="affiliate-link">Affiliate Link</Label>
        <p className="mb-2 text-xs text-muted-foreground">
          Replace the product link with your own affiliate link.
        </p>
        <Input
          id="affiliate-link"
          placeholder="https://..."
          value={link}
          onChange={(e) => setLink(e.target.value)}
        />
        <Button
          className="mt-2"
          size="sm"
          onClick={handleSaveLink}
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : "Save Link"}
        </Button>
        {success && (
          <p className="mt-1 text-xs text-green-600">Affiliate link saved</p>
        )}
      </Card>

      {sourceUrl && (
        <Card className="p-4">
          <p className="text-sm font-medium">Source</p>
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 block text-sm text-blue-600 hover:underline"
          >
            {sourceUrl}
          </a>
        </Card>
      )}

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <Button
        variant="destructive"
        size="sm"
        onClick={handleDelete}
        disabled={isDeleting}
      >
        {isDeleting ? "Deleting..." : "Delete Product"}
      </Button>
    </div>
  );
}
