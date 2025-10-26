'use client';

import React, { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { ProductCard } from "./page";

const ITEMS_PER_LOAD = 24;
const DEFAULT_SORT = "newest";

const ALL_CONDITIONS = [
  { key: "new_with_tags", label: "Mới (còn tag)" },
  { key: "excellent", label: "Như mới" },
  { key: "good", label: "Tốt" },
];

const fmtVND = (n: number) =>
  n.toLocaleString("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });

function getDiscountPercent(p: ProductCard) {
  if (!p.oldPrice || p.oldPrice <= p.price) return null;
  const pct = Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100);
  return pct > 0 ? pct : null;
}

interface ProductsClientProps {
  initialProducts: ProductCard[];
  searchParams: { [key: string]: string | string[] | undefined };
}

export default function ProductsClient({ initialProducts, searchParams }: ProductsClientProps) {
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

  // Filter & Sort
  const filteredSorted = useMemo(() => {
    let arr = [...initialProducts];

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
  }, [initialProducts, priceMin, priceMax, sortBy]);

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
  };

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
            Xoá tất cả
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
                ⬛⬛
              </button>
              <button
                aria-label="Dạng danh sách"
                onClick={() => setViewMode("list")}
                className={`px-3 py-2 text-sm border-l ${viewMode === "list" ? "bg-gray-100" : ""}`}
              >
                ▤
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
  const [isFavorite, setIsFavorite] = useState(false);

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
        {p.isFeatured && (
          <span className="absolute left-2 top-2 rounded-md bg-yellow-500 text-white text-xs font-semibold px-2 py-1">
            Featured
          </span>
        )}
        {discount && (
          <span className="absolute right-2 top-2 text-xs px-2 py-1 rounded-full bg-rose-600 text-white">
            -{discount}%
          </span>
        )}
      </Link>

      <div className="p-3">
        <Link href={`/product/${p.slug}`} className="block text-sm" title={p.title}>
          <span className="font-semibold line-clamp-2">{p.title}</span>
          {p.categoryName && <span className="text-gray-600"> • {p.categoryName}</span>}
        </Link>

        <div className="mt-1.5 flex items-baseline gap-2">
          <span className="text-[15px] font-bold">{fmtVND(p.price)}</span>
          {p.oldPrice && p.oldPrice > p.price && (
            <span className="text-xs text-gray-500 line-through">{fmtVND(p.oldPrice)}</span>
          )}
        </div>

        <div className="mt-1 text-xs text-gray-500">
          Còn {p.stock} • {p.views} lượt xem
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

  return (
    <div className="rounded-2xl border p-3 hover:shadow-sm transition">
      <div className="grid grid-cols-[120px_1fr] md:grid-cols-[180px_1fr] gap-3 md:gap-6 items-center">
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
        </div>
      </div>
    </div>
  );
}

// Quick View Modal
function QuickViewModal({ product, onClose }: { product: ProductCard; onClose: () => void }) {
  const discount = getDiscountPercent(product);

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
              {product.oldPrice && product.oldPrice > product.price && (
                <>
                  <span className="text-gray-500 line-through">{fmtVND(product.oldPrice)}</span>
                  <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">
                    -{discount}%
                  </span>
                </>
              )}
            </div>
            <p className="mt-4 text-gray-700 text-sm leading-6">{product.description || "—"}</p>

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

