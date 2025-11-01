// src/components/product/RelatedProducts.tsx
import React from 'react';
import Link from 'next/link';
import SmartImage from '@/components/media/SmartImage';
import { normalizeImageUrl, pickDemoImageUrl } from '@/lib/images';

// ===== Types =====
type ProductVariant = {
  id: string;
  name?: string | null;
  sku?: string | null;
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

type Creator = {
  id: string;
  email: string;
  firstName?: string | null;
};

type RelatedProduct = {
  id: string;
  name: string;
  slug: string;
  thumbnailUrl?: string | null;
  imageUrls?: string[] | null;
  status: string;
  isFeatured: boolean;
  variants: ProductVariant[];
  categories?: Category[];
  createdBy?: Creator | null;
};

// ===== Helper Functions =====
const formatVND = (n?: string | null) => {
  if (!n) return '0VNĐ';

  const num = parseInt(n);
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + 'VNĐ';
}

const percentOff = (price?: number | null, oldPrice?: number | null) => {
  if (price == null || oldPrice == null || oldPrice <= price) return null;
  const pct = Math.round(((oldPrice - price) / oldPrice) * 100);
  return pct > 0 ? pct : null;
};

function firstImageSrc(p: RelatedProduct, index?: number) {
  const normalizeUrl = (u?: string | null) => (u && u.trim() ? normalizeImageUrl(u) : undefined);

  const cover = normalizeUrl(p.thumbnailUrl ?? undefined);
  if (cover) return cover;

  const arr = p.imageUrls ?? [];
  if (!arr.length) return pickDemoImageUrl({ id: p.id, sku: p.id, index });

  const first = arr[0];
  return normalizeUrl(first) ?? pickDemoImageUrl({ id: p.id, sku: p.id, index });
}

const BLUR_DATA_URL =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNlZWVlZWUiIC8+PC9zdmc+';

// ===== Fetch Related Products (Server-side) =====
async function fetchRelatedProducts(productId: string, limit: number = 8): Promise<RelatedProduct[]> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const url = `${apiUrl}/products/${productId}/related?limit=${limit}`;

    const res = await fetch(url, {
      next: {
        revalidate: process.env.NODE_ENV === 'production' ? 300 : 0,
        tags: ['related-products', `related-${productId}`],
      },
    });

    if (!res.ok) {
      console.error(`Failed to fetch related products: ${res.status}`);
      return [];
    }

    return res.json();
  } catch (error) {
    console.error('Error fetching related products:', error);
    return [];
  }
}

// ===== Product Card Component =====
function ProductCard({ product, index }: { product: RelatedProduct; index: number }) {
  const defaultVariant = product.variants?.find((v) => v.isDefault) || product.variants?.[0];
  const price = defaultVariant?.price || 0;
  const oldPrice = defaultVariant?.compareAtPrice || null;
  const discount = percentOff(price, oldPrice);
  const imgUrl = firstImageSrc(product, index);
  const category = product.categories?.[0];
  const seller = product.createdBy;

  return (
    <div className="group snap-start shrink-0 w-full">
      <div className="relative rounded-2xl border hover:shadow-md transition overflow-hidden">
        {/* Image */}
        <Link href={`/product/${product.slug}`} className="block relative z-0">
          <SmartImage
            kind="product"
            alt={product.name || 'product image'}
            preset="plp"
            src={imgUrl}
            className="relative w-full aspect-[4/5] rounded-lg overflow-hidden bg-gray-100"
            imgClassName="object-cover transition duration-300 group-hover:scale-105"
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
          />

          {/* Discount Badge */}
          {discount && (
            <span className="absolute left-2 top-2 rounded-md bg-red-600 text-white text-xs font-semibold px-2 py-1 leading-none shadow-sm">
              -{discount}%
            </span>
          )}

          {/* Featured Badge */}
          {product.isFeatured && (
            <span className="absolute right-2 top-2 rounded-md bg-emerald-600 text-white text-xs font-semibold px-2 py-1 leading-none shadow-sm">
              HOT
            </span>
          )}
        </Link>

        {/* Info */}
        <div className="p-3 space-y-1">
          {/* Product Name */}
          <Link href={`/product/${product.slug}`} className="block">
            <h3 className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-emerald-600 transition">
              {product.name}
            </h3>
          </Link>

          {/* Category */}
          {category && (
            <p className="text-xs text-gray-500">
              {category.name}
            </p>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-2">
            <span className="text-base font-bold text-gray-900">{formatVND(price?.toString())}</span>
            {oldPrice && oldPrice > price && (
              <span className="text-sm text-gray-400 line-through">{formatVND(oldPrice?.toString())}</span>
            )}
          </div>

          {/* Stock */}
          {defaultVariant && defaultVariant.stock <= 5 && defaultVariant.stock > 0 && (
            <p className="text-xs text-orange-600 font-medium">
              Chỉ còn {defaultVariant.stock} sản phẩm
            </p>
          )}
          {defaultVariant && defaultVariant.stock === 0 && (
            <p className="text-xs text-red-600 font-medium">Hết hàng</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ===== Main Component (Server Component) =====
export default async function RelatedProducts({
  productId,
  limit = 8,
}: {
  productId: string;
  limit?: number;
}) {
  const products = await fetchRelatedProducts(productId, limit);

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="w-full py-8 bg-gray-50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">
            Sản phẩm khác từ người bán
          </h2>
          <Link
            href="/products"
            className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
          >
            Xem tất cả →
          </Link>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4">
          {products.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

