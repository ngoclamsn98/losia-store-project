"use client";

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { usePathname } from "next/navigation";

export type BreadcrumbItem = {
  label: string;
  href: string;
};

type BreadcrumbsProps = {
  items?: BreadcrumbItem[];
  className?: string;
};

export default function Breadcrumbs({ items, className = "" }: BreadcrumbsProps) {
  const pathname = usePathname();

  // Auto-generate breadcrumbs from pathname if items not provided
  const breadcrumbItems = items || generateBreadcrumbsFromPath(pathname);

  if (breadcrumbItems.length === 0) return null;

  // Generate JSON-LD for breadcrumbs
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Trang chủ",
        item: process.env.NEXT_PUBLIC_SITE_URL || "https://losia.vn",
      },
      ...breadcrumbItems.map((item, index) => ({
        "@type": "ListItem",
        position: index + 2,
        name: item.label,
        item: `${process.env.NEXT_PUBLIC_SITE_URL || "https://losia.vn"}${item.href}`,
      })),
    ],
  };

  return (
    <>
      {/* JSON-LD for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* Visual Breadcrumbs */}
      <nav
        aria-label="Breadcrumb"
        className={`flex items-center gap-2 text-sm text-gray-600 ${className}`}
      >
        <Link
          href="/"
          className="flex items-center gap-1 hover:text-emerald-600 transition-colors"
          aria-label="Trang chủ"
        >
          <Home size={16} />
          <span className="hidden sm:inline">Trang chủ</span>
        </Link>

        {breadcrumbItems.map((item, index) => {
          const isLast = index === breadcrumbItems.length - 1;

          return (
            <div key={item.href} className="flex items-center gap-2">
              <ChevronRight size={16} className="text-gray-400" />
              {isLast ? (
                <span className="font-medium text-gray-900" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="hover:text-emerald-600 transition-colors"
                >
                  {item.label}
                </Link>
              )}
            </div>
          );
        })}
      </nav>
    </>
  );
}

// Helper function to generate breadcrumbs from pathname
function generateBreadcrumbsFromPath(pathname: string): BreadcrumbItem[] {
  if (pathname === "/") return [];

  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [];

  let currentPath = "";
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    currentPath += `/${segment}`;

    // Skip dynamic segments like [slug]
    if (segment.startsWith("[") && segment.endsWith("]")) continue;

    // Generate label from segment
    const label = formatSegmentLabel(segment);

    breadcrumbs.push({
      label,
      href: currentPath,
    });
  }

  return breadcrumbs;
}

// Helper to format segment into readable label
function formatSegmentLabel(segment: string): string {
  // Common mappings
  const labelMap: Record<string, string> = {
    products: "Sản phẩm",
    product: "Sản phẩm",
    categories: "Danh mục",
    category: "Danh mục",
    about: "Về chúng tôi",
    cart: "Giỏ hàng",
    checkout: "Thanh toán",
    account: "Tài khoản",
    orders: "Đơn hàng",
    search: "Tìm kiếm",
  };

  if (labelMap[segment]) {
    return labelMap[segment];
  }

  // Convert slug to title case
  return segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

