// Product types matching backend NestJS API

export enum ProductStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
}

export interface ProductVariant {
  id: string;
  name?: string;
  sku?: string;
  price: number;
  compareAtPrice?: number;
  costPrice?: number;
  stock: number;
  lowStockThreshold?: number;
  imageUrl?: string;
  weight?: number;
  isDefault: boolean;
  isActive: boolean;
  attributes?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  parentId?: string;
  level: number;
  createdAt: string;
  updatedAt: string;
}

export interface EcoImpact {
  id: string;
  productGroup: string;
  glassesOfWater: number;
  hoursOfLighting: number;
  kmsOfDriving: number;
}

export enum ProductSeason {
  SPRING = 'SPRING',
  SUMMER = 'SUMMER',
  FALL = 'FALL',
  WINTER = 'WINTER',
  ALL_SEASON = 'ALL_SEASON',
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  content?: string;
  bandName?: string;
  categories?: Category[];
  imageUrls?: string[];
  thumbnailUrl?: string;
  variants: ProductVariant[];
  status: ProductStatus;
  isFeatured: boolean;
  tags?: string[];
  views: number;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  ecoImpact?: EcoImpact | null;
  season?: ProductSeason | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductListItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  thumbnailUrl?: string;
  status: ProductStatus;
  isFeatured: boolean;
  views: number;
  variants: {
    id: string;
    price: number;
    compareAtPrice?: number;
    stock: number;
    imageUrl?: string;
    isDefault: boolean;
  }[];
  categories?: {
    id: string;
    name: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductFilters {
  categoryId?: string;
  status?: ProductStatus;
  isFeatured?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ProductsResponse {
  data: ProductListItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  category?: {
    id: string;
    name: string;
    slug: string;
    description?: string;
  };
}

export interface CreateProductVariantDto {
  name?: string;
  sku?: string;
  price: number;
  compareAtPrice?: number;
  costPrice?: number;
  stock: number;
  lowStockThreshold?: number;
  imageUrl?: string;
  weight?: number;
  isDefault?: boolean;
  isActive?: boolean;
  attributes?: Record<string, string>;
}

export interface CreateProductDto {
  name: string;
  slug?: string;
  description?: string;
  content?: string;
  bandName?: string;
  categoryIds?: string[];
  imageUrls?: string[];
  thumbnailUrl?: string;
  variants: CreateProductVariantDto[];
  status?: ProductStatus;
  isFeatured?: boolean;
  tags?: string[];
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  ecoImpactId?: string;
  season?: ProductSeason;
}

export interface UpdateProductDto {
  name?: string;
  slug?: string;
  description?: string;
  content?: string;
  bandName?: string;
  categoryIds?: string[];
  imageUrls?: string[];
  thumbnailUrl?: string;
  status?: ProductStatus;
  isFeatured?: boolean;
  tags?: string[];
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  ecoImpactId?: string;
  season?: ProductSeason;
}

export interface UpdateProductVariantDto {
  name?: string;
  sku?: string;
  price?: number;
  compareAtPrice?: number;
  costPrice?: number;
  stock?: number;
  lowStockThreshold?: number;
  imageUrl?: string;
  weight?: number;
  isDefault?: boolean;
  isActive?: boolean;
  attributes?: Record<string, string>;
}

