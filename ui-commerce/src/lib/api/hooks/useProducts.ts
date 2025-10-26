'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getProducts,
  getProductById,
  getProductBySlug,
  getFeaturedProducts,
  getProductsByCategory,
  searchProducts,
} from '../products';
import type { Product, ProductListItem, ProductFilters } from '@/types/product';

interface UseProductsResult {
  products: ProductListItem[];
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  totalPages: number;
  refetch: () => void;
}

/**
 * Hook to fetch products with filters
 */
export function useProducts(filters?: ProductFilters): UseProductsResult {
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(filters?.page || 1);
  const [totalPages, setTotalPages] = useState(0);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getProducts(filters);
      setProducts(response.data);
      setTotal(response.meta.total);
      setPage(response.meta.page);
      setTotalPages(response.meta.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch products');
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    loading,
    error,
    total,
    page,
    totalPages,
    refetch: fetchProducts,
  };
}

interface UseProductResult {
  product: Product | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook to fetch a single product by ID
 */
export function useProduct(id: string | null): UseProductResult {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(!id ? false : true);
  const [error, setError] = useState<string | null>(null);

  const fetchProduct = useCallback(async () => {
    if (!id) {
      setLoading(false);
      setProduct(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await getProductById(id);
      setProduct(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch product');
      console.error('Error fetching product:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  return {
    product,
    loading,
    error,
    refetch: fetchProduct,
  };
}

/**
 * Hook to fetch a single product by slug
 */
export function useProductBySlug(slug: string | null): UseProductResult {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(!slug ? false : true);
  const [error, setError] = useState<string | null>(null);

  const fetchProduct = useCallback(async () => {
    if (!slug) {
      setLoading(false);
      setProduct(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await getProductBySlug(slug);
      setProduct(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch product');
      console.error('Error fetching product:', err);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  return {
    product,
    loading,
    error,
    refetch: fetchProduct,
  };
}

/**
 * Hook to fetch featured products
 */
export function useFeaturedProducts(limit: number = 10): UseProductsResult {
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getFeaturedProducts(limit);
      setProducts(response.data);
      setTotal(response.meta.total);
      setPage(response.meta.page);
      setTotalPages(response.meta.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch featured products');
      console.error('Error fetching featured products:', err);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    loading,
    error,
    total,
    page,
    totalPages,
    refetch: fetchProducts,
  };
}

/**
 * Hook to fetch products by category
 */
export function useProductsByCategory(
  categoryId: string | null,
  page: number = 1,
  limit: number = 20
): UseProductsResult {
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [loading, setLoading] = useState(!categoryId ? false : true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(page);
  const [totalPages, setTotalPages] = useState(0);

  const fetchProducts = useCallback(async () => {
    if (!categoryId) {
      setLoading(false);
      setProducts([]);
      setTotal(0);
      setTotalPages(0);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await getProductsByCategory(categoryId, page, limit);
      setProducts(response.data);
      setTotal(response.meta.total);
      setCurrentPage(response.meta.page);
      setTotalPages(response.meta.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch products');
      console.error('Error fetching products by category:', err);
    } finally {
      setLoading(false);
    }
  }, [categoryId, page, limit]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    loading,
    error,
    total,
    page: currentPage,
    totalPages,
    refetch: fetchProducts,
  };
}

/**
 * Hook to search products
 */
export function useSearchProducts(
  query: string,
  page: number = 1,
  limit: number = 20
): UseProductsResult {
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [loading, setLoading] = useState(!query ? false : true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(page);
  const [totalPages, setTotalPages] = useState(0);

  const fetchProducts = useCallback(async () => {
    if (!query) {
      setProducts([]);
      setLoading(false);
      setTotal(0);
      setTotalPages(0);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await searchProducts(query, page, limit);
      setProducts(response.data);
      setTotal(response.meta.total);
      setCurrentPage(response.meta.page);
      setTotalPages(response.meta.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search products');
      console.error('Error searching products:', err);
    } finally {
      setLoading(false);
    }
  }, [query, page, limit]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    loading,
    error,
    total,
    page: currentPage,
    totalPages,
    refetch: fetchProducts,
  };
}

