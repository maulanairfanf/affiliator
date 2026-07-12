import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Product {
  id: string;
  title: string;
  price: number;
  currency: string;
  imageUrl: string | null;
  source: string;
  affiliateLink: string | null;
}

interface ProductCardProps {
  product: Product;
  onDelete?: (id: string) => void;
  className?: string;
}

function formatPrice(price: number, currency: string) {
  if (currency === "IDR") {
    return `Rp ${price.toLocaleString("id-ID")}`;
  }
  return `$${price.toFixed(2)}`;
}

export function ProductCard({ product, onDelete, className }: ProductCardProps) {
  return (
    <div className={cn("relative group", className)}>
      <Link href={`/products/${product.id}`}>
        <Card className="overflow-hidden transition-colors hover:bg-muted/50">
          <div className="aspect-square bg-muted">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.title}
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
              {product.source}
            </Badge>
            <h3 className="line-clamp-2 text-sm font-medium">{product.title}</h3>
            {product.price > 0 && (
              <p className="mt-1 text-sm font-semibold">
                {formatPrice(product.price, product.currency)}
              </p>
            )}
          </div>
        </Card>
      </Link>
      {onDelete && (
        <Button
          size="xs"
          variant="destructive"
          onClick={(e) => {
            e.preventDefault();
            if (confirm("Delete this product?")) onDelete(product.id);
          }}
          className="absolute right-2 top-2 bg-background/80 hover:bg-background"
        >
          ✕
        </Button>
      )}
    </div>
  );
}
