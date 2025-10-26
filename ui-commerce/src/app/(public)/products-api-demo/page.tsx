'use client';

import { useState } from 'react';
import ProductList from '@/components/product/ProductList';
import { ProductStatus } from '@/types/product';
import type { ProductFilters } from '@/types/product';

export default function ProductsApiDemoPage() {
  const [filters, setFilters] = useState<ProductFilters>({
    page: 1,
    limit: 12,
    status: ProductStatus.ACTIVE,
  });

  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({
      ...filters,
      search: searchQuery || undefined,
      page: 1,
    });
  };

  const handleFilterChange = (key: keyof ProductFilters, value: any) => {
    setFilters({
      ...filters,
      [key]: value,
      page: 1, // Reset to first page when filter changes
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Demo API Product - Kết nối Backend NestJS
          </h1>
          <p className="text-gray-600">
            Trang demo kết nối với backend API để hiển thị danh sách sản phẩm
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Bộ lọc</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tìm kiếm
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm sản phẩm..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Tìm
                </button>
              </div>
            </form>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trạng thái
              </label>
              <select
                value={filters.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Tất cả</option>
                <option value={ProductStatus.ACTIVE}>Active</option>
                <option value={ProductStatus.DRAFT}>Draft</option>
                <option value={ProductStatus.INACTIVE}>Inactive</option>
                <option value={ProductStatus.OUT_OF_STOCK}>Out of Stock</option>
              </select>
            </div>

            {/* Featured Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nổi bật
              </label>
              <select
                value={filters.isFeatured === undefined ? '' : filters.isFeatured.toString()}
                onChange={(e) => {
                  const value = e.target.value;
                  handleFilterChange(
                    'isFeatured',
                    value === '' ? undefined : value === 'true'
                  );
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Tất cả</option>
                <option value="true">Có</option>
                <option value="false">Không</option>
              </select>
            </div>

            {/* Limit */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Số lượng/trang
              </label>
              <select
                value={filters.limit || 12}
                onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="6">6</option>
                <option value="12">12</option>
                <option value="24">24</option>
                <option value="48">48</option>
              </select>
            </div>

            {/* Reset Button */}
            <div className="lg:col-span-4">
              <button
                onClick={() => {
                  setFilters({
                    page: 1,
                    limit: 12,
                    status: ProductStatus.ACTIVE,
                  });
                  setSearchQuery('');
                }}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Reset bộ lọc
              </button>
            </div>
          </div>
        </div>

        {/* Product List */}
        <ProductList filters={filters} />

        {/* API Info */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            Thông tin API
          </h3>
          <div className="space-y-2 text-sm text-blue-800">
            <p>
              <strong>Backend URL:</strong>{' '}
              {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}
            </p>
            <p>
              <strong>Endpoint:</strong> GET /products
            </p>
            <p>
              <strong>Filters hiện tại:</strong>
            </p>
            <pre className="bg-white p-3 rounded border border-blue-200 overflow-x-auto">
              {JSON.stringify(filters, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

