import Link from "next/link";
import { auth } from "@/lib/auth";
import { listProducts } from "@/lib/db/products";
import { ProductCard } from "@/components/features/product-card";

export default async function ProductsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const products = await listProducts(session.user.id);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-muted-foreground">
            {products.length} product{products.length !== 1 ? "s" : ""} saved
          </p>
        </div>
        <Link
          href="/products/search"
          className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/80"
        >
          Search Product
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-lg font-medium">No products yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Search for products on Shopee or Amazon to get started.
          </p>
          <Link
            href="/products/search"
            className="mt-4 inline-flex h-8 items-center justify-center rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/80"
          >
            Search Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
