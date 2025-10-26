'use client';

import { useState, useEffect } from 'react';
import { getProducts } from '@/lib/api';
import type { ProductListItem } from '@/types/product';

/**
 * Simple API Test Page - Kiểm tra kết nối với Backend
 */
export default function ApiTestPage() {
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiUrl, setApiUrl] = useState('');

  useEffect(() => {
    setApiUrl(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001');
    
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        
        const response = await getProducts({ limit: 10 });
        setProducts(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            API Connection Test
          </h1>
          <p className="text-gray-600">
            Kiểm tra kết nối với Backend NestJS
          </p>
          <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Backend URL:</strong> {apiUrl}
            </p>
            <p className="text-sm text-blue-800">
              <strong>Endpoint:</strong> GET /products?limit=10
            </p>
          </div>
        </div>

        {/* Status */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Trạng thái kết nối</h2>
          
          {loading && (
            <div className="flex items-center gap-3 text-blue-600">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"></div>
              <span>Đang kết nối với backend...</span>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded">
              <p className="text-red-800 font-semibold mb-2">❌ Lỗi kết nối</p>
              <p className="text-red-700 text-sm">{error}</p>
              <div className="mt-3 text-sm text-red-600">
                <p className="font-semibold">Kiểm tra:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Backend có đang chạy không? (http://localhost:3001)</li>
                  <li>CORS đã được enable chưa?</li>
                  <li>NEXT_PUBLIC_API_URL trong .env.local đúng chưa?</li>
                </ul>
              </div>
            </div>
          )}

          {!loading && !error && (
            <div className="p-4 bg-green-50 border border-green-200 rounded">
              <p className="text-green-800 font-semibold">
                ✅ Kết nối thành công!
              </p>
              <p className="text-green-700 text-sm mt-1">
                Đã tải được {products.length} sản phẩm từ backend
              </p>
            </div>
          )}
        </div>

        {/* Products Data */}
        {!loading && !error && products.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">
              Dữ liệu sản phẩm ({products.length})
            </h2>
            
            <div className="space-y-4">
              {products.map((product, index) => {
                const defaultVariant = product.variants.find(v => v.isDefault) || product.variants[0];
                
                return (
                  <div 
                    key={product.id}
                    className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-mono text-gray-500">
                            #{index + 1}
                          </span>
                          <h3 className="font-semibold text-gray-900">
                            {product.name}
                          </h3>
                          {product.isFeatured && (
                            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                              Featured
                            </span>
                          )}
                        </div>
                        
                        {product.description && (
                          <p className="text-sm text-gray-600 mb-2">
                            {product.description}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-gray-700">
                            <strong>Giá:</strong> {defaultVariant?.price.toLocaleString('vi-VN')}₫
                          </span>
                          <span className="text-gray-700">
                            <strong>Tồn kho:</strong> {defaultVariant?.stock}
                          </span>
                          <span className="text-gray-700">
                            <strong>Lượt xem:</strong> {product.views}
                          </span>
                        </div>

                        {product.categories && product.categories.length > 0 && (
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-xs text-gray-500">Categories:</span>
                            {product.categories.map(cat => (
                              <span 
                                key={cat.id}
                                className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded"
                              >
                                {cat.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {product.thumbnailUrl && (
                        <img 
                          src={product.thumbnailUrl}
                          alt={product.name}
                          className="w-20 h-20 object-cover rounded ml-4"
                        />
                      )}
                    </div>

                    <details className="mt-3">
                      <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                        Xem JSON data
                      </summary>
                      <pre className="mt-2 p-3 bg-gray-50 rounded text-xs overflow-x-auto">
                        {JSON.stringify(product, null, 2)}
                      </pre>
                    </details>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* No Data */}
        {!loading && !error && products.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-gray-600 text-center">
              Không có sản phẩm nào trong database
            </p>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-3">
            Hướng dẫn sử dụng
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
            <li>Đảm bảo backend NestJS đang chạy trên port 3001</li>
            <li>Tạo file .env.local với NEXT_PUBLIC_API_URL="http://localhost:3001"</li>
            <li>Restart Next.js dev server sau khi thay đổi .env</li>
            <li>Kiểm tra Swagger docs tại: http://localhost:3001/api</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

