import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getProduct } from "@/lib/db/products";
import { Badge } from "@/components/ui/badge";
import { ProductDetailActions } from "./actions";

interface ProductDetailPageProps {
  params: Promise<{ id: string }>;
}

function formatPrice(price: number, currency: string) {
  if (currency === "IDR") {
    return `Rp ${price.toLocaleString("id-ID")}`;
  }
  return `$${price.toFixed(2)}`;
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const session = await auth();
  if (!session?.user) return null;

  const { id } = await params;
  const product = await getProduct(id);

  if (!product || product.userId !== session.user.id) {
    notFound();
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
        <div className="aspect-square w-full max-w-48 shrink-0 overflow-hidden rounded-lg bg-muted">
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

        <div className="flex-1">
          <Badge variant="secondary" className="mb-2">
            {product.source}
          </Badge>
          <h1 className="text-xl font-bold">{product.title}</h1>
          <p className="mt-2 text-2xl font-semibold">
            {formatPrice(product.price, product.currency)}
          </p>
          {product.description && (
            <p className="mt-2 text-sm text-muted-foreground">{product.description}</p>
          )}
        </div>
      </div>

      <ProductDetailActions
        productId={product.id}
        affiliateLink={product.affiliateLink}
        sourceUrl={product.sourceUrl}
      />
    </div>
  );
}
