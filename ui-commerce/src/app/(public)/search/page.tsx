import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { searchProducts } from "@/lib/api/products";
import { formatVND } from "@/lib/format";
import { notFound } from "next/navigation";
import FavoriteButton from "@/components/product/FavoriteButton";

const PAGE_SIZE = 24;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: { q?: string };
}): Promise<Metadata> {
  const query = searchParams.q || "";
  return {
    title: query ? `Tìm kiếm: ${query} | LOSIA` : "Tìm kiếm | LOSIA",
    robots: { index: false, follow: true },
    alternates: { canonical: "/search" },
  };
}

type PageProps = {
  searchParams: { q?: string; page?: string };
};

export default async function SearchPage({ searchParams }: PageProps) {
  const query = searchParams.q || "";
  const page = searchParams.page ? parseInt(searchParams.page, 10) : 1;

  if (!query || query.trim().length === 0) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="mb-4 text-2xl font-semibold">Tìm kiếm sản phẩm</h1>
        <p className="text-gray-600">Vui lòng nhập từ khóa để tìm kiếm.</p>
      </main>
    );
  }

  let searchResults;
  try {
    searchResults = await searchProducts(query, {
      page,
      limit: PAGE_SIZE,
      status: "ACTIVE",
    });
  } catch (error) {
    console.error("Failed to search products:", error);
    notFound();
  }

  const { data: products, meta } = searchResults;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">
          Kết quả tìm kiếm cho &quot;{query}&quot;
        </h1>
        <p className="mt-2 text-gray-600">
          Tìm thấy {meta.total} sản phẩm
        </p>
      </div>

      {products.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-lg text-gray-600">
            Không tìm thấy sản phẩm nào phù hợp với &quot;{query}&quot;
          </p>
          <Link
            href="/products"
            className="mt-4 inline-block text-emerald-600 hover:text-emerald-700"
          >
            Xem tất cả sản phẩm →
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => {
              const defaultVariant = product.variants.find((v) => v.isDefault) || product.variants[0];
              const price = defaultVariant?.price || 0;
              const compareAtPrice = defaultVariant?.compareAtPrice;
              const imageUrl = defaultVariant?.imageUrl || product.thumbnailUrl || "/placeholder.png";
              const discount = compareAtPrice && compareAtPrice > price
                ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
                : 0;

              return (
                <div key={product.id} className="group">
                  <Link href={`/product/${product.slug}`} className="block">
                    <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-gray-100">
                      <Image
                        src={imageUrl}
                        alt={product.name}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className="object-cover transition-transform duration-200 group-hover:scale-105"
                      />

                      {/* Favorite Button */}
                      <div className="absolute right-2 top-2 z-10">
                        <FavoriteButton productId={product.id} className="h-8 w-8" iconSize={18} />
                      </div>

                      {/* Discount Badge */}
                      {discount > 0 && (
                        <span className="absolute left-2 top-2 rounded-md bg-rose-600 px-2 py-1 text-xs font-semibold text-white">
                          -{discount}%
                        </span>
                      )}
                    </div>

                    <div className="mt-2">
                      <h3 className="line-clamp-2 text-sm font-medium text-gray-900">
                        {product.name}
                      </h3>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">
                          {formatVND(price)}
                        </span>
                        {compareAtPrice && compareAtPrice > price && (
                          <span className="text-xs text-gray-400 line-through">
                            {formatVND(compareAtPrice)}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>

          {meta.totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              {meta.hasPreviousPage && (
                <Link
                  href={`/search?q=${encodeURIComponent(query)}&page=${page - 1}`}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  ← Trang trước
                </Link>
              )}

              <span className="px-4 py-2 text-sm text-gray-700">
                Trang {page} / {meta.totalPages}
              </span>

              {meta.hasNextPage && (
                <Link
                  href={`/search?q=${encodeURIComponent(query)}&page=${page + 1}`}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Trang sau →
                </Link>
              )}
            </div>
          )}
        </>
      )}
    </main>
  );
}
