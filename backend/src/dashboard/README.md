# Dashboard API Module

Module này cung cấp các API endpoints để lấy thống kê và phân tích dữ liệu cho trang dashboard admin.

## Endpoints

### 1. GET /dashboard/stats
Lấy tổng quan thống kê dashboard

**Authentication:** Required (Admin level)

**Response:**
```json
{
  "totalRevenue": 10000000,
  "totalOrders": 150,
  "totalProducts": 50,
  "totalCategories": 10,
  "totalUsers": 5,
  "totalClientUsers": 100,
  "totalFiles": 200,
  "totalVouchers": 20,
  "activeOrders": 30,
  "pendingOrders": 15,
  "completedOrders": 100,
  "cancelledOrders": 5,
  "lowStockProducts": 8,
  "outOfStockProducts": 3,
  "activeVouchers": 15,
  "expiredVouchers": 5
}
```

### 2. GET /dashboard/revenue
Lấy dữ liệu doanh thu theo ngày cho biểu đồ

**Authentication:** Required (Admin level)

**Query Parameters:**
- `startDate` (optional): Ngày bắt đầu (YYYY-MM-DD)
- `endDate` (optional): Ngày kết thúc (YYYY-MM-DD)
- `period` (optional): Khoảng thời gian (7d, 30d, 90d) - sử dụng nếu không có startDate/endDate

**Response:**
```json
[
  {
    "date": "2024-01-01",
    "revenue": 500000,
    "orders": 10
  },
  {
    "date": "2024-01-02",
    "revenue": 750000,
    "orders": 15
  }
]
```

### 3. GET /dashboard/order-status
Lấy phân bố trạng thái đơn hàng

**Authentication:** Required (Admin level)

**Response:**
```json
[
  {
    "status": "PENDING",
    "count": 15,
    "percentage": 10.0
  },
  {
    "status": "DELIVERED",
    "count": 100,
    "percentage": 66.67
  },
  {
    "status": "CANCELLED",
    "count": 5,
    "percentage": 3.33
  }
]
```

## Frontend Integration

Frontend đã có sẵn API client tại `frontend/app/lib/api/dashboard.ts`:

```typescript
import { dashboardApi } from '~/lib/api'

// Lấy thống kê
const { data, error } = await dashboardApi.getStats()

// Lấy dữ liệu doanh thu
const { data, error } = await dashboardApi.getRevenue({ period: '30d' })

// Lấy phân bố trạng thái đơn hàng
const { data, error } = await dashboardApi.getOrderStatus()
```

Trang dashboard đã được implement tại `frontend/app/pages/(private)/dashboard/index.vue`.

## Cấu trúc Module

```
dashboard/
├── dashboard.module.ts          # Module definition
├── dashboard.controller.ts      # API endpoints
├── dashboard.service.ts         # Business logic
├── dto/
│   └── dashboard-stats.dto.ts  # Data transfer objects
└── README.md                    # Documentation
```

## Dependencies

Module này sử dụng các entities sau:
- Order
- Product
- ProductVariant
- Category
- User
- ClientUser
- File
- Voucher

## Testing

Để test các endpoints, bạn có thể:

1. Sử dụng Swagger UI tại `http://localhost:3001/api`
2. Sử dụng curl:

```bash
# Login để lấy token
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'

# Lấy dashboard stats
curl -X GET http://localhost:3001/dashboard/stats \
  -H "Authorization: Bearer YOUR_TOKEN"

# Lấy revenue data
curl -X GET "http://localhost:3001/dashboard/revenue?period=30d" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Lấy order status
curl -X GET http://localhost:3001/dashboard/order-status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Notes

- Tất cả endpoints yêu cầu authentication với JWT token
- User phải có level >= ADMIN (50) để truy cập
- Dữ liệu revenue chỉ tính từ các đơn hàng có status = DELIVERED
- Ngày được format theo chuẩn ISO (YYYY-MM-DD)

