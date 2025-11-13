'use client';

import { useProducts } from '@/lib/api';
import type { ProductFilters } from '@/types/product';
import Link from 'next/link';
import Image from 'next/image';
import { formatPrice } from '@/utils';

interface ProductListProps {
  filters?: ProductFilters;
}

export default function ProductList({ filters }: ProductListProps) {
  const { products, loading, error, total, page, totalPages, refetch } = useProducts(filters);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4 text-gray-600">Đang tải sản phẩm...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 mb-4">Lỗi: {error}</p>
          <button
            onClick={refetch}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-600">Không tìm thấy sản phẩm nào.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          Sản phẩm ({total})
        </h2>
        <div className="text-sm text-gray-600">
          Trang {page} / {totalPages}
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => {
          const defaultVariant = product.variants.find(v => v.isDefault) || product.variants[0];
          const price = defaultVariant?.price || 0;
          const stock = defaultVariant?.stock || 0;

          return (
            <Link
              key={product.id}
              href={`/product/${product.slug}`}
              className="group block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
            >
              {/* Image */}
              <div className="relative aspect-square bg-gray-100">
                {product.thumbnailUrl ? (
                  <Image
                    src={product.thumbnailUrl}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    No Image
                  </div>
                )}
                
                {/* Featured Badge */}
                {product.isFeatured && (
                  <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded">
                    Featured
                  </div>
                )}

                {/* Stock Badge */}
                {stock === 0 && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                    Hết hàng
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                {/* Category */}
                {product.categories && product.categories.length > 0 && (
                  <p className="text-xs text-gray-500 mb-1">
                    {product.categories[0].name}
                  </p>
                )}

                {/* Name */}
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                  {product.name}
                </h3>

                {/* Description */}
                {product.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {product.description}
                  </p>
                )}

                {/* Price */}
                <div className="flex items-center justify-between">
                  <p className="text-lg font-bold text-gray-900">
                    {formatPrice(price)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {stock > 0 ? `Còn ${stock}` : 'Hết hàng'}
                  </p>
                </div>

                {/* Views */}
                <div className="mt-2 text-xs text-gray-400">
                  {product.views} lượt xem
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
            <button
              key={pageNum}
              onClick={() => {
                // Handle pagination - you can update filters here
                console.log('Go to page:', pageNum);
              }}
              className={`px-4 py-2 rounded ${
                pageNum === page
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {pageNum}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

