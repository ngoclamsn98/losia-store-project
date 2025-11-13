// Product API service for connecting to NestJS backend

import { get, post, patch, del } from './client';
import type {
  Product,
  ProductsResponse,
  ProductFilters,
  CreateProductDto,
  UpdateProductDto,
  UpdateProductVariantDto,
} from '@/types/product';

/**
 * Get all products with optional filters and pagination
 */
export async function getProducts(filters?: ProductFilters): Promise<ProductsResponse> {
  return get<ProductsResponse>('/products', filters);
}

/**
 * Get product by ID
 */
export async function getProductById(id: string): Promise<Product> {
  return get<Product>(`/products/${id}`);
}

/**
 * Get product by slug (increments view count)
 */
export async function getProductBySlug(slug: string): Promise<Product> {
  return get<Product>(`/products/slug/${slug}`);
}

/**
 * Create a new product (Admin only - requires authentication)
 */
export async function createProduct(data: CreateProductDto): Promise<Product> {
  return post<Product>('/products', data);
}

/**
 * Update a product (Admin only - requires authentication)
 */
export async function updateProduct(id: string, data: UpdateProductDto): Promise<Product> {
  return patch<Product>(`/products/${id}`, data);
}

/**
 * Delete a product (Admin only - requires authentication)
 */
export async function deleteProduct(id: string): Promise<void> {
  return del<void>(`/products/${id}`);
}

/**
 * Update product variant (Admin only - requires authentication)
 */
export async function updateProductVariant(
  productId: string,
  variantId: string,
  data: UpdateProductVariantDto
): Promise<Product> {
  return patch<Product>(`/products/${productId}/variants/${variantId}`, data);
}

/**
 * Delete product variant (Admin only - requires authentication)
 */
export async function deleteProductVariant(
  productId: string,
  variantId: string
): Promise<void> {
  return del<void>(`/products/${productId}/variants/${variantId}`);
}

/**
 * Get featured products
 */
export async function getFeaturedProducts(limit: number = 10): Promise<ProductsResponse> {
  return getProducts({ isFeatured: true, limit });
}

/**
 * Get products by category
 */
export async function getProductsByCategory(
  categoryId: string,
  page: number = 1,
  limit: number = 20
): Promise<ProductsResponse> {
  return getProducts({ categoryId, page, limit });
}

/**
 * Get products by category slug
 * - Parent category: returns all products from descendant categories
 * - Child category: returns products only from that category
 */
export async function getProductsByCategorySlug(
  slug: string,
  filters?: {
    page?: number;
    limit?: number;
    status?: string;
  }
): Promise<ProductsResponse> {
  const params: Record<string, string> = {};

  if (filters?.page) params.page = String(filters.page);
  if (filters?.limit) params.limit = String(filters.limit);
  if (filters?.status) params.status = filters.status;

  return get<ProductsResponse>(`/products/category/${slug}`, params);
}

/**
 * Get products by nested category slugs (supports 1, 2, or 3 levels)
 * - Level 1 only (slug1): get all products from slug1 and its descendants
 * - Level 1 & 2 (slug1/slug2): get all products from slug2 and its descendants
 * - Level 1 & 2 & 3 (slug1/slug2/slug3): get products from slug3 and its descendants
 */
export async function getProductsByNestedCategorySlugs(
  slugs: string[],
  filters?: {
    page?: number;
    limit?: number;
    status?: string;
  }
): Promise<ProductsResponse> {
  const params: Record<string, string> = {};

  if (filters?.page) params.page = String(filters.page);
  if (filters?.limit) params.limit = String(filters.limit);
  if (filters?.status) params.status = filters.status;

  // Build the endpoint based on the number of slugs
  let endpoint = '/products/categories';
  if (slugs.length === 1) {
    endpoint = `/products/categories/${slugs[0]}`;
  } else if (slugs.length === 2) {
    endpoint = `/products/categories/${slugs[0]}/${slugs[1]}`;
  } else if (slugs.length === 3) {
    endpoint = `/products/categories/${slugs[0]}/${slugs[1]}/${slugs[2]}`;
  } else {
    throw new Error('Invalid number of category slugs. Expected 1-3 slugs.');
  }

  return get<ProductsResponse>(endpoint, params);
}

/**
 * Search products by keyword
 */
export async function searchProducts(
  query: string,
  filters?: {
    page?: number;
    limit?: number;
    status?: string;
  }
): Promise<ProductsResponse> {
  const params: Record<string, string> = {
    q: query,
  };

  if (filters?.page) params.page = String(filters.page);
  if (filters?.limit) params.limit = String(filters.limit);
  if (filters?.status) params.status = filters.status;

  return get<ProductsResponse>('/products/search', params);
}

