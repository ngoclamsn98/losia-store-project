"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { CreditCard, PackageCheck, Truck, ShieldCheck, QrCode, WalletMinimal } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart"; // Use localStorage cart
import { useSession } from "next-auth/react";
import QRCodeLib from "qrcode";
import AddressSelect from "@/components/common/AddressSelect";
/**
 * Circ — Checkout (QR & COD)
 * - Miễn phí ship 30.000₫ khi đạt 500.000₫
 * - Expedited cố định 45.000₫
 */

// -----------------------------
// Types
// -----------------------------

type ProductLite = {
  id: string;
  title: string;
  price: number;
  oldPrice: number | null;
  brand?: string;
  category?: string;
  cover: string | null;
  inStock: boolean;
};

type DetailedItem = {
  productId: string;
  qty: number; // secondhand thường = 1
  product: ProductLite;
};

type CartResponse = {
  id?: string | null;
  anonId?: string | null;
  email?: string | null;
  detailed?: DetailedItem[];
  subtotal?: number;
  count?: number;
};

type Address = {
  firstName: string;
  lastName: string;
  address1: string;
  address2?: string;
  city: string;
  state?: string;
  postalCode?: string;
  phone: string;
  email: string;
};

// NOTE: label giữ nguyên UX, giá sẽ tính động theo subtotal
const SHIPPING_OPTIONS = [
  { id: "standard", label: "Free Standard", eta: "3–5 ngày" },
  { id: "bundle", label: "Free Bundle (khuyến nghị)", eta: "2 món giao cùng" },
  { id: "expedited", label: "Expedited 2-Day", eta: "2 ngày" },
] as const;

type ShippingId = typeof SHIPPING_OPTIONS[number]["id"];
type PaymentMethod = "qr" | "cod";

// -----------------------------
// Constants (free ship logic)
// -----------------------------

const FREE_SHIP_THRESHOLD = 500_000;  // ✅ đạt ngưỡng này → miễn 30k
const BASE_SHIPPING_FEE = 30_000;     // ✅ phí chuẩn cho standard/bundle nếu CHƯA đủ ngưỡng
const EXPEDITED_FEE = 45_000;         // cố định

// -----------------------------
// Helpers
// -----------------------------

function classNames(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function formatVND(n: number) {
  try { return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n); }
  catch { return `${n}₫`; }
}

// -----------------------------
// Page (Client)
// -----------------------------

export default function CheckoutPage() {
  const { items: localItems, total, count, isLoading, clear: clearCart } = useCart();

  // Convert localStorage items to CartResponse format
  const cart: CartResponse = useMemo(() => {
    const detailed: DetailedItem[] = localItems.map(item => ({
      productId: item.productId,
      qty: item.quantity,
      product: {
        id: item.productId,
        title: item.productName,
        price: item.price,
        oldPrice: null,
        brand: undefined,
        category: undefined,
        cover: item.imageUrl || null,
        inStock: true,
      },
    }));

    return {
      detailed,
      subtotal: total,
      count,
    };
  }, [localItems, total, count]);

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="animate-pulse grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 space-y-4">
            <div className="h-40 bg-neutral-100 rounded-2xl" />
            <div className="h-40 bg-neutral-100 rounded-2xl" />
            <div className="h-40 bg-neutral-100 rounded-2xl" />
          </div>
          <div className="lg:col-span-2 h-72 bg-neutral-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (cart.count === 0) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="rounded-2xl border p-6 bg-white text-center">
          <p className="text-gray-600 font-medium">Giỏ hàng trống</p>
          <div className="mt-3 text-sm">
            <Link href="/products" className="underline">Tiếp tục mua sắm</Link>
          </div>
        </div>
      </main>
    );
  }

  return <CheckoutClient cart={cart} clearCart={clearCart} />;
}

// -----------------------------
// Checkout Client Component
// -----------------------------

function CheckoutClient({ cart, clearCart }: { cart: CartResponse; clearCart: () => void }) {
  const { data: session } = useSession();
  const items = (cart.detailed || []) as DetailedItem[];
  const subtotal = Number(cart.subtotal || 0);

  const [address, setAddress] = useState<Address>({
    firstName: "",
    lastName: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    postalCode: "",
    phone: "",
    email: cart.email || "",
  });
  const [shipping, setShipping] = useState<ShippingId>("bundle");
  const [payment, setPayment] = useState<PaymentMethod>("qr");
  const [promo, setPromo] = useState("");
  const [placing, setPlacing] = useState(false);
  const [voucherCode, setVoucherCode] = useState("");
  const [discount, setDiscount] = useState(0);

  // Load applied voucher from localStorage (from cart page)
  useEffect(() => {
    try {
      const savedVoucher = localStorage.getItem('appliedVoucher');
      if (savedVoucher) {
        const { code, discount: savedDiscount } = JSON.parse(savedVoucher);
        if (code && savedDiscount > 0) {
          setPromo(code);
          setVoucherCode(code);
          setDiscount(savedDiscount);
        }
      }
    } catch (error) {
      console.error('Error loading voucher from localStorage:', error);
    }
  }, []);

  const qualifiesFreeShip = subtotal >= FREE_SHIP_THRESHOLD;

  // ✅ TÍNH PHÍ SHIP THEO NGƯỠNG
  const shippingCost = useMemo(() => {
    if (items.length === 0) return 0;
    if (shipping === "expedited") return EXPEDITED_FEE;
    // standard / bundle
    return qualifiesFreeShip ? 0 : BASE_SHIPPING_FEE;
  }, [shipping, qualifiesFreeShip, items.length]);

  const tax = useMemo(() => Math.round(subtotal * 0.1), [subtotal]);
  const total = subtotal + tax + shippingCost - discount;

  const addressValid = Boolean(address.firstName && address.lastName && address.address1 && address.city && address.phone && address.email);

  const router = useRouter();
  const [paymentQRCode, setPaymentQRCode] = useState<string | null>(null);
  const [paymentOrderCode, setPaymentOrderCode] = useState<number | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [orderNumberState, setOrderNumberState] = useState<any>('');
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);

  async function placeOrder() {
    if (!addressValid) { alert("Vui lòng điền đủ thông tin giao hàng."); return; }
    if (items.length === 0) { alert("Giỏ hàng trống."); return; }

    setPlacing(true);
    try {
      // Prepare order data
      const orderData = {
        // Customer info (guest or logged in)
        email: address.email,
        fullName: `${address.firstName} ${address.lastName}`,
        phone: address.phone,

        // Shipping address
        shippingAddress: {
          firstName: address.firstName,
          lastName: address.lastName,
          address1: address.address1,
          address2: address.address2 || '',
          city: address.city,
          state: address.state || '',
          postalCode: address.postalCode || '',
          phone: address.phone,
        },

        // Order details
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.qty,
          price: item.product.price,
          title: item.product.title,
        })),

        subtotal,
        shippingCost,
        tax,
        total,

        // Voucher info
        voucherCode: voucherCode || undefined,
        discount: discount || 0,

        // Shipping & payment method
        shippingMethod: shipping,
        paymentMethod: payment,

        // Cart IDs (if available)
        cartId: cart.id ?? null,
        anonId: cart.anonId ?? (document.cookie.match(/(?:^|; )anonId=([^;]+)/)?.[1] || null),
      };

      // Call Next.js API proxy to avoid CORS issues
      // Use different endpoint based on authentication status
      const checkoutEndpoint = session?.user ? '/api/checkout-auth' : '/api/checkout';

      const response = await fetch(checkoutEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });


      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Đặt hàng thất bại' }));
        console.error('❌ Checkout error:', error);
        throw new Error(error.error || error.message || 'Đặt hàng thất bại');
      }

      const data = await response.json() as { orderId?: string; id?: string; orderNumber?: string };
      const orderNumber = data?.orderNumber || data?.orderId || data?.id || "";
      setOrderNumberState(data.id || '');
      // If payment method is QR, create payment link
      if (payment === "qr") {
        const paymentResponse = await fetch('/api/payment/create-payment-link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderCode: orderNumber,
            amount: total,
            description: `#${orderNumber}`,
            buyerName: `${address.firstName} ${address.lastName}`,
            buyerEmail: address.email,
            buyerPhone: address.phone,
            buyerAddress: `${address.address1}, ${address.city}`,
          }),
        });

        if (!paymentResponse.ok) {
          throw new Error('Không thể tạo mã QR thanh toán');
        }

        const paymentData = await paymentResponse.json();

        if (paymentData.success && paymentData.data) {
          // Show QR code modal
          setPaymentQRCode(paymentData.data.qrCode);
          setPaymentOrderCode(paymentData.data.orderCode);
          setShowQRModal(true);

          // DON'T clear cart yet - wait until modal is closed or payment is successful
          // Cart will be cleared when modal closes or payment succeeds
          localStorage.removeItem('appliedVoucher');

          // Don't redirect yet - let user scan QR first
          return;
        }
      }

      // For COD payment, proceed normally
      clearCart();
      localStorage.removeItem('appliedVoucher');

      // Redirect to thank you page
      const url = `/thank-you?method=${payment}&order=${encodeURIComponent(orderNumberState)}`;
      router.replace(url);
    } catch (e: any) {
      console.error("Checkout error", e);
      alert(e.message || "Có lỗi khi đặt hàng. Vui lòng thử lại.");
    } finally {
      setPlacing(false);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Progress bar */}
      <div className="border-b bg-white sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-2 text-sm text-neutral-600">
          <span className="font-medium">Cart</span>
          <span>→</span>
          <span className="font-medium">Shipping</span>
          <span>→</span>
          <span className="font-semibold text-neutral-900">Payment</span>
        </div>
      </div>

      {/* Main */}
      <div className="max-w-6xl mx-auto px-4 lg:px-6 py-6 lg:py-10 grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left column */}
        <div className="lg:col-span-3 space-y-6">
          {/* Free shipping banner nhỏ */}
          <FreeShipMiniBanner subtotal={subtotal} />

          <Section title="Địa chỉ giao hàng" icon={<Truck className="w-4 h-4" />}>
            <AddressForm value={address} onChange={setAddress} />
          </Section>

          <Section title="Phương thức vận chuyển" icon={<PackageCheck className="w-4 h-4" />}>
            <ShippingOptions
              subtotal={subtotal}
              value={shipping}
              onChange={setShipping}
            />
          </Section>

          <Section title="Phương thức thanh toán" icon={<CreditCard className="w-4 h-4" />}>
            <PaymentMethods value={payment} onChange={setPayment} />
            <PaymentDetails payment={payment} total={total} />
          </Section>

          <TrustBlocks />
        </div>

        {/* Right column */}
        <div className="lg:col-span-2">
          <OrderSummary
            items={items}
            subtotal={subtotal}
            tax={tax}
            shipping={shippingCost}
            total={total}
            promo={promo}
            onChangePromo={setPromo}
            onPlaceOrder={placeOrder}
            placing={placing}
            discount={discount}
            onVoucherChange={(code, amount) => {
              setVoucherCode(code);
              setDiscount(amount);
            }}
          />
        </div>
      </div>

      {/* QR Payment Modal */}
      {showQRModal && paymentQRCode && (
        <QRPaymentModal
          qrCode={paymentQRCode}
          orderCode={paymentOrderCode}
          total={total}
          onClose={(isSuccess = false) => {
            setShowQRModal(false);

            if (isSuccess) {
              // Show success notification
              setShowSuccessNotification(true);

              // Clear cart and redirect after showing notification
              setTimeout(() => {
                clearCart();
                setShowSuccessNotification(false);
                router.push(`/thank-you?method=${payment}&order=${encodeURIComponent(orderNumberState)}`);
              }, 2000);
            } else {
              // User closed manually - just clear cart and redirect
              clearCart();
              router.push(`/thank-you?method=${payment}&order=${encodeURIComponent(orderNumberState)}`);
            }
          }}
        />
      )}

      {/* Success Notification */}
      {showSuccessNotification && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center"
          >
            <div className="mb-4">
              <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-2 text-green-600">Thanh toán thành công!</h3>
            <p className="text-neutral-600">
              Đơn hàng của bạn đã được xác nhận. Đang chuyển hướng...
            </p>
          </motion.div>
        </div>
      )}
    </div>
  );
}

// -----------------------------
// UI Blocks
// -----------------------------

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="bg-white rounded-2xl shadow-sm border p-4 lg:p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h2 className="text-base lg:text-lg font-semibold">{title}</h2>
      </div>
      {children}
    </motion.section>
  );
}

function FreeShipMiniBanner({ subtotal }: { subtotal: number }) {
  const progress = Math.min(subtotal / FREE_SHIP_THRESHOLD, 1);
  const remain = Math.max(FREE_SHIP_THRESHOLD - subtotal, 0);
  return (
    <div className="rounded-2xl border bg-white p-4">
      {progress < 1 ? (
        <>
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Miễn phí vận chuyển</span>
            <span className="tabular-nums">{formatVND(remain)} nữa là được</span>
          </div>
          <div className="mt-2 h-2 w-full rounded-full bg-gray-100">
            <div
              className="h-2 rounded-full bg-black transition-all"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </>
      ) : (
        <div className="text-sm font-medium text-emerald-700">
          Tuyệt! Đơn hàng đủ điều kiện miễn phí vận chuyển 🎉
        </div>
      )}
    </div>
  );
}

function AddressForm({ value, onChange }: { value: Address; onChange: (a: Address) => void }) {
  const set = (k: keyof Address) => (e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...value, [k]: e.target.value });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <Input label="First name" value={value.firstName} onChange={set("firstName")} required />
      <Input label="Last name" value={value.lastName} onChange={set("lastName")} required />
      <Input className="md:col-span-2" label="Address line 1" value={value.address1} onChange={set("address1")} required />
      <Input className="md:col-span-2" label="Address line 2 (optional)" value={value.address2 || ""} onChange={set("address2")} />

      {/* Address Select Component */}
      <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-3">
        <AddressSelect
          provinceValue={value.city}
          districtValue={value.state || ""}
          wardValue={value.postalCode || ""}
          onProvinceChange={(name) => onChange({ ...value, city: name })}
          onDistrictChange={(name) => onChange({ ...value, state: name })}
          onWardChange={(name) => onChange({ ...value, postalCode: name })}
          required
        />
      </div>

      <Input label="Phone" value={value.phone} onChange={set("phone")} required />
      <Input label="Email" value={value.email} onChange={set("email")} type="email" required />
    </div>
  );
}

function ShippingOptions({
  subtotal,
  value,
  onChange,
}: {
  subtotal: number;
  value: ShippingId;
  onChange: (v: ShippingId) => void;
}) {
  const qualifies = subtotal >= FREE_SHIP_THRESHOLD;

  const priceOf = (id: ShippingId) => {
    if (id === "expedited") return EXPEDITED_FEE;
    return qualifies ? 0 : BASE_SHIPPING_FEE;
  };

  return (
    <div className="grid gap-3">
      {SHIPPING_OPTIONS.map((opt) => {
        const price = priceOf(opt.id as ShippingId);
        const priceText =
          opt.id === "expedited"
            ? formatVND(price)
            : qualifies
              ? "Miễn phí (đạt 500.000₫)"
              : formatVND(price);

        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id as ShippingId)}
            className={classNames(
              "text-left rounded-xl border p-4 hover:bg-neutral-50 transition",
              value === opt.id ? "border-neutral-800 ring-2 ring-neutral-800/10" : "border-neutral-200"
            )}
            aria-pressed={value === opt.id}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{opt.label}</div>
                <div className="text-sm text-neutral-600">Dự kiến: {opt.eta}</div>
              </div>
              <div className="text-sm font-semibold">{priceText}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function PaymentMethods({ value, onChange }: { value: PaymentMethod; onChange: (v: PaymentMethod) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <button
        type="button"
        onClick={() => onChange("qr")}
        className={classNames(
          "rounded-xl border p-4 flex items-center justify-center gap-2 hover:bg-neutral-50",
          value === "qr" ? "border-neutral-900 ring-2 ring-neutral-900/10" : "border-neutral-200"
        )}
        aria-pressed={value === "qr"}
      >
        <QrCode className="w-5 h-5" />
        <span className="font-medium">QR Code</span>
      </button>
      <button
        type="button"
        onClick={() => onChange("cod")}
        className={classNames(
          "rounded-xl border p-4 flex items-center justify-center gap-2 hover:bg-neutral-50",
          value === "cod" ? "border-neutral-900 ring-2 ring-neutral-900/10" : "border-neutral-200"
        )}
        aria-pressed={value === "cod"}
      >
        <WalletMinimal className="w-5 h-5" />
        <span className="font-medium">COD</span>
      </button>
    </div>
  );
}

function PaymentDetails({ payment, total }: { payment: PaymentMethod; total: number }) {
  if (payment === "qr") {
    return null;
  }
  return (
    <div className="mt-4 text-sm text-neutral-700">
      Thanh toán khi nhận hàng (COD). Vui lòng chuẩn bị đúng số tiền khi giao.
    </div>
  );
}

function OrderSummary({
  items,
  subtotal,
  tax,
  shipping,
  total,
  promo,
  onChangePromo,
  onPlaceOrder,
  placing,
  discount,
  onVoucherChange,
}: {
  items: DetailedItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  promo: string;
  onChangePromo: (v: string) => void;
  onPlaceOrder: () => void;
  placing: boolean;
  discount?: number;
  onVoucherChange?: (voucherCode: string, discountAmount: number) => void;
}) {
  const { data: session } = useSession();
  const [appliedCode, setAppliedCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [validationSuccess, setValidationSuccess] = useState('');

  // Sync appliedCode with promo when component mounts (from localStorage)
  useEffect(() => {
    if (promo && discount && discount > 0) {
      setAppliedCode(promo);
      setValidationSuccess('Mã giảm giá đã được áp dụng');
    }
  }, []);

  const handleApplyVoucher = async () => {
    if (!promo.trim()) return;

    setIsValidating(true);
    setValidationError('');
    setValidationSuccess('');

    try {
      const response = await fetch('/api/vouchers/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: promo.trim(),
          orderValue: subtotal,
          clientUserId: session?.user?.id,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.valid) {
        setValidationError(data.message || 'Mã voucher không hợp lệ');
        setAppliedCode('');
        onVoucherChange?.('', 0);
        return;
      }

      setAppliedCode(promo.trim());
      setValidationSuccess(data.message || 'Áp dụng mã thành công!');
      onVoucherChange?.(promo.trim(), data.discountAmount);

      // Save to localStorage
      localStorage.setItem('appliedVoucher', JSON.stringify({
        code: promo.trim(),
        discount: data.discountAmount
      }));
    } catch (err: any) {
      setValidationError(err.message || 'Có lỗi xảy ra');
      setAppliedCode('');
      onVoucherChange?.('', 0);
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedCode('');
    onChangePromo('');
    setValidationError('');
    setValidationSuccess('');
    onVoucherChange?.('', 0);

    // Remove from localStorage
    localStorage.removeItem('appliedVoucher');
  };
  return (
    <aside className="lg:sticky lg:top-20">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-sm border p-4 lg:p-6">
        <h3 className="text-lg font-semibold mb-4">Đơn hàng</h3>

        {/* Items */}
        <div className="space-y-3 mb-4 max-h-64 overflow-auto pr-1">
          {items.map(({ product, qty }) => (
            <div key={product.id} className="flex items-center gap-3">
              <img
                src={product.cover || "/assets/images/main/product1.jpg"}
                alt={product.title}
                className="h-20 w-16 rounded-md object-cover bg-gray-100 border"
              />
              <div className="flex-1 overflow-hidden">
                <div className="text-sm font-medium line-clamp-1">{product.title}</div>
                <div className="text-xs text-neutral-600">Qty: {qty}</div>
              </div>
              <div className="text-sm font-semibold">{formatVND(product.price * qty)}</div>
            </div>
          ))}
          {items.length === 0 && <div className="text-sm text-neutral-500">Giỏ hàng trống</div>}
        </div>

        {/* Promo */}
        <div className="mb-4">
          <div className="flex gap-2">
            <input
              value={promo}
              onChange={(e) => onChangePromo(e.target.value)}
              placeholder="Mã khuyến mãi"
              disabled={!!appliedCode || isValidating}
              className="flex-1 rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/10 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            {appliedCode ? (
              <button
                type="button"
                onClick={handleRemoveVoucher}
                className="rounded-lg border bg-red-50 border-red-300 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
              >
                Xóa
              </button>
            ) : (
              <button
                type="button"
                onClick={handleApplyVoucher}
                disabled={!promo.trim() || isValidating}
                className="rounded-lg border bg-black text-white px-3 py-2 text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isValidating ? 'Đang kiểm tra...' : 'Áp dụng'}
              </button>
            )}
          </div>

          {validationError && (
            <p className="mt-1 text-xs text-red-600">❌ {validationError}</p>
          )}

          {validationSuccess && !validationError && (
            <p className="mt-1 text-xs text-green-600">✅ {validationSuccess}</p>
          )}
        </div>

        {/* Totals */}
        <div className="space-y-2 text-sm">
          <Row label="Tạm tính" value={formatVND(subtotal)} />
          <Row label="Vận chuyển" value={shipping === 0 ? "Miễn phí" : formatVND(shipping)} />
          <Row label="Thuế (ước tính)" value={formatVND(tax)} />
          {discount && discount > 0 && (
            <Row
              label={<span className="text-green-600 font-medium">Giảm giá ({appliedCode})</span>}
              value={<span className="text-green-600">-{formatVND(discount)}</span>}
            />
          )}
          <div className="h-px bg-neutral-200 my-2" />
          <Row label={<span className="font-semibold text-base">Tổng cộng</span>} value={<span className="font-bold text-base">{formatVND(total)}</span>} />
        </div>

        <button
          onClick={onPlaceOrder}
          disabled={placing}
          className="w-full mt-5 inline-flex items-center justify-center rounded-2xl px-4 py-3 font-semibold bg-neutral-900 text-white hover:bg-neutral-800 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {placing ? "Đang xử lý…" : "Đặt hàng"}
        </button>

        <p className="mt-3 text-[12px] text-neutral-500 text-center">
          Bằng việc đặt hàng, bạn đồng ý với <a className="underline" href="#">Điều khoản</a> và <a className="underline" href="#">Chính sách bảo mật</a>.
        </p>
      </motion.div>
    </aside>
  );
}

function Row({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-neutral-600">{label}</div>
      <div>{value}</div>
    </div>
  );
}

function Input({ label, className, required, ...rest }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className={classNames("grid gap-1 text-sm", className)}>
      <span className="text-neutral-700">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      <input
        {...rest}
        className="rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
      />
    </label>
  );
}

function TrustBlocks() {
  const items = [
    { icon: <ShieldCheck className="w-4 h-4" />, title: "Thanh toán an toàn", desc: "Mã hoá SSL • Bảo vệ dữ liệu" },
    { icon: <Truck className="w-4 h-4" />, title: "Giao nhanh, dễ đổi trả", desc: "Đổi trả trong 14 ngày" },
    { icon: <PackageCheck className="w-4 h-4" />, title: "Hàng chuẩn 100%", desc: "Kiểm định & mô tả đúng tình trạng" },
  ];
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {items.map((it, i) => (
        <div key={i} className="rounded-2xl border bg-white p-4 flex items-start gap-3">
          <div className="rounded-xl bg-neutral-100 p-2">{it.icon}</div>
          <div>
            <div className="text-sm font-semibold">{it.title}</div>
            <div className="text-xs text-neutral-600">{it.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function QRPaymentModal({
  qrCode,
  orderCode,
  total,
  onClose
}: {
  qrCode: string;
  orderCode: number | null;
  total: number;
  onClose: (isSuccess?: boolean) => void;
}) {
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'success' | 'failed'>('pending');
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string>('');
  const [showConfirmClose, setShowConfirmClose] = useState(false);

  // Generate QR code image from EMVCo string
  useEffect(() => {
    const generateQRCode = async () => {
      try {
        // Convert EMVCo string to QR code image (Data URL)
        const dataURL = await QRCodeLib.toDataURL(qrCode, {
          width: 150,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        });
        setQrCodeDataURL(dataURL);
      } catch (error) {
        console.error('Error generating QR code:', error);
      }
    };

    if (qrCode) {
      generateQRCode();
    }
  }, [qrCode]);

  // Poll payment status every 3 seconds
  useEffect(() => {
    if (!orderCode) return;

    const checkPaymentStatus = async () => {
      try {
        const response = await fetch(`/api/payment/status/${orderCode}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          },
        });
        const data = await response.json();

        if (data.success && data.data) {
          const status = data.data.status;
          if (status === 'PAID') {
            setPaymentStatus('success');
            // Wait 1 second to show success state in modal, then close and show notification
            setTimeout(() => {
              onClose(true); // Pass true to indicate successful payment
            }, 1000);
          } else if (status === 'CANCELLED' || status === 'EXPIRED') {
            setPaymentStatus('failed');
          }
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
      } finally {
      }
    };

    const interval = setInterval(checkPaymentStatus, 3000);
    return () => clearInterval(interval);
  }, [orderCode, onClose]);

  // Handle close button click
  const handleCloseClick = () => {
    if (paymentStatus === 'pending') {
      // Show confirmation dialog if payment is still pending
      setShowConfirmClose(true);
    } else if (paymentStatus === 'success') {
      // If already successful, close with success flag
      onClose(true);
    } else {
      // Close directly if failed
      onClose(false);
    }
  };

  // Confirm close without payment
  const confirmClose = () => {
    setShowConfirmClose(false);
    onClose(false);
  };

  // Cancel close confirmation
  const cancelClose = () => {
    setShowConfirmClose(false);
  };

  return (
    <>
      {/* Main QR Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-2xl"
        >
          <div className="text-center">
            <div className="mb-4">
              <QrCode className="w-12 h-12 mx-auto text-neutral-900" />
            </div>

            <h2 className="text-2xl font-bold mb-2">Quét mã QR để thanh toán</h2>
            <p className="text-neutral-600 mb-6">
              Sử dụng ứng dụng ngân hàng để quét mã QR bên dưới
            </p>

            {/* QR Code */}
            <div className="bg-white border-2 border-neutral-200 rounded-xl p-4 mb-6 flex justify-center">
              {qrCodeDataURL ? (
                <img
                  src={qrCodeDataURL}
                  alt="QR Code thanh toán"
                  className="w-64 h-auto"
                />
              ) : (
                <div className="w-64 h-64 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-neutral-300 border-t-neutral-900"></div>
                </div>
              )}
            </div>

            {/* Payment Info */}
            <div className="bg-neutral-50 rounded-xl p-4 mb-6 text-left">
              <div className="flex justify-between mb-2">
                <span className="text-neutral-600">Số tiền:</span>
                <span className="font-bold text-lg">{formatVND(total)}</span>
              </div>
              {orderCode && (
                <div className="flex justify-between">
                  <span className="text-neutral-600">Mã đơn hàng:</span>
                  <span className="font-mono text-sm">{orderCode}</span>
                </div>
              )}
            </div>

            {/* Status */}
            {paymentStatus === 'pending' && (
              <div className="flex items-center justify-center gap-2 text-neutral-600 mb-4">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-neutral-300 border-t-neutral-900"></div>
                <span className="text-sm">Đang chờ thanh toán...</span>
              </div>
            )}

            {paymentStatus === 'success' && (
              <div className="flex items-center justify-center gap-2 text-green-600 font-semibold mb-4">
                <span>✅ Thanh toán thành công!</span>
              </div>
            )}

            {paymentStatus === 'failed' && (
              <div className="text-red-600 font-semibold mb-4">
                ❌ Thanh toán thất bại
              </div>
            )}

            {/* Instructions */}
            <div className="text-left text-sm text-neutral-600 mb-6">
              <p className="font-semibold mb-2">Hướng dẫn:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Mở ứng dụng ngân hàng trên điện thoại</li>
                <li>Chọn chức năng quét mã QR</li>
                <li>Quét mã QR phía trên</li>
                <li>Xác nhận thanh toán</li>
              </ol>
            </div>

            {/* Close button */}
            <button
              onClick={handleCloseClick}
              className="w-full rounded-xl bg-neutral-900 text-white py-3 font-semibold hover:bg-neutral-800 transition"
            >
              Đóng
            </button>
          </div>
        </motion.div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmClose && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
          >
            <div className="text-center">
              <div className="mb-4">
                <div className="w-16 h-16 mx-auto bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-3xl">⚠️</span>
                </div>
              </div>

              <h3 className="text-xl font-bold mb-2">Chưa hoàn tất thanh toán</h3>
              <p className="text-neutral-600 mb-6">
                Bạn chưa hoàn tất thanh toán. Nếu đóng cửa sổ này, đơn hàng sẽ vẫn được lưu nhưng chưa được xác nhận.
              </p>

              <div className="space-y-3">
                <button
                  onClick={cancelClose}
                  className="w-full rounded-xl bg-neutral-900 text-white py-3 font-semibold hover:bg-neutral-800 transition"
                >
                  Tiếp tục thanh toán
                </button>
                <button
                  onClick={confirmClose}
                  className="w-full rounded-xl border-2 border-neutral-200 bg-white text-neutral-900 py-3 font-semibold hover:bg-neutral-50 transition"
                >
                  Đóng và thanh toán sau
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}
