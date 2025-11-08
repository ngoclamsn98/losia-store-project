// Category API service for connecting to NestJS backend

import { get } from './client';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  parentId?: string;
  parent?: Category;
  children?: Category[];
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryFilters {
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CategoriesResponse {
  data: Category[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

/**
 * Get all categories with optional filters and pagination
 */
export async function getCategories(filters?: CategoryFilters): Promise<CategoriesResponse> {
  return get<CategoriesResponse>('/categories', filters);
}

/**
 * Get mega menu structure (hierarchical categories)
 * Returns root categories with nested children
 */
export async function getMegaMenu(): Promise<Category[]> {
  return get<Category[]>('/categories/mega-menu');
}

/**
 * Get category by ID
 */
export async function getCategoryById(id: string): Promise<Category> {
  return get<Category>(`/categories/${id}`);
}

