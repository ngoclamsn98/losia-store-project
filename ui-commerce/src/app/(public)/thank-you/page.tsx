"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useCart } from "@/app/providers/CartProvider";
import type { CartItem } from "@/app/providers/CartProvider";
import { formatVND, formatDate, formatDateTime } from "@/lib/utils/format";
import Image from "next/image";

/** Backend Order DTO */
type BackendOrderDTO = {
  id: string;
  orderNumber: string;
  userId: string | null;
  items: Array<{
    variantId: string;
    productId: string;
    productName: string;
    variantName?: string;
    price: number;
    quantity: number;
    imageUrl?: string;
  }>;
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  shippingAddress: {
    fullName: string;
    phone: string;
    address: string;
    city: string;
    district?: string;
    ward?: string;
    postalCode?: string;
  };
  notes?: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
};

export default function ThankYouPage() {
  const params = useSearchParams();
  const orderId = params.get("order") || ""; // Order ID from URL
  const method = (params.get("method") || "cod").toUpperCase();

  const { items: cartItems, subtotal: cartSubtotal, clearLocal } = useCart();
  const [order, setOrder] = useState<BackendOrderDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        setLoading(true);
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const res = await fetch(`${apiUrl}/orders/${orderId}`, {
          cache: "no-store",
          credentials: 'include',
        });

        if (!res.ok) {
          throw new Error('Không thể tải thông tin đơn hàng');
        }

        const data = await res.json();
        setOrder(data);

        // Clear local cart after successful order fetch
        try {
          clearLocal();
          window.dispatchEvent(new CustomEvent("losia:cart-changed"));
          window.dispatchEvent(new Event("losia:minicart:close"));
        } catch {}
      } catch (err) {
        console.error('Error fetching order:', err);
        setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
      } finally {
        setLoading(false);
      }
    })();
  }, [orderId, clearLocal]);

  const displayCode = order?.orderNumber || orderId || "—";

  // Display items: Priority order.items → fallback cartItems
  const lineItems = useMemo(() => {
    if (order?.items?.length) {
      return order.items.map((it, idx) => ({
        key: `o-${it.variantId}-${idx}`,
        title: it.productName,
        variant: it.variantName,
        cover: it.imageUrl || "/assets/placeholder-3x4.png",
        qty: it.quantity,
        unit: it.price,
      }));
    }
    return cartItems.map((it: CartItem) => ({
      key: `c-${it.productId}`,
      title: it.product.title,
      variant: undefined,
      cover: it.product.cover || "/assets/placeholder-3x4.png",
      qty: it.qty,
      unit: (it.product.price ?? it.product.oldPrice ?? 0),
    }));
  }, [order, cartItems]);

  // Calculate totals: Priority from order → fallback cart
  const computedSubtotal = useMemo<number>(() => {
    if (order) return order.subtotal;
    const fromCart =
      (typeof cartSubtotal === "number" ? cartSubtotal : 0) ||
      lineItems.reduce((s, it) => s + it.unit * it.qty, 0);
    return fromCart;
  }, [order, cartSubtotal, lineItems]);

  const tax = useMemo(() => {
    if (order) return order.tax;
    return Math.round(computedSubtotal * 0.1);
  }, [order, computedSubtotal]);

  const shippingFee = order ? order.shipping : (method === "EXP" ? 45000 : 0);
  const discount = order?.discount || 0;

  const total = useMemo(() => {
    if (order) return order.total;
    return computedSubtotal + tax + shippingFee - discount;
  }, [order, computedSubtotal, tax, shippingFee, discount]);

  // Loading state
  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center shadow-sm">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-black"></div>
          <p className="mt-4 text-sm text-gray-600">Đang tải thông tin đơn hàng...</p>
        </div>
      </main>
    );
  }

  // Error state
  if (error) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="rounded-2xl border border-red-100 bg-red-50 p-6 shadow-sm">
          <h1 className="text-lg font-semibold text-red-900">Có lỗi xảy ra</h1>
          <p className="mt-2 text-sm text-red-700">{error}</p>
          <Link href="/" className="mt-4 inline-block text-sm font-medium text-red-900 underline">
            Về trang chủ
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      {/* HERO */}
      <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50">
            <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" fill="none" />
            </svg>
          </span>
          <div className="flex-1">
            <h1 className="text-xl font-semibold leading-tight">Cảm ơn bạn đã đặt hàng! 🎉</h1>
            <p className="mt-1 text-sm text-gray-600">
              Mã đơn hàng <span className="font-medium text-gray-900">#{displayCode}</span>
              {order && (
                <>
                  {" — "}
                  <span className="text-gray-500">Ngày đặt: {formatDate(order.createdAt)}</span>
                </>
              )}
            </p>
            {order && (
              <div className="mt-2 flex flex-wrap gap-2">
                <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                  order.status === 'PENDING' ? 'bg-yellow-50 text-yellow-700' :
                  order.status === 'CONFIRMED' ? 'bg-blue-50 text-blue-700' :
                  order.status === 'PROCESSING' ? 'bg-purple-50 text-purple-700' :
                  order.status === 'SHIPPING' ? 'bg-indigo-50 text-indigo-700' :
                  order.status === 'DELIVERED' ? 'bg-green-50 text-green-700' :
                  'bg-red-50 text-red-700'
                }`}>
                  Trạng thái: {order.status}
                </span>
                <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                  order.paymentStatus === 'PAID' ? 'bg-green-50 text-green-700' :
                  order.paymentStatus === 'PENDING' ? 'bg-yellow-50 text-yellow-700' :
                  'bg-red-50 text-red-700'
                }`}>
                  Thanh toán: {order.paymentStatus}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700">
                  Phương thức: {order.paymentMethod}
                </span>
              </div>
            )}
            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
              <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2l3 2 3-2 2 3 2 3-2 3 2 3-2 3-3-2-3 2-3-2-3 2-2-3 2-3-2-3 2-3 3 2 3-2z" fill="currentColor" />
              </svg>
              Safe & Secure Shopping Guarantee
            </div>
          </div>
        </div>
      </section>

      {/* CONTENT */}
      <section className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* LEFT: ITEMS & SHIPPING INFO */}
        <div className="md:col-span-2 space-y-6">
          {/* Products */}
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h2 className="text-base font-semibold">Sản phẩm trong đơn</h2>
              <span className="text-sm text-gray-500">{lineItems.length} sản phẩm</span>
            </div>

            {lineItems.length ? (
              <ul className="divide-y">
                {lineItems.map((it) => (
                  <li key={it.key} className="flex items-center gap-4 px-5 py-4">
                    {/* Thumb */}
                    <div className="h-20 w-16 overflow-hidden rounded-xl bg-gray-50 relative">
                      <Image
                        src={it.cover}
                        alt={it.title}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="truncate text-sm font-medium">{it.title}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-gray-500">
                        {it.variant && <span>Phân loại: {it.variant}</span>}
                        <span>Số lượng: {it.qty}</span>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="text-right">
                      <div className="font-medium">{formatVND(it.unit)}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Tổng: {formatVND(it.unit * it.qty)}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-5 py-10 text-center text-sm text-gray-500">
                Không có sản phẩm trong đơn hàng
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col items-center justify-between gap-3 border-t px-5 py-4 md:flex-row">
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-xl border px-4 py-2 text-sm font-medium hover:bg-gray-50"
              >
                Tiếp tục mua sắm
              </Link>
              <div className="flex items-center gap-3">
                <Link
                  href="/orders"
                  className="inline-flex items-center justify-center rounded-xl border px-4 py-2 text-sm font-medium hover:bg-gray-50"
                >
                  Lịch sử mua hàng
                </Link>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          {order?.shippingAddress && (
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-base font-semibold">Thông tin giao hàng</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <svg className="mt-0.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <div>
                    <div className="font-medium text-gray-900">{order.shippingAddress.fullName}</div>
                    <div className="text-gray-600">{order.shippingAddress.phone}</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <svg className="mt-0.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div className="text-gray-600">
                    <div>{order.shippingAddress.address}</div>
                    <div>
                      {[
                        order.shippingAddress.ward,
                        order.shippingAddress.district,
                        order.shippingAddress.city,
                        order.shippingAddress.postalCode
                      ].filter(Boolean).join(', ')}
                    </div>
                  </div>
                </div>
                {order.notes && (
                  <div className="flex items-start gap-2 pt-2 border-t">
                    <svg className="mt-0.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                    <div>
                      <div className="text-xs font-medium text-gray-500 mb-1">Ghi chú:</div>
                      <div className="text-gray-600">{order.notes}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Service Highlights */}
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FeatureCard title="Đổi ý trong 24h" desc="Hủy nhanh trong 24h khi chưa bàn giao vận chuyển." />
            <FeatureCard title="Miễn phí gói hàng" desc="Đóng gói thân thiện môi trường, không tính phí." />
            <FeatureCard title="Hỗ trợ 7 ngày/tuần" desc="Chat nhanh với CSKH nếu cần trợ giúp." />
          </div>
        </div>

        {/* RIGHT: SUMMARY */}
        <aside className="md:col-span-1">
          <div className="sticky top-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-base font-semibold">Tóm tắt đơn hàng</h3>
            <div className="space-y-2 text-sm">
              <Row label="Tạm tính" value={formatVND(computedSubtotal)} />
              <Row label="Thuế" value={formatVND(tax)} />
              <Row
                label={`Vận chuyển${shippingFee === 0 ? " (Miễn phí)" : ""}`}
                value={formatVND(shippingFee)}
              />
              {discount > 0 && (
                <Row label="Giảm giá" value={`-${formatVND(discount)}`} />
              )}
              <div className="my-2 h-px bg-gray-100" />
              <Row label="Tổng thanh toán" value={formatVND(total)} bold />
            </div>

            {/* Order Info */}
            {order && (
              <div className="mt-4 space-y-2 border-t pt-4 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Mã đơn hàng:</span>
                  <span className="font-medium text-gray-900">{order.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Ngày đặt:</span>
                  <span className="font-medium text-gray-900">{formatDateTime(order.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Phương thức:</span>
                  <span className="font-medium text-gray-900">{order.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Trạng thái:</span>
                  <span className={`font-medium ${
                    order.status === 'DELIVERED' ? 'text-green-600' :
                    order.status === 'CANCELLED' ? 'text-red-600' :
                    'text-yellow-600'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
            )}

            {/* Payment status */}
            <div className="mt-4 rounded-xl bg-gray-50 p-3 text-xs text-gray-600">
              <div className="mb-1 font-medium text-gray-800">Thông tin thanh toán</div>
              {order?.paymentMethod === "BANK_TRANSFER" || method === "QR" ? (
                <p>Đơn đã được ghi nhận. Nếu bạn chưa chuyển khoản, vui lòng hoàn tất thanh toán trong 24 giờ.</p>
              ) : order?.paymentMethod === "COD" || method === "COD" ? (
                <p>Thanh toán khi nhận hàng (COD). Vui lòng chuẩn bị số tiền {formatVND(total)} khi nhận hàng.</p>
              ) : (
                <p>Vui lòng giữ điện thoại để tài xế liên hệ.</p>
              )}
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}

/* ---------- Small UI helpers ---------- */
function Row({ label, value, bold = false }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-gray-600 ${bold ? "font-medium text-gray-900" : ""}`}>{label}</span>
      <span className={`${bold ? "font-semibold text-gray-900" : "text-gray-900"}`}>{value}</span>
    </div>
  );
}

function FeatureCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="text-sm font-semibold">{title}</div>
      <p className="mt-1 text-xs text-gray-600">{desc}</p>
    </div>
  );
}
