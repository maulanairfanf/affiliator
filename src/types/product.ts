import type { ProductSource } from "@/lib/constants";

export interface Product {
  id: string;
  userId: string;
  title: string;
  price: number;
  currency: string;
  imageUrl: string | null;
  videoUrl: string | null;
  description: string | null;
  source: ProductSource;
  sourceUrl: string | null;
  affiliateLink: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductSearchResult {
  title: string;
  price: number;
  currency: string;
  imageUrl: string | null;
  videoUrl: string | null;
  description: string | null;
  sourceUrl: string;
  source: ProductSource;
}

export interface ProductFilter {
  source?: ProductSource;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
}

export interface ProductFormData {
  title: string;
  price: number;
  currency: string;
  imageUrl?: string;
  videoUrl?: string;
  description?: string;
  source: ProductSource;
  sourceUrl?: string;
  affiliateLink?: string;
}
