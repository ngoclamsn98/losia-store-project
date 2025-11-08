'use client';

import React, { useState, useMemo } from 'react';
import QuickInfoSection from '@/components/product/ProductDetailSection/QuickInfoSection';
import ConditionSection from '@/components/product/ProductDetailSection/ConditionSection';
import ItemDetailsSection from '@/components/product/ProductDetailSection/ItemDetailsSection';
import SizeFitSection from '@/components/product/ProductDetailSection/SizeFitSection';
import ShippingReturnsSection from '@/components/product/ProductDetailSection/ShippingReturnsSection';
import EcoImpactSection from '@/components/product/ProductDetailSection/EcoImpactSection';
import SellWithUsSection from '@/components/product/ProductDetailSection/SellWithUsSection';
import VariantSelector, { ProductVariant } from '@/components/product/ProductDetailSection/VariantSelector';
import { addToLocalCart } from '@/lib/cart/localStorage';
import { internalPost } from '@/lib/api/internal';

type ProductDetail = {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  content?: string | null;
  price: number;
  oldPrice?: number | null;
  retailPrice?: number | null;
  discountPercent?: number | null;
  inventory: number;
  condition?: string | null;
  conditionDescription?: string | null;
  brand?: string | null;
  category?: string | null;
  size?: string | null;
  sizeLabel?: string | null;
  sizeDisplay?: string | null;
  images?: string[];
  thumbnailUrl?: string | null;
  isFeatured?: boolean;
  isPopular?: boolean;
  isOnlyOneAvailable?: boolean;
  views?: number;
  sku?: string | null;
  productType?: {
    name?: string;
    parent?: { name?: string };
  };
  ecoImpactGroup?: string | null;
  productKindForEco?: string | null;
  measuredLength?: string | null;
  glassesOfWater?: number | null;
  hoursOfLighting?: number | null;
  kmsOfDriving?: number | null;
};

type Props = {
  product: ProductDetail;
  variants: ProductVariant[];
};

export default function ProductDetailClient({ product: initialProduct, variants }: Props) {
  // Lấy variant mặc định
  const defaultVariant = variants.find(v => v.isDefault) || variants[0];
  const [selectedVariantId, setSelectedVariantId] = useState(defaultVariant?.id || '');
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [cartMessage, setCartMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Tính toán product data dựa trên variant được chọn
  const product = useMemo(() => {
    const selectedVariant = variants.find(v => v.id === selectedVariantId) || defaultVariant;
    
    if (!selectedVariant) return initialProduct;

    // Tính discount percent
    let discountPercent: number | null = null;
    if (selectedVariant.compareAtPrice && selectedVariant.compareAtPrice > selectedVariant.price) {
      discountPercent = Math.round(
        ((selectedVariant.compareAtPrice - selectedVariant.price) / selectedVariant.compareAtPrice) * 100
      );
    }

    return {
      ...initialProduct,
      price: selectedVariant.price,
      oldPrice: selectedVariant.compareAtPrice || null,
      retailPrice: selectedVariant.compareAtPrice || null,
      discountPercent,
      inventory: selectedVariant.stock,
      sizeLabel: selectedVariant.name || initialProduct.sizeLabel,
      sizeDisplay: selectedVariant.name || initialProduct.sizeDisplay,
      sku: selectedVariant.sku || initialProduct.sku,
      isOnlyOneAvailable: selectedVariant.stock === 1,
    };
  }, [selectedVariantId, variants, defaultVariant, initialProduct]);

  const outOfStock = product.inventory <= 0;
  const brand = (product.brand || 'LOSIA').trim();
  const categoryName = product.productType?.name || product.productType?.parent?.name || product.productKindForEco || 'Others';

  // Handle add to cart
  const handleAddToCart = async () => {
    if (outOfStock) return;

    setIsAddingToCart(true);
    setCartMessage(null);

    try {
      const selectedVariant = variants.find(v => v.id === selectedVariantId);
      if (!selectedVariant) {
        throw new Error('Variant không tồn tại');
      }

      // 1. Lưu vào localStorage (luôn luôn - không cần đăng nhập)
      const cartItem = {
        variantId: selectedVariant.id,
        productId: product.id,
        productName: product.title,
        variantName: selectedVariant.name,
        price: selectedVariant.price,
        quantity: 1,
        imageUrl: selectedVariant.imageUrl || product.thumbnailUrl,
      };

      addToLocalCart(cartItem);

      // 2. Call API /api/cart (giữ nguyên logic cũ)
      let apiSuccess = false;
      try {
        // Ưu tiên /api/cart/items
        await internalPost('/api/cart/items', { productId: product.id, qty: 1 });
        apiSuccess = true;
      } catch {
        // Fallback: /api/cart
        try {
          await internalPost('/api/cart', { productId: product.id, qty: 1 });
          apiSuccess = true;
        } catch {
          apiSuccess = false;
        }
      }

      if (!apiSuccess) {
        console.warn('API cart failed, but localStorage saved');
      }

      // 3. Dispatch events (giữ nguyên logic cũ để mở MiniCartDrawer)
      try {
        localStorage.setItem('losia:open-minicart', '1');
        window.dispatchEvent(new CustomEvent('losia:cart-changed'));
        window.dispatchEvent(new CustomEvent('losia:minicart:open'));
      } catch {}

      setCartMessage({
        type: 'success',
        text: `Đã thêm vào giỏ hàng!`
      });

      // 4. Track analytics (giữ nguyên)
      if (typeof window !== 'undefined') {
        (window as any).dataLayer?.push({
          event: 'add_to_cart',
          ecommerce: {
            items: [{
              item_id: product.id,
              item_name: product.title,
              item_brand: brand,
              item_category: categoryName,
              price: product.price,
              quantity: 1,
            }],
          },
        });
      }

      // Clear message sau 3s
      setTimeout(() => setCartMessage(null), 3000);
    } catch (error: any) {
      console.error('Add to cart error:', error);
      setCartMessage({ type: 'error', text: error.message || 'Có lỗi xảy ra' });
    } finally {
      setIsAddingToCart(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Thông tin nhanh + CTA */}
      <QuickInfoSection
        productId={product.id}
        title={product.title}
        brand={brand}
        sizeLabel={product.sizeLabel ?? product.size ?? undefined}
        isOnlyOneAvailable={product.isOnlyOneAvailable}
        retailPrice={product.retailPrice ?? undefined}
        oldPrice={product.oldPrice ?? undefined}
        price={product.price}
        discountPercent={product.discountPercent ?? undefined}
        discountCode={undefined}
        isPopular={product.isPopular}
        content={product.content}
        description={product.description}
        cta={
          <div className="space-y-3">
            <button
              onClick={handleAddToCart}
              disabled={outOfStock || isAddingToCart}
              className={`
                w-full px-6 py-3 rounded-xl font-semibold transition
                ${outOfStock 
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                  : 'bg-black text-white hover:bg-gray-800'
                }
              `}
            >
              {isAddingToCart ? 'Đang thêm...' : outOfStock ? 'Hết hàng' : 'Thêm vào giỏ hàng'}
            </button>

            {cartMessage && (
              <div className={`
                px-4 py-2 rounded-lg text-sm text-center
                ${cartMessage.type === 'success' 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
                }
              `}>
                {cartMessage.text}
              </div>
            )}
          </div>
        }
      />

      {/* Variant Selector */}
      <VariantSelector
        variants={variants}
        selectedVariantId={selectedVariantId}
        onVariantChange={setSelectedVariantId}
      />

      {/* Tình trạng */}
      {product.condition && (
        <ConditionSection
          condition={product.condition}
          conditionDescription={product.conditionDescription || undefined}
        />
      )}

      {/* Thông tin sản phẩm */}
      <ItemDetailsSection description={product.content || ''} />

      {/* Kích cỡ & phom dáng */}
      <SizeFitSection
        sizeDisplay={product.sizeDisplay || product.sizeLabel || product.size || ''}
        measuredLength={product.measuredLength ? parseFloat(product.measuredLength) : undefined}
      />

      {/* Bán cùng LOSIA */}
      <SellWithUsSection brandName={product.title} />

      {/* Vận chuyển & đổi trả */}
      <ShippingReturnsSection />

      {/* Tác động môi trường */}
      <EcoImpactSection
        productType={
          product.ecoImpactGroup ||
          product.productType?.parent?.name ||
          product.productType?.name ||
          product.productKindForEco ||
          'dress'
        }
        glassesOfWater={product.glassesOfWater ?? undefined}
        hoursOfLighting={product.hoursOfLighting ?? undefined}
        kmsOfDriving={product.kmsOfDriving ?? undefined}
      />
    </div>
  );
}

