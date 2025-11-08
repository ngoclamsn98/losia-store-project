// app/(public)/cart/page.tsx
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import ViewCartAnalytics from '@/components/analytics/ViewCartAnalytics';
import CartRowClient from '@/components/cart/CartRowClient';
import PromoCodeForm from '@/components/cart/PromoCodeForm';
import TrustBadges from '@/components/cart/TrustBadges';
import { formatVND } from '@/lib/format';
import { useCart } from '@/lib/cart';

type DetailedItem = {
  productId: string;
  variantId: string;
  qty: number;
  product: {
    id: string;
    title: string;
    price: number;
    oldPrice: number | null;
    brand?: string;
    category?: string;
    cover: string | null;
    inStock: boolean;
    variantName?: string | null;
  };
};

const FREE_SHIPPING_THRESHOLD = 500_000; // chỉnh theo campaign

export default function CartPage() {
  const { items: localItems, total, count } = useCart();
  const [items, setItems] = useState<DetailedItem[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [voucherCode, setVoucherCode] = useState('');
  const [discount, setDiscount] = useState(0);

  // Convert localStorage items to DetailedItem format
  useEffect(() => {
    const detailedItems: DetailedItem[] = localItems.map(item => ({
      productId: item.productId,
      variantId: item.variantId,
      qty: item.quantity,
      product: {
        id: item.productId,
        title: item.productName,
        price: item.price,
        oldPrice: null, // localStorage không lưu oldPrice
        brand: undefined,
        category: undefined,
        cover: item.imageUrl || null,
        inStock: true,
        variantName: item.variantName,
      },
    }));

    setItems(detailedItems);
    setSubtotal(total);
  }, [localItems, total]);

  const savingPerItem = (it: DetailedItem) =>
    typeof it.product.oldPrice === 'number' && it.product.oldPrice > it.product.price
      ? (it.product.oldPrice - it.product.price) * it.qty
      : 0;

  const totalSavings = items.reduce((acc, it) => acc + savingPerItem(it), 0);
  const freeShipProgress = Math.min(subtotal / FREE_SHIPPING_THRESHOLD, 1);
  const freeShipRemain = Math.max(FREE_SHIPPING_THRESHOLD - subtotal, 0);

  const handleVoucherApplied = (code: string, discountAmount: number) => {
    setVoucherCode(code);
    setDiscount(discountAmount);

    // Save to localStorage so checkout page can use it
    if (code && discountAmount > 0) {
      localStorage.setItem('appliedVoucher', JSON.stringify({ code, discount: discountAmount }));
    } else {
      localStorage.removeItem('appliedVoucher');
    }
  };

  const finalTotal = subtotal - discount;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 grid grid-cols-1 md:grid-cols-3 gap-6">
      <ViewCartAnalytics items={items} value={subtotal} />

      {/* LEFT: items */}
      <section className="md:col-span-2">
        <h1 className="text-2xl font-semibold tracking-tight mb-2">Giỏ hàng của bạn</h1>

        {/* Free shipping banner */}
        <div className="mb-5 rounded-xl border bg-white p-4">
          {freeShipProgress < 1 ? (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Miễn phí vận chuyển</span>
                <span className="tabular-nums">{formatVND(freeShipRemain)} nữa là được</span>
              </div>
              <div className="mt-2 h-2 w-full rounded-full bg-gray-100">
                <div
                  className="h-2 rounded-full bg-black transition-all"
                  style={{ width: `${freeShipProgress * 100}%` }}
                />
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-emerald-700">
                Tuyệt! Đơn hàng của anh đủ điều kiện miễn phí vận chuyển 🎉
              </span>
              <span className="tabular-nums">Ngưỡng: {formatVND(FREE_SHIPPING_THRESHOLD)}</span>
            </div>
          )}
        </div>

        {!items.length && <EmptyState />}

        {items.length > 0 && (
          <ul className="divide-y rounded-xl border bg-white">
            {items.map((row) => (
              <CartRowClient key={row.variantId} row={row} />
            ))}
          </ul>
        )}
      </section>

      {/* RIGHT: summary */}
      <aside className="md:col-span-1">
        <div className="rounded-xl border bg-white p-4 sticky top-6">
          <h2 className="font-semibold text-lg">Tóm tắt đơn hàng</h2>

          <div className="mt-3 space-y-1 text-sm">
            <Line label="Số lượng" value={String(count)} />
            <Line label="Tạm tính" value={formatVND(subtotal)} />
            {totalSavings > 0 && (
              <Line
                label={
                  <span className="text-emerald-700">
                    Tiết kiệm <span className="ml-1 text-[11px] rounded bg-emerald-50 px-2 py-0.5">Wear What Matters</span>
                  </span>
                }
                value={`− ${formatVND(totalSavings)}`}
              />
            )}
            <Line
              label="Phí vận chuyển"
              value={freeShipProgress === 1 || subtotal === 0 ? '0₫' : 'Tính ở bước sau'}
            />
            <Line label="Thuế" value="Tính ở bước sau" />
          </div>

          <PromoCodeForm onVoucherApplied={handleVoucherApplied} />

          {discount > 0 && (
            <div className="mt-3 pt-3 border-t">
              <Line
                label={<span className="text-green-600 font-medium">Giảm giá ({voucherCode})</span>}
                value={<span className="text-green-600">-{formatVND(discount)}</span>}
              />
            </div>
          )}

          <div className="mt-3 border-t pt-3 flex items-center justify-between text-base font-semibold">
            <span>Tổng cộng</span>
            <span className="tabular-nums">{formatVND(finalTotal)}</span>
          </div>

          <Link
            href={items.length ? '/checkout' : '#'}
            aria-disabled={!items.length}
            className={`mt-4 block text-center rounded-lg px-4 py-3 font-medium ${
              items.length ? 'bg-black text-white hover:opacity-90' : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
          >
            Thanh toán
          </Link>

          <Link href="/" className="mt-2 block text-center underline text-sm">
            Tiếp tục mua sắm
          </Link>

          <TrustBadges />
        </div>
      </aside>
    </main>
  );
}

function Line({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-600">{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border bg-white p-8 text-center">
      <div className="mx-auto mb-3 h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">👜</div>
      <h2 className="text-lg font-semibold">Giỏ hàng trống</h2>
      <p className="mt-1 text-sm text-gray-600">
        Hãy khám phá bộ sưu tập mới về để săn deal secondhand xịn!
      </p>
      <div className="mt-4 flex items-center justify-center gap-3">
        <Link
          href="/"
          className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Bắt đầu mua sắm
        </Link>
        <Link href="/" className="text-sm underline">
          Xem sản phẩm gợi ý
        </Link>
      </div>
    </div>
  );
}
