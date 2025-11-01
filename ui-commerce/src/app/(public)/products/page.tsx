import React, { Suspense } from "react";
import { Metadata } from "next";
import ProductsClient from "./ProductsClient";

// ===== Types từ Backend API =====
export type ProductVariant = {
  id: string;
  name?: string | null;
  sku?: string | null;
  attributes?: Record<string, string> | null;
  price: number;
  compareAtPrice?: number | null;
  stock: number;
  isDefault: boolean;
  isActive: boolean;
};

type Category = {
  id: string;
  name: string;
  slug: string;
};

type ProductFromAPI = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  thumbnailUrl?: string | null;
  imageUrls?: string[] | null;
  status: string;
  isFeatured: boolean;
  views: number;
  variants: ProductVariant[];
  categories?: Category[];
  createdAt: string;
  updatedAt: string;
  content?: string | null;
};

// Type cho UI component
export type ProductCard = {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  price: number;
  oldPrice?: number | null;
  stock: number;
  status?: string | null;
  createdAt?: string | Date | null;
  images?: string[] | null;
  thumbnailUrl?: string | null;
  categoryName?: string | null;
  isFeatured?: boolean;
  views?: number;
  content?: string | null;
  variants?: ProductVariant[]; // Add variants for filtering
  categories?: Category[]; // Add categories for filtering
};

// SEO Metadata
export const metadata: Metadata = {
  title: "Sản phẩm - LOSIA Store",
  description: "Khám phá kho đồ secondhand cho bạn & bé. Secondhand First — Like-new, tiết kiệm đến 90% so với giá ước tính retail.",
  openGraph: {
    title: "Sản phẩm - LOSIA Store",
    description: "Khám phá kho đồ secondhand cho bạn & bé",
  },
};

// Type for variant filters
export type VariantFilter = {
  name: string;
  values: string[];
  count: number;
};

export type VariantFilters = {
  attributes: Record<string, VariantFilter>;
};

// Type for category filters
export type CategoryFilter = {
  id: string;
  name: string;
  slug: string;
  productCount?: number;
};

/**
 * Fetch products từ Backend API
 * Server-side function cho SEO
 */
async function fetchProducts(): Promise<ProductCard[]> {
  try {
    // Sử dụng Backend API URL
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const url = `${apiUrl}/products?limit=200&status=ACTIVE`;

    const res = await fetch(url, {
      // Revalidate mỗi 60 giây trong production
      next: {
        revalidate: process.env.NODE_ENV === 'production' ? 60 : 0,
        tags: ['products']
      },
    });

    if (!res.ok) {
      console.error(`Failed to fetch products: ${res.status}`);
      return [];
    }

    const data = await res.json();

    // Backend trả về { data: [], meta: {} }
    const products: ProductFromAPI[] = data.data || [];

    // Map từ Backend API format sang UI format
    return products.map((p) => mapProductToCard(p));
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

/**
 * Fetch variant filters từ Backend API
 */
async function fetchVariantFilters(): Promise<VariantFilters> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const url = `${apiUrl}/products/filters/variants?status=ACTIVE`;

    const res = await fetch(url, {
      next: {
        revalidate: process.env.NODE_ENV === 'production' ? 60 : 0,
        tags: ['products']
      },
    });

    if (!res.ok) {
      console.error(`Failed to fetch variant filters: ${res.status}`);
      return { attributes: {} };
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error('Error fetching variant filters:', error);
    return { attributes: {} };
  }
}

/**
 * Fetch categories từ Backend API
 * Server-side function
 */
async function fetchCategories(): Promise<CategoryFilter[]> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const url = `${apiUrl}/categories?isActive=true&limit=100`;

    const res = await fetch(url, {
      next: {
        revalidate: process.env.NODE_ENV === 'production' ? 60 : 0,
        tags: ['categories']
      },
    });

    if (!res.ok) {
      console.error(`Failed to fetch categories: ${res.status}`);
      return [];
    }

    const data = await res.json();

    // Map categories to CategoryFilter format
    const categories: CategoryFilter[] = (data.data || []).map((cat: any) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      productCount: 0, // Will be calculated on client side
    }));

    return categories;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

/**
 * Map product từ Backend API format sang UI format
 */
function mapProductToCard(p: ProductFromAPI): ProductCard {
  // Lấy variant mặc định hoặc variant đầu tiên
  const defaultVariant = p.variants?.find(v => v.isDefault) || p.variants?.[0];

  return {
    id: p.id,
    slug: p.slug,
    title: p.name,
    description: p.description,
    price: defaultVariant?.price || 0,
    oldPrice: defaultVariant?.compareAtPrice || null,
    stock: defaultVariant?.stock || 0,
    status: p.status,
    createdAt: p.createdAt,
    images: p.imageUrls || [],
    thumbnailUrl: p.thumbnailUrl,
    categoryName: p.categories?.[0]?.name || null,
    isFeatured: p.isFeatured,
    views: p.views,
    content: p.content,
    variants: p.variants || [], // Include all variants for filtering
    categories: p.categories || [], // Include all categories for filtering
  };
}

/**
 * Server Component - Products Page
 * SSR cho SEO tốt hơn
 */
export default async function ProductsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  // Fetch products, variant filters, and categories on server
  const [products, variantFilters, categories] = await Promise.all([
    fetchProducts(),
    fetchVariantFilters(),
    fetchCategories(),
  ]);

  return (
    <div className="bg-white min-h-screen">
      {/* Hero / Intro */}
      <section className="border-b">
        <div className="mx-auto max-w-[1600px] px-4 lg:px-6 py-6 lg:py-8">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Khám phá kho đồ secondhand cho bạn & bé
          </h1>
          <p className="mt-2 text-gray-600">
            Secondhand First — Like-new, tiết kiệm đến 90% so với giá ước tính retail.
          </p>
        </div>
      </section>

      {/* Client Component để handle filters, sorting, etc */}
      <Suspense fallback={<ProductsLoadingSkeleton />}>
        <ProductsClient
          initialProducts={products}
          variantFilters={variantFilters}
          categories={categories}
          searchParams={searchParams}
        />
      </Suspense>
    </div>
  );
}

/**
 * Loading skeleton
 */
function ProductsLoadingSkeleton() {
  return (
    <div className="mx-auto max-w-[1600px] px-4 lg:px-6 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {/* Sidebar skeleton */}
        <aside className="border rounded-2xl p-4 h-fit">
          <div className="h-6 bg-gray-200 rounded w-24 mb-4 animate-pulse" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-4 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        </aside>

        {/* Grid skeleton */}
        <div>
          <div className="h-10 bg-gray-100 rounded mb-4 animate-pulse" />
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="rounded-2xl border overflow-hidden animate-pulse">
                <div className="w-full aspect-[4/5] bg-gray-100" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-3/4" />
                  <div className="h-4 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

