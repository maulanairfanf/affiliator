"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

interface ProductData {
  id: string;
  title: string;
  price: number;
  currency: string;
  imageUrl: string | null;
  description: string | null;
  affiliateLink: string | null;
  sourceUrl: string | null;
}

interface ProductDetailActionsProps {
  product: ProductData;
}

export function ProductDetailActions({ product }: ProductDetailActionsProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(product.title);
  const [price, setPrice] = useState(String(product.price));
  const [currency, setCurrency] = useState(product.currency);
  const [imageUrl, setImageUrl] = useState(product.imageUrl ?? "");
  const [description, setDescription] = useState(product.description ?? "");
  const [affiliateLink, setAffiliateLink] = useState(product.affiliateLink ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSave() {
    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          price: parseFloat(price),
          currency,
          imageUrl: imageUrl || null,
          description: description || null,
          affiliateLink: affiliateLink || null,
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        setError(json.error || "Failed to save");
      } else {
        setSuccess(true);
        setIsEditing(false);
        router.refresh();
      }
    } catch {
      setError("Failed to save");
    } finally {
      setIsSaving(false);
    }
  }

  function handleCancel() {
    setTitle(product.title);
    setPrice(String(product.price));
    setCurrency(product.currency);
    setImageUrl(product.imageUrl ?? "");
    setDescription(product.description ?? "");
    setAffiliateLink(product.affiliateLink ?? "");
    setIsEditing(false);
    setError(null);
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this product?")) return;

    setIsDeleting(true);
    setError(null);

    try {
      const res = await fetch(`/api/products/${product.id}`, {
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

  if (isEditing) {
    return (
      <div className="space-y-4">
        <Card className="p-4">
          <h2 className="mb-4 text-lg font-semibold">Edit Product</h2>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="flex gap-3">
              <div className="flex-1 space-y-1">
                <Label>Price</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
              <div className="w-24 space-y-1">
                <Label>Currency</Label>
                <Input value={currency} onChange={(e) => setCurrency(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Image URL</Label>
              <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="flex min-h-24 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>
            <div className="space-y-1">
              <Label>Affiliate Link</Label>
              <Input
                value={affiliateLink}
                onChange={(e) => setAffiliateLink(e.target.value)}
              />
            </div>
          </div>
          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
          {success && <p className="mt-1 text-xs text-green-600">Changes saved</p>}
          <div className="mt-4 flex gap-2">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <Label>Affiliate Link</Label>
        <p className="mb-2 text-xs text-muted-foreground">
          Replace the product link with your own affiliate link.
        </p>
        <Input
          placeholder="https://..."
          value={affiliateLink}
          onChange={(e) => setAffiliateLink(e.target.value)}
        />
        <Button
          className="mt-2"
          size="sm"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : "Save Link"}
        </Button>
        {success && (
          <p className="mt-1 text-xs text-green-600">Affiliate link saved</p>
        )}
      </Card>

      {product.sourceUrl && (
        <Card className="p-4">
          <p className="text-sm font-medium">Source</p>
          <a
            href={product.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 block text-sm text-blue-600 hover:underline break-all"
          >
            {product.sourceUrl}
          </a>
        </Card>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2">
        <Button variant="secondary" onClick={() => setIsEditing(true)}>
          Edit Product
        </Button>
        <Button
          variant="destructive"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? "Deleting..." : "Delete Product"}
        </Button>
      </div>
    </div>
  );
}
