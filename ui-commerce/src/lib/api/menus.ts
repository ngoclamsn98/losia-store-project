// Menu API service for connecting to NestJS backend

import { get } from './client';
import type { Category } from './categories';

export interface Menu {
  id: string;
  name: string;
  slug: string;
  label?: string; // For backward compatibility
  type?: 'text' | 'category'; // For backward compatibility
  categoryId?: string;
  category?: Category;
  parentId?: string | null;
  parent?: Menu;
  children?: Menu[];
  description?: string | null;
  imageUrl?: string | null;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MenuFilters {
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface MenusResponse {
  data: Menu[];
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
 * Get all menus with optional filters and pagination
 */
export async function getMenus(filters?: MenuFilters): Promise<MenusResponse> {
  return get<MenusResponse>('/categories/mega-menu', filters);
}

/**
 * Get menu tree structure (hierarchical menus)
 * Returns root menus with nested children
 * Only returns active menus
 */
export async function getMenuTree(): Promise<Menu[]> {
  return get<Menu[]>('/categories/mega-menu');
}

/**
 * Get menu by ID
 */
export async function getMenuById(id: string): Promise<Menu> {
  return get<Menu>(`/menus/${id}`);
}

