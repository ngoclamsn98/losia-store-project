import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductsByCategorySlug } from "@/lib/api/products";
import CategoryProductsClient from "../[slug]/CategoryProductsClient";

type PageProps = {
  params: { slugs?: string[] };
  searchParams: { page?: string };
};

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const slugs = params.slugs || [];
  const slug = slugs[slugs.length - 1] || "categories";
  
  const categoryName = slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return {
    title: `${categoryName} - Losia Store`,
    description: `Khám phá bộ sưu tập ${categoryName} tại Losia Store. Thời trang bền vững, chất lượng cao.`,
  };
}

// Server Component - Fetch data on server
export default async function CategoryPage({ params, searchParams }: PageProps) {
  const page = searchParams.page ? parseInt(searchParams.page, 10) : 1;
  const limit = 12;
  
  const slugs = params.slugs || [];
  
  if (slugs.length === 0) {
    notFound();
  }

  // Use the deepest slug to fetch products
  const slug = slugs[slugs.length - 1];
  
  let productsData;
  
  try {
    productsData = await getProductsByCategorySlug(slug, {
      page,
      limit,
      status: "ACTIVE",
    });
  } catch (error) {
    console.error("Failed to fetch products for category:", slug, error);
    notFound();
  }

  const categoryName = slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  // Reconstruct the full path for pagination
  const fullPath = `/categories/${slugs.join("/")}`;

  return (
    <CategoryProductsClient
      slug={fullPath}
      categoryName={categoryName}
      initialData={productsData}
      currentPage={page}
    />
  );
}

