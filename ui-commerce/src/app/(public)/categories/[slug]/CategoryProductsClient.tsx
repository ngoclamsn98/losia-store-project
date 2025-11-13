"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { ProductsResponse } from "@/types/product";
import { ChevronLeft, ChevronRight } from "lucide-react";
import FavoriteButton from "@/components/product/FavoriteButton";
import { formatPrice } from "@/utils";

interface CategoryProductsClientProps {
  slug: string;
  categoryName: string;
  initialData: ProductsResponse;
  currentPage: number;
}

export default function CategoryProductsClient({
  slug,
  categoryName,
  initialData,
  currentPage,
}: CategoryProductsClientProps) {
  const router = useRouter();
  const { data: products, meta } = initialData;

  const handlePageChange = (newPage: number) => {
    router.push(`/categories/${slug}?page=${newPage}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900">{categoryName}</h1>
          <p className="mt-2 text-sm text-gray-600">
            {meta.total} sản phẩm
          </p>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Không có sản phẩm nào trong danh mục này.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {products.map((product) => {
                const defaultVariant = product.variants?.find((v) => v.isDefault) || product.variants?.[0];
                const price = defaultVariant?.price || 0;
                const compareAtPrice = defaultVariant?.compareAtPrice;
                const imageUrl = defaultVariant?.imageUrl || product.thumbnailUrl || "/placeholder.png";
                const discount = compareAtPrice
                  ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
                  : 0;

                return (
                  <Link
                    key={product.id}
                    href={`/product/${product.slug}`}
                    className="group block bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                  >
                    {/* Image */}
                    <div className="relative aspect-[3/4] bg-gray-100">
                      <Image
                        src={imageUrl}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      />
                      {/* Favorite Button */}
                      <div className="absolute right-2 top-2 z-10">
                        <FavoriteButton productId={product.id} className="h-8 w-8" iconSize={18} />
                      </div>
                      {discount > 0 && (
                        <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                          -{discount}%
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-2">
                        {product.name}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-gray-900">
                          {formatPrice(price)}
                        </span>
                        {compareAtPrice && (
                          <span className="text-sm text-gray-400 line-through">
                            {formatPrice(compareAtPrice)}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Pagination */}
            {meta.totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={!meta.hasPreviousPage}
                  className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Trước
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((pageNum) => {
                    // Show first page, last page, current page, and pages around current
                    const showPage =
                      pageNum === 1 ||
                      pageNum === meta.totalPages ||
                      (pageNum >= currentPage - 1 && pageNum <= currentPage + 1);

                    if (!showPage) {
                      // Show ellipsis
                      if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                        return (
                          <span key={pageNum} className="px-2 text-gray-400">
                            ...
                          </span>
                        );
                      }
                      return null;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-4 py-2 text-sm font-medium rounded-md ${
                          pageNum === currentPage
                            ? "bg-emerald-600 text-white"
                            : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!meta.hasNextPage}
                  className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sau
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Page info */}
            <div className="mt-4 text-center text-sm text-gray-600">
              Trang {currentPage} / {meta.totalPages} - Hiển thị {products.length} / {meta.total} sản phẩm
            </div>
          </>
        )}
      </div>
    </div>
  );
}

