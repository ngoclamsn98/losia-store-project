'use client';

import React from 'react';

export type ProductVariant = {
  id: string;
  name?: string | null;
  sku?: string | null;
  price: number;
  compareAtPrice?: number | null;
  stock: number;
  isDefault: boolean;
  isActive: boolean;
  imageUrl?: string | null;
  attributes?: Record<string, string> | null;
  brandName?: string | null;
};

type Props = {
  variants: ProductVariant[];
  selectedVariantId: string;
  onVariantChange: (variantId: string) => void;
};

export default function VariantSelector({ variants, selectedVariantId, onVariantChange }: Props) {
  if (!variants || variants.length <= 1) {
    return null; // Không hiển thị nếu chỉ có 1 variant
  }

  const activeVariants = variants.filter(v => v.isActive);

  if (activeVariants.length === 0) {
    return null;
  }

  return (
    <div className="border-t border-gray-100 pt-4">
      <h3 className="text-sm font-medium text-gray-900 mb-3">Chọn phiên bản</h3>
      
      <div className="grid grid-cols-2 gap-2">
        {activeVariants.map((variant) => {
          const isSelected = variant.id === selectedVariantId;
          const isOutOfStock = variant.stock <= 0;
          
          return (
            <button
              key={variant.id}
              onClick={() => !isOutOfStock && onVariantChange(variant.id)}
              disabled={isOutOfStock}
              className={`
                relative px-4 py-3 rounded-lg border-2 text-sm font-medium transition
                ${isSelected 
                  ? 'border-black bg-black text-white' 
                  : isOutOfStock
                  ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                  : 'border-gray-300 bg-white text-gray-900 hover:border-gray-400'
                }
              `}
            >
              <div className="flex flex-col items-start">
                <span className="font-semibold">{variant.name || `Variant ${variant.id.slice(0, 8)}`}</span>
                {variant.sku && (
                  <span className="text-xs opacity-75 mt-0.5">SKU: {variant.sku}</span>
                )}
                <span className="text-xs opacity-75 mt-1">
                  {isOutOfStock ? 'Hết hàng' : `Còn ${variant.stock}`}
                </span>
              </div>
              
              {isOutOfStock && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-semibold text-red-600 bg-white px-2 py-1 rounded">
                    Hết hàng
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

