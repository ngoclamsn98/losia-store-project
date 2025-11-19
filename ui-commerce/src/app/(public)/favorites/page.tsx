"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, ShoppingCart, Trash2 } from "lucide-react";
import { getLocalFavorites, removeFromFavorites } from "@/lib/favorites/localStorage";
import { getProductById } from "@/lib/api/products";
import type { Product } from "@/types/product";
import FavoriteButton from "@/components/product/FavoriteButton";
import { useCart } from "@/app/providers/CartProvider";

interface FavoriteProduct extends Product {
  addedAt: string;
}

export default function FavoritesPage() {
  const [products, setProducts] = useState<FavoriteProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCart();

  // Load favorites from localStorage and fetch product details
  useEffect(() => {
    async function loadFavorites() {
      setLoading(true);
      try {
        const favorites = getLocalFavorites();
        
        if (favorites.items.length === 0) {
          setProducts([]);
          setLoading(false);
          return;
        }

        // Fetch product details for each favorite
        const productPromises = favorites.items.map(async (item) => {
          try {
            const product = await getProductById(item.productId);
            return { ...product, addedAt: item.addedAt } as FavoriteProduct;
          } catch (error) {
            console.error(`Failed to fetch product ${item.productId}:`, error);
            return null;
          }
        });

        const fetchedProducts = await Promise.all(productPromises);
        const validProducts = fetchedProducts.filter((p): p is FavoriteProduct => p !== null);
        
        // Sort by addedAt (newest first)
        validProducts.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
        
        setProducts(validProducts);
      } catch (error) {
        console.error("Error loading favorites:", error);
      } finally {
        setLoading(false);
      }
    }

    loadFavorites();

    // Listen for favorites changes
    const handleFavoritesChanged = () => {
      loadFavorites();
    };

    window.addEventListener("losia:favorites-changed", handleFavoritesChanged);
    return () => {
      window.removeEventListener("losia:favorites-changed", handleFavoritesChanged);
    };
  }, []);

  const handleAddToCart = (product: FavoriteProduct) => {
    const defaultVariant = product.variants?.find((v) => v.isDefault) || product.variants?.[0];
    if (!defaultVariant) return;

    addItem({
      id: product.id,
      name: product.name,
      price: defaultVariant.price,
      quantity: 1,
      image: defaultVariant.imageUrl || product.thumbnailUrl || "",
      variant: defaultVariant.name || "Default",
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-600 border-r-transparent"></div>
              <p className="mt-4 text-gray-600">Đang tải sản phẩm yêu thích...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3">
            <Heart className="h-8 w-8 text-emerald-600 fill-emerald-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Sản phẩm yêu thích</h1>
              <p className="mt-1 text-sm text-gray-600">
                {products.length} sản phẩm
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {products.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Chưa có sản phẩm yêu thích
            </h2>
            <p className="text-gray-600 mb-6">
              Khám phá và thêm sản phẩm yêu thích của bạn
            </p>
            <Link
              href="/products"
              className="inline-block rounded-lg bg-emerald-600 px-6 py-3 font-semibold text-white hover:bg-emerald-700 transition-colors"
            >
              Khám phá sản phẩm
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {products.map((product) => {
              const defaultVariant = product.variants?.find((v) => v.isDefault) || product.variants?.[0];
              const price = defaultVariant?.price || 0;
              const compareAtPrice = defaultVariant?.compareAtPrice;
              const imageUrl = defaultVariant?.imageUrl || product.thumbnailUrl || "/placeholder.png";
              const discount = compareAtPrice
                ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
                : 0;

              return (
                <div
                  key={product.id}
                  className="group bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Image */}
                  <Link href={`/product/${product.slug}`} className="block relative">
                    <div className="relative aspect-[3/4] bg-gray-100">
                      <Image
                        src={imageUrl}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                      />

                      {/* Favorite Button */}
                      <div className="absolute right-2 top-2 z-10">
                        <FavoriteButton productId={product.id} className="h-8 w-8" iconSize={18} />
                      </div>

                      {/* Discount Badge */}
                      {discount > 0 && (
                        <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                          -{discount}%
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Info */}
                  <div className="p-4">
                    <Link href={`/product/${product.slug}`}>
                      <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-2 hover:text-emerald-600 transition-colors">
                        {product.name}
                      </h3>
                    </Link>

                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-sm font-bold text-gray-900">
                        {formatPrice(price)}
                      </span>
                      {compareAtPrice && (
                        <span className="text-xs text-gray-400 line-through">
                          {formatPrice(compareAtPrice)}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAddToCart(product)}
                        className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
                      >
                        <ShoppingCart className="h-4 w-4" />
                        Thêm vào giỏ
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

