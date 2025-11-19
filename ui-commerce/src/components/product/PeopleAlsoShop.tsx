"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { getProductsGroupedByBrand, type BrandGroup } from "@/lib/api/products";

type Props = {
  currentBrand?: string | null;
  limitBrands?: number;     // mặc định 3
  limitPerBrand?: number;   // mặc định 3
};



export default function PeopleAlsoShop({
  currentBrand,
  limitBrands = 3,
  limitPerBrand = 3,
}: Props) {
  const [groups, setGroups] = useState<BrandGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Use the API helper function
        const data = await getProductsGroupedByBrand(
          currentBrand || undefined,
          limitBrands,
          limitPerBrand
        );

        if (!mounted) return;
        setGroups(Array.isArray(data) ? data : []);
      } catch (e: any) {
        if (mounted) setError(e?.message || "Something went wrong");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [currentBrand, limitBrands, limitPerBrand]);

  if (loading) {
    return (
      <section className="mt-8 md:mt-12">
        <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-4 px-4 sm:px-0">
          Mọi Người Mua {currentBrand || "this brand"} cũng Mua
        </h3>
        <div className="flex gap-3 sm:gap-4 md:gap-6 overflow-x-auto no-scrollbar pb-2 px-4 sm:px-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:overflow-visible">
          {Array.from({ length: limitBrands }).map((_, i) => (
            <SkeletonBrandBlock key={i} count={limitPerBrand} />
          ))}
        </div>
      </section>
    );
  }
  if (error || groups.length === 0) return null;

  return (
    <section className="mt-8 md:mt-12">
      <div className="mb-4 flex items-center justify-between px-4 sm:px-0">
        <h2 className="text-base sm:text-lg md:text-xl font-semibold tracking-tight">
          Mọi Người Mua {currentBrand || "this brand"} Cũng Mua
        </h2>
      </div>

      {/* Mobile: scroll ngang; Tablet: 2 cột; Desktop: 3 cột */}
      <div className="flex gap-3 sm:gap-4 md:gap-6 lg:gap-8 overflow-x-auto no-scrollbar pb-2 px-4 sm:px-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:overflow-visible md:pb-0">
        {groups.map((group) => (
          <div key={group.brand} className="min-w-[320px] sm:min-w-[360px] md:min-w-0 flex-shrink-0">
            {/* 3 ảnh: grid layout tự động chia đều */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4 mb-3 md:mb-4">
              {group.products.map((p) => (
                <Link
                  key={p.id}
                  href={`/product/${p.slug || p.id}`}
                  className="block"
                  aria-label={p.title}
                >
                  <div
                    className="relative rounded-[4px] ring-1 ring-gray-200 bg-white overflow-hidden hover:ring-emerald-500 transition-all w-full"
                    style={{ aspectRatio: "3 / 4" }}
                  >
                    <Image
                      src={p.image || "/assets/images/main/product1.jpg"}
                      alt={p.title}
                      fill
                      sizes="(max-width:640px) 33vw, (max-width:768px) 25vw, (max-width:1024px) 20vw, 160px"
                      className="object-cover"
                    />
                  </div>
                </Link>
              ))}
            </div>

            {/* Nút brand responsive */}
            <Link
              href={`/c/${slugify(group.brand)}?brand_name_tags=${encodeURIComponent(group.brand)}`}
              className="
                block mx-auto
                h-9 sm:h-10 w-full
                rounded-md border border-black
                bg-white text-black
                text-[11px] sm:text-[12px] font-semibold uppercase tracking-[0.12em] sm:tracking-[0.15em]
                text-center leading-9 sm:leading-10
                hover:bg-gray-50 transition-colors
              "
            >
              {group.brand}
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

/* ---------- Skeleton: responsive ---------- */
function SkeletonBrandBlock({ count = 3 }: { count?: number }) {
  return (
    <div className="min-w-[320px] sm:min-w-[360px] md:min-w-0 flex-shrink-0">
      <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4 mb-3 md:mb-4">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="rounded-[4px] ring-1 ring-gray-200 bg-white animate-pulse w-full"
            style={{ aspectRatio: "3 / 4" }}
          >
            <div className="w-full h-full bg-gray-100" />
          </div>
        ))}
      </div>
      <div className="h-9 sm:h-10 w-full rounded-md border border-black bg-gray-100 animate-pulse" />
    </div>
  );
}
