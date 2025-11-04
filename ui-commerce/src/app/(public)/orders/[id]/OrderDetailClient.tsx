'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { ArrowLeft, Package, MapPin, CreditCard, Loader2, AlertCircle, Truck, CheckCircle } from 'lucide-react';

interface OrderItem {
  productId: string;
  variantId: string;
  productName: string;
  variantName?: string;
  quantity: number;
  price: number;
  imageUrl?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPING' | 'DELIVERED' | 'CANCELLED';
  paymentMethod: 'COD' | 'BANK_TRANSFER' | 'CREDIT_CARD' | 'E_WALLET';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  shippingAddress: {
    fullName: string;
    phone: string;
    address: string;
    city: string;
    district?: string;
    ward?: string;
  };
  customerEmail: string;
  customerPhone: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  CONFIRMED: 'bg-blue-100 text-blue-800 border-blue-200',
  PROCESSING: 'bg-purple-100 text-purple-800 border-purple-200',
  SHIPPING: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  DELIVERED: 'bg-green-100 text-green-800 border-green-200',
  CANCELLED: 'bg-red-100 text-red-800 border-red-200',
};

const statusLabels = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  PROCESSING: 'Đang xử lý',
  SHIPPING: 'Đang giao',
  DELIVERED: 'Đã giao',
  CANCELLED: 'Đã hủy',
};

const paymentStatusLabels = {
  PENDING: 'Chưa thanh toán',
  PAID: 'Đã thanh toán',
  FAILED: 'Thanh toán thất bại',
  REFUNDED: 'Đã hoàn tiền',
};

const paymentMethodLabels = {
  COD: 'Thanh toán khi nhận hàng',
  BANK_TRANSFER: 'Chuyển khoản ngân hàng',
  CREDIT_CARD: 'Thẻ tín dụng',
  E_WALLET: 'Ví điện tử',
};

const statusSteps = [
  { key: 'PENDING', label: 'Chờ xác nhận', icon: Package },
  { key: 'CONFIRMED', label: 'Đã xác nhận', icon: CheckCircle },
  { key: 'PROCESSING', label: 'Đang xử lý', icon: Package },
  { key: 'SHIPPING', label: 'Đang giao', icon: Truck },
  { key: 'DELIVERED', label: 'Đã giao', icon: CheckCircle },
];

export default function OrderDetailClient({ orderId }: { orderId: string }) {
  const { data: session } = useSession();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError(null);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const accessToken = (session?.user as any)?.accessToken;

      const response = await fetch(`${apiUrl}/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch order');
      }

      const data = await response.json();
      setOrder(data);
    } catch (err) {
      console.error('Error fetching order:', err);
      setError('Không thể tải thông tin đơn hàng. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusIndex = (status: string) => {
    return statusSteps.findIndex(step => step.key === status);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            <span className="ml-3 text-gray-600">Đang tải thông tin đơn hàng...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <Link
            href="/orders"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại danh sách đơn hàng
          </Link>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-start">
            <AlertCircle className="w-6 h-6 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-red-800 font-semibold mb-1">Có lỗi xảy ra</h3>
              <p className="text-red-700">{error || 'Không tìm thấy đơn hàng'}</p>
              <button
                onClick={fetchOrder}
                className="mt-3 text-red-600 hover:text-red-800 font-medium underline"
              >
                Thử lại
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentStatusIndex = getStatusIndex(order.status);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Back Button */}
        <Link
          href="/orders"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại danh sách đơn hàng
        </Link>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                Đơn hàng #{order.orderNumber}
              </h1>
              <p className="text-gray-600">
                Đặt ngày {formatDate(order.createdAt)}
              </p>
            </div>
            <span
              className={`px-4 py-2 rounded-full text-sm font-medium border ${
                statusColors[order.status]
              }`}
            >
              {statusLabels[order.status]}
            </span>
          </div>

          {/* Order Status Timeline */}
          {order.status !== 'CANCELLED' && (
            <div className="relative">
              <div className="flex items-center justify-between">
                {statusSteps.map((step, index) => {
                  const Icon = step.icon;
                  const isCompleted = index <= currentStatusIndex;
                  const isCurrent = index === currentStatusIndex;

                  return (
                    <div key={step.key} className="flex-1 relative">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                            isCompleted
                              ? 'bg-green-500 border-green-500 text-white'
                              : 'bg-white border-gray-300 text-gray-400'
                          } ${isCurrent ? 'ring-4 ring-green-100' : ''}`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <p
                          className={`mt-2 text-xs text-center ${
                            isCompleted ? 'text-gray-900 font-medium' : 'text-gray-500'
                          }`}
                        >
                          {step.label}
                        </p>
                      </div>
                      {index < statusSteps.length - 1 && (
                        <div
                          className={`absolute top-5 left-1/2 w-full h-0.5 ${
                            index < currentStatusIndex ? 'bg-green-500' : 'bg-gray-300'
                          }`}
                          style={{ transform: 'translateY(-50%)' }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Sản phẩm</h2>
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 pb-4 border-b border-gray-200 last:border-0 last:pb-0"
                  >
                    {item.imageUrl && (
                      <img
                        src={item.imageUrl}
                        alt={item.productName}
                        className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">{item.productName}</p>
                      {item.variantName && (
                        <p className="text-sm text-gray-600 mt-1">{item.variantName}</p>
                      )}
                      <p className="text-sm text-gray-600 mt-1">Số lượng: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{formatPrice(item.price)}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            {order.notes && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Ghi chú</h2>
                <p className="text-gray-700">{order.notes}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Tổng quan đơn hàng</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-gray-700">
                  <span>Tạm tính</span>
                  <span>{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Phí vận chuyển</span>
                  <span>{formatPrice(order.shipping)}</span>
                </div>
                {order.tax > 0 && (
                  <div className="flex justify-between text-gray-700">
                    <span>Thuế</span>
                    <span>{formatPrice(order.tax)}</span>
                  </div>
                )}
                {order.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Giảm giá</span>
                    <span>-{formatPrice(order.discount)}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between text-lg font-bold text-gray-900">
                    <span>Tổng cộng</span>
                    <span>{formatPrice(order.total)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Info */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <CreditCard className="w-5 h-5 mr-2" />
                Thanh toán
              </h2>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-gray-600">Phương thức</p>
                  <p className="font-medium text-gray-900">
                    {paymentMethodLabels[order.paymentMethod]}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Trạng thái</p>
                  <p className="font-medium text-gray-900">
                    {paymentStatusLabels[order.paymentStatus]}
                  </p>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                Địa chỉ giao hàng
              </h2>
              <div className="space-y-1 text-gray-700">
                <p className="font-medium text-gray-900">{order.shippingAddress.fullName}</p>
                <p>{order.shippingAddress.phone}</p>
                <p>{order.shippingAddress.address}</p>
                {order.shippingAddress.ward && <p>{order.shippingAddress.ward}</p>}
                {order.shippingAddress.district && <p>{order.shippingAddress.district}</p>}
                <p>{order.shippingAddress.city}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

