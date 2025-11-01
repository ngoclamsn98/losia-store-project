'use client';

import React, { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { ProductCard, VariantFilters, CategoryFilter } from "./page";
import { ColumnsIcon, EyeIcon, Grid2X2, LayoutGrid, Rows2Icon, ShoppingCartIcon, Square, X } from "lucide-react";
import { addToLocalCart } from '@/lib/cart/localStorage';
import { internalPost } from '@/lib/api/internal';

const ITEMS_PER_LOAD = 24;
const DEFAULT_SORT = "newest";

const fmtVND = (n?: string | number | null) => {
  if (!n) return '0VNĐ';

  const num =  typeof(n) === "string" ? Number(n) : n;
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + 'VNĐ';
}

function getDiscountPercent(p: ProductCard) {
  const oldPricd = Number(p.oldPrice);
  const price = Number(p.price);
  if (isNaN(oldPricd) || isNaN(price) || oldPricd <= price) return null;
  if (!oldPricd || oldPricd <= price) return null;
  const pct = Math.round(((oldPricd - price) / oldPricd) * 100);
  return pct > 0 ? pct : null;
}

interface ProductsClientProps {
  initialProducts: ProductCard[];
  variantFilters: VariantFilters;
  categories: CategoryFilter[];
  searchParams: { [key: string]: string | string[] | undefined };
}

export default function ProductsClient({ initialProducts, variantFilters, categories, searchParams }: ProductsClientProps) {
  const router = useRouter();

  // Parse search params
  const initialSort = (searchParams.sort as string) || DEFAULT_SORT;
  const initialView = (searchParams.view as "grid" | "list") || "grid";

  const [sortBy, setSortBy] = useState<string>(initialSort);
  const [viewMode, setViewMode] = useState<"grid" | "list">(initialView);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_LOAD);
  const [quickView, setQuickView] = useState<ProductCard | null>(null);

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Price range
  const minPrice = useMemo(() => {
    if (!initialProducts.length) return 0;
    return Math.min(...initialProducts.map((p) => p.price ?? 0));
  }, [initialProducts]);

  const maxPrice = useMemo(() => {
    if (!initialProducts.length) return 0;
    return Math.max(...initialProducts.map((p) => p.price ?? 0));
  }, [initialProducts]);

  const [priceMin, setPriceMin] = useState<number>(minPrice);
  const [priceMax, setPriceMax] = useState<number>(maxPrice);

  // Variant filters state
  // Format: { "color": ["Red", "Blue"], "size": ["M"] }
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string[]>>({});

  // Category filters state
  // Format: ["category-id-1", "category-id-2"]
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Toggle variant filter
  const toggleVariantFilter = (attributeName: string, value: string) => {
    setSelectedVariants(prev => {
      const current = prev[attributeName] || [];
      const newValues = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];

      if (newValues.length === 0) {
        const { [attributeName]: _, ...rest } = prev;
        return rest;
      }

      return { ...prev, [attributeName]: newValues };
    });
  };

  // Clear all variant filters
  const clearVariantFilters = () => {
    setSelectedVariants({});
  };

  // Toggle category filter
  const toggleCategoryFilter = (categoryId: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      }
      return [...prev, categoryId];
    });
  };

  // Clear all category filters
  const clearCategoryFilters = () => {
    setSelectedCategories([]);
  };

  // Filter & Sort
  const filteredSorted = useMemo(() => {
    let arr = [...initialProducts];

    // Category filter
    // Product must belong to at least one of the selected categories
    if (selectedCategories.length > 0) {
      arr = arr.filter((product) => {
        if (!product.categories || product.categories.length === 0) return false;

        // Check if product has at least one category matching selected categories
        return product.categories.some((category) =>
          selectedCategories.includes(category.id)
        );
      });
    }

    // Variant attributes filter
    // Product must have at least one variant matching ALL selected attribute filters
    if (Object.keys(selectedVariants).length > 0) {
      arr = arr.filter((product) => {
        if (!product.variants || product.variants.length === 0) return false;

        // Check if product has at least one variant matching all selected attributes
        return product.variants.some((variant) => {
          if (!variant.attributes || !variant.isActive) return false;

          // For each selected attribute (e.g., color, size)
          // Check if variant has one of the selected values
          return Object.entries(selectedVariants).every(([attrKey, selectedValues]) => {
            const variantValue = variant.attributes?.[attrKey];
            return variantValue && selectedValues.includes(variantValue);
          });
        });
      });
    }

    // Price filter
    arr = arr.filter((p) => p.price >= (priceMin || 0) && p.price <= (priceMax || Infinity));

    // Sort
    arr.sort((a, b) => {
      const aDisc = getDiscountPercent(a) ?? 0;
      const bDisc = getDiscountPercent(b) ?? 0;
      switch (sortBy) {
        case "price_asc":
          return a.price - b.price;
        case "price_desc":
          return b.price - a.price;
        case "discount_desc":
          return bDisc - aDisc;
        case "newest":
        default: {
          const at = new Date(a.createdAt || 0).getTime();
          const bt = new Date(b.createdAt || 0).getTime();
          return bt - at;
        }
      }
    });

    return arr;
  }, [initialProducts, selectedCategories, selectedVariants, priceMin, priceMax, sortBy]);

  const visible = filteredSorted.slice(0, visibleCount);

  // Update URL when filters change
  useEffect(() => {
    const sp = new URLSearchParams();
    if (sortBy && sortBy !== DEFAULT_SORT) sp.set("sort", sortBy);
    if (viewMode !== "grid") sp.set("view", viewMode);
    if (priceMin && priceMin > 0) sp.set("priceMin", String(priceMin));
    if (priceMax && maxPrice && priceMax < maxPrice) sp.set("priceMax", String(priceMax));

    const qs = sp.toString();
    router.replace(qs ? `/products?${qs}` : "/products", { scroll: false });
    setVisibleCount(ITEMS_PER_LOAD);
  }, [sortBy, viewMode, priceMin, priceMax, maxPrice, router]);

  // Infinite scroll
  useEffect(() => {
    if (!sentinelRef.current) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting) {
          setVisibleCount((v) => (v < filteredSorted.length ? v + ITEMS_PER_LOAD : v));
        }
      },
      { rootMargin: "1200px 0px 0px 0px" }
    );
    obs.observe(sentinelRef.current);
    return () => obs.disconnect();
  }, [filteredSorted.length]);

  const resetFilters = () => {
    setPriceMin(minPrice || 0);
    setPriceMax(maxPrice || 0);
    clearVariantFilters();
    clearCategoryFilters();
  };

  // Count active filters
  const activeFiltersCount =
    Object.values(selectedVariants).reduce((sum, arr) => sum + arr.length, 0) +
    selectedCategories.length;

  return (
    <div className="mx-auto max-w-[1600px] px-4 lg:px-6 py-6 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
      {/* Sidebar Filters */}
      <aside className="lg:sticky lg:top-20 h-fit border rounded-2xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">Bộ lọc</h2>
          <button
            onClick={resetFilters}
            className="text-sm underline text-gray-600 hover:text-gray-900"
          >
            Xoá tất cả {activeFiltersCount > 0 && `(${activeFiltersCount})`}
          </button>
        </div>

        {/* Giá */}
        <div className="mb-6">
          <h3 className="font-medium mb-3">Khoảng giá</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={priceMin}
                onChange={(e) => setPriceMin(Math.max(0, Number(e.target.value || 0)))}
                className="w-1/2 rounded-md border px-3 py-1.5"
                min={0}
              />
              <span className="text-gray-500">—</span>
              <input
                type="number"
                value={priceMax}
                onChange={(e) => setPriceMax(Math.max(priceMin, Number(e.target.value || 0)))}
                className="w-1/2 rounded-md border px-3 py-1.5"
                min={0}
              />
            </div>
            <div className="text-sm text-gray-500">
              {fmtVND(priceMin || 0)} — {fmtVND(priceMax || 0)}
            </div>
          </div>
        </div>

        {/* Category Filters */}
        {categories.length > 0 && (
          <div className="mb-6">
            <h3 className="font-medium mb-3">Danh mục</h3>
            <div className="space-y-2">
              {categories.map((category) => {
                const isSelected = selectedCategories.includes(category.id);
                return (
                  <label
                    key={category.id}
                    className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1.5 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleCategoryFilter(category.id)}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <span className="text-sm">{category.name}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Variant Filters */}
        {Object.entries(variantFilters.attributes).map(([attrKey, attrData]) => (
          <div key={attrKey} className="mb-6">
            <h3 className="font-medium mb-3 capitalize">{attrData.name}</h3>
            <div className="space-y-2">
              {attrData.values.map((value) => {
                const isSelected = selectedVariants[attrKey]?.includes(value) || false;
                return (
                  <label
                    key={value}
                    className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1.5 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleVariantFilter(attrKey, value)}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <span className="text-sm">{value}</span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}

        
      </aside>

      {/* Main */}
      <section>
        {/* Top controls */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <div className="text-sm text-gray-600">
            Tìm thấy {filteredSorted.length} sản phẩm
          </div>

          <div className="flex items-center gap-3">
            {/* Sort */}
            <label className="text-sm text-gray-600">Sắp xếp</label>
            <select
              className="rounded-md border px-3 py-2"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Mới nhất</option>
              <option value="price_asc">Giá tăng dần</option>
              <option value="price_desc">Giá giảm dần</option>
              <option value="discount_desc">Giảm giá nhiều</option>
            </select>

            {/* View toggle */}
            <div className="ml-2 inline-flex rounded-lg border">
              <button
                aria-label="Dạng lưới"
                onClick={() => setViewMode("grid")}
                className={`px-3 py-2 text-sm ${viewMode === "grid" ? "bg-gray-100" : ""}`}
              >
                <LayoutGrid />
              </button>
              <button
                aria-label="Dạng danh sách"
                onClick={() => setViewMode("list")}
                className={`px-3 py-2 text-sm border-l ${viewMode === "list" ? "bg-gray-100" : ""}`}
              >
                <Square />
              </button>
            </div>
          </div>
        </div>

        {/* Grid/List */}
        {visible.length === 0 ? (
          <div className="p-10 text-center text-gray-600 border rounded-2xl">
            Không có sản phẩm phù hợp. Thử điều chỉnh bộ lọc nhé.
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6">
            {visible.map((p, index) => (
              <ProductCardItem key={p.id} p={p} index={index} onQuickView={() => setQuickView(p)} />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {visible.map((p, index) => (
              <ProductListItem key={p.id} p={p} index={index} onQuickView={() => setQuickView(p)} />
            ))}
          </div>
        )}

        {/* Sentinel */}
        <div ref={sentinelRef} className="h-2" />

        {/* Load more button */}
        {visible.length < filteredSorted.length && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={() => setVisibleCount((v) => v + ITEMS_PER_LOAD)}
              className="px-5 py-2.5 rounded-xl border hover:bg-gray-50"
            >
              Tải thêm
            </button>
          </div>
        )}
      </section>

      {/* Quick View Modal */}
      {quickView && (
        <QuickViewModal product={quickView} onClose={() => setQuickView(null)} />
      )}
    </div>
  );
}

// Product Card Component
function ProductCardItem({
  p,
  index,
  onQuickView,
}: {
  p: ProductCard;
  index: number;
  onQuickView: () => void;
}) {
  const discount = getDiscountPercent(p);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isAddingToCart || p.stock <= 0) return;

    setIsAddingToCart(true);

    try {
      // 1. Lưu vào localStorage (luôn luôn - không cần đăng nhập)
      const cartItem = {
        variantId: p.id, // Sử dụng product ID làm variant ID nếu không có variant
        productId: p.id,
        productName: p.title,
        variantName: null,
        price: p.price,
        quantity: 1,
        imageUrl: p.thumbnailUrl,
      };

      addToLocalCart(cartItem);

      // 2. Call API /api/cart (giữ nguyên logic cũ)
      let apiSuccess = false;
      try {
        // Ưu tiên /api/cart/items
        await internalPost('/api/cart/items', { productId: p.id, qty: 1 });
        apiSuccess = true;
      } catch {
        // Fallback: /api/cart
        try {
          await internalPost('/api/cart', { productId: p.id, qty: 1 });
          apiSuccess = true;
        } catch {
          apiSuccess = false;
        }
      }

      if (!apiSuccess) {
        console.warn('API cart failed, but localStorage saved');
      }

      // 3. Dispatch events (giữ nguyên logic cũ để mở MiniCartDrawer)
      try {
        localStorage.setItem('losia:open-minicart', '1');
        window.dispatchEvent(new CustomEvent('losia:cart-changed'));
        window.dispatchEvent(new CustomEvent('losia:minicart:open'));
      } catch {}

      // 4. Track analytics (giữ nguyên)
      if (typeof window !== 'undefined') {
        (window as any).dataLayer?.push({
          event: 'add_to_cart',
          ecommerce: {
            items: [{
              item_id: p.id,
              item_name: p.title,
              price: p.price,
              quantity: 1,
            }],
          },
        });
      }
    } catch (error: any) {
      console.error('Add to cart error:', error);
    } finally {
      setIsAddingToCart(false);
    }
  };

  return (
    <div className="group relative rounded-2xl border hover:shadow-sm transition overflow-hidden">
      <Link href={`/product/${p.slug}`} className="block relative">
        <div className="relative w-full aspect-[4/5] rounded-lg overflow-hidden bg-gray-100">
          {p.thumbnailUrl ? (
            <Image
              src={p.thumbnailUrl}
              alt={p.title}
              fill
              className="object-cover transition duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              No Image
            </div>
          )}
        </div>

        {/* Badges */}
        {discount && (
          <span className="absolute right-2 top-2 text-xs px-2 py-1 rounded-full bg-rose-600 text-white">
            -{discount}%
          </span>
        )}
      </Link>

      <div className="p-3">
        <Link href={`/product/${p.slug}`} className="block text-sm" title={p.title}>
          <span className="font-semibold line-clamp-2">{p.title}</span>
        </Link>

        <div className="mt-1.5 flex items-baseline gap-2">
          <span className="text-[15px] font-bold">{fmtVND(p.price)}</span>
          {Number(p.oldPrice) && Number(p.oldPrice) > Number(p.price) && (
            <span className="text-xs text-gray-500 line-through">{fmtVND(p.oldPrice)}</span>
          )}
        </div>

        <div className="mt-1 text-xs text-gray-500">
          Còn {p.stock} • {p.views} lượt xem
        </div>

        {/* Nút hành động */}
        <div className="mt-3 flex items-center gap-2">
          <button
            aria-label="Xem nhanh"
            onClick={onQuickView}
            className="px-2 py-1.5 rounded-lg border hover:bg-gray-50"
            title="Xem nhanh"
          >
          <EyeIcon />
          </button>
          <button
            aria-label="Thêm vào giỏ"
            onClick={handleAddToCart}
            disabled={isAddingToCart || p.stock <= 0}
            className="ml-auto px-3 py-1.5 rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            title={p.stock <= 0 ? "Hết hàng" : "Thêm vào giỏ"}
          >
            {isAddingToCart ? (
              <span className="inline-block animate-spin">⏳</span>
            ) : (
              <ShoppingCartIcon />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Product List Item Component
function ProductListItem({
  p,
  index,
  onQuickView,
}: {
  p: ProductCard;
  index: number;
  onQuickView: () => void;
}) {
  const discount = getDiscountPercent(p);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isAddingToCart || p.stock <= 0) return;

    setIsAddingToCart(true);

    try {
      // 1. Lưu vào localStorage (luôn luôn - không cần đăng nhập)
      const cartItem = {
        variantId: p.id,
        productId: p.id,
        productName: p.title,
        variantName: null,
        price: p.price,
        quantity: 1,
        imageUrl: p.thumbnailUrl,
      };

      addToLocalCart(cartItem);

      // 2. Call API /api/cart
      let apiSuccess = false;
      try {
        await internalPost('/api/cart/items', { productId: p.id, qty: 1 });
        apiSuccess = true;
      } catch {
        try {
          await internalPost('/api/cart', { productId: p.id, qty: 1 });
          apiSuccess = true;
        } catch {
          apiSuccess = false;
        }
      }

      if (!apiSuccess) {
        console.warn('API cart failed, but localStorage saved');
      }

      // 3. Dispatch events
      try {
        localStorage.setItem('losia:open-minicart', '1');
        window.dispatchEvent(new CustomEvent('losia:cart-changed'));
        window.dispatchEvent(new CustomEvent('losia:minicart:open'));
      } catch {}

      // 4. Track analytics
      if (typeof window !== 'undefined') {
        (window as any).dataLayer?.push({
          event: 'add_to_cart',
          ecommerce: {
            items: [{
              item_id: p.id,
              item_name: p.title,
              price: p.price,
              quantity: 1,
            }],
          },
        });
      }
    } catch (error: any) {
      console.error('Add to cart error:', error);
    } finally {
      setIsAddingToCart(false);
    }
  };

  return (
    <div className="rounded-2xl border p-3 hover:shadow-sm transition">
      <div className="grid grid-cols-[120px_1fr] md:grid-cols-[180px_1fr_auto] gap-3 md:gap-6 items-center">
        <Link href={`/product/${p.slug}`} className="relative w-full aspect-[4/5] rounded-lg overflow-hidden bg-gray-100 block">
          {p.thumbnailUrl && (
            <Image src={p.thumbnailUrl} alt={p.title} fill className="object-cover" />
          )}
        </Link>

        <div className="min-w-0">
          <Link href={`/product/${p.slug}`} className="text-base md:text-lg font-semibold hover:underline line-clamp-2">
            {p.title}
          </Link>
          {p.description && <p className="mt-2 text-sm text-gray-700 line-clamp-2">{p.description}</p>}
          <div className="mt-2 flex items-center gap-2">
            <span className="text-lg font-bold">{fmtVND(p.price)}</span>
            {p.oldPrice && p.oldPrice > p.price && (
              <span className="text-sm text-gray-500 line-through">{fmtVND(p.oldPrice)}</span>
            )}
          </div>
          <div className="mt-1 text-xs text-gray-500">
            Còn {p.stock} • {p.views} lượt xem
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-2">
          <button
            aria-label="Xem nhanh"
            onClick={onQuickView}
            className="px-3 py-2 rounded-lg border hover:bg-gray-50 text-sm"
            title="Xem nhanh"
          >
            <EyeIcon className="w-4 h-4 mx-auto" />
          </button>
          <button
            aria-label="Thêm vào giỏ"
            onClick={handleAddToCart}
            disabled={isAddingToCart || p.stock <= 0}
            className="px-3 py-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            title={p.stock <= 0 ? "Hết hàng" : "Thêm vào giỏ"}
          >
            {isAddingToCart ? (
              <span className="inline-block animate-spin">⏳</span>
            ) : (
              <ShoppingCartIcon className="w-4 h-4 mx-auto" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Quick View Modal
function QuickViewModal({ product, onClose }: { product: ProductCard; onClose: () => void }) {
  const discount = getDiscountPercent(product);
  const price = Number(product.price);  
  const oldPrice = Number(product.oldPrice);
  
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div className="bg-white rounded-2xl max-w-3xl w-[92vw] p-4 md:p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg md:text-xl font-semibold">{product.title}</h3>
          <button aria-label="Đóng" className="p-2 rounded-lg hover:bg-gray-100" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div className="relative w-full aspect-[4/5] rounded-xl overflow-hidden bg-gray-100">
            {product.thumbnailUrl && (
              <Image src={product.thumbnailUrl} alt={product.title} fill className="object-cover" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-3">
              <span className="text-xl font-bold">{fmtVND(product.price)}</span>
              {oldPrice > price && (
                <>
                  <span className="text-gray-500 line-through">{fmtVND(product.oldPrice)}</span>
                  <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">
                    -{discount}%
                  </span>
                </>
              )}
            </div>
            <p className="mt-4 text-gray-700 text-sm leading-6">{product.description}</p>
            { product?.content &&  <p dangerouslySetInnerHTML={{ __html: product.content }}/>}
            <div className="mt-6 flex items-center gap-3">
              <Link href={`/product/${product.slug}`} className="px-4 py-2.5 rounded-xl bg-black text-white hover:opacity-90">
                Xem chi tiết
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

