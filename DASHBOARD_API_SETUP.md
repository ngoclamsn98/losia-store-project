# Dashboard API - Hướng Dẫn Cài Đặt và Sử Dụng

## Tổng Quan

Dashboard API đã được tạo thành công với các endpoints sau:
- `GET /dashboard/stats` - Lấy thống kê tổng quan
- `GET /dashboard/revenue` - Lấy dữ liệu doanh thu theo ngày
- `GET /dashboard/order-status` - Lấy phân bố trạng thái đơn hàng

## Files Đã Tạo

### Backend
```
backend/src/dashboard/
├── dashboard.module.ts          # Module chính
├── dashboard.controller.ts      # API endpoints
├── dashboard.service.ts         # Business logic
├── dto/
│   └── dashboard-stats.dto.ts  # DTOs cho request/response
└── README.md                    # Documentation chi tiết
```

### Cập Nhật
- `backend/src/app.module.ts` - Đã import DashboardModule
- `backend/src/main.ts` - Đã thêm tag 'dashboard' vào Swagger

## Vấn Đề Node.js Version

⚠️ **QUAN TRỌNG**: Hiện tại bạn đang sử dụng Node.js v16.13.2, nhưng project yêu cầu Node.js >= 16.17.0 để hỗ trợ `crypto.randomUUID()`.

### Giải Pháp

#### Option 1: Nâng cấp Node.js (Khuyến nghị)

```bash
# Sử dụng nvm để cài đặt Node.js mới hơn
nvm install 18
nvm use 18

# Hoặc cài đặt Node.js 20 LTS
nvm install 20
nvm use 20

# Sau đó cài lại dependencies
cd backend
rm -rf node_modules package-lock.json
npm install
```

#### Option 2: Sử dụng Docker

```bash
# Tạo Dockerfile trong thư mục backend
cd backend
docker build -t losia-backend .
docker run -p 3001:3001 losia-backend
```

## Cách Chạy Backend

Sau khi đã nâng cấp Node.js:

```bash
cd backend

# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

Server sẽ chạy tại `http://localhost:3001`

## Kiểm Tra API

### 1. Sử dụng Swagger UI
Truy cập: `http://localhost:3001/api`

### 2. Sử dụng curl

```bash
# 1. Login để lấy JWT token
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "your_password"
  }'

# Response sẽ chứa access_token
# Lưu token này để sử dụng cho các request tiếp theo

# 2. Lấy dashboard statistics
curl -X GET http://localhost:3001/dashboard/stats \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# 3. Lấy revenue data (30 ngày gần nhất)
curl -X GET "http://localhost:3001/dashboard/revenue?period=30d" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# 4. Lấy revenue data với khoảng thời gian cụ thể
curl -X GET "http://localhost:3001/dashboard/revenue?startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# 5. Lấy order status distribution
curl -X GET http://localhost:3001/dashboard/order-status \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Frontend Integration

Frontend đã sẵn sàng sử dụng Dashboard API:

### API Client
File: `frontend/app/lib/api/dashboard.ts`

```typescript
import { dashboardApi } from '~/lib/api'

// Sử dụng trong component
const { data, error } = await dashboardApi.getStats()
const { data, error } = await dashboardApi.getRevenue({ period: '30d' })
const { data, error } = await dashboardApi.getOrderStatus()
```

### Dashboard Page
File: `frontend/app/pages/(private)/dashboard/index.vue`

Trang dashboard đã được implement và sẽ tự động gọi API khi mount.

## Cấu Trúc Dữ Liệu

### DashboardStats Response
```typescript
{
  totalRevenue: number          // Tổng doanh thu từ đơn hàng đã giao
  totalOrders: number           // Tổng số đơn hàng
  totalProducts: number         // Tổng số sản phẩm
  totalCategories: number       // Tổng số danh mục
  totalUsers: number            // Tổng số admin users
  totalClientUsers: number      // Tổng số khách hàng
  totalFiles: number            // Tổng số files đã upload
  totalVouchers: number         // Tổng số vouchers
  activeOrders: number          // Số đơn hàng đang xử lý
  pendingOrders: number         // Số đơn hàng chờ xác nhận
  completedOrders: number       // Số đơn hàng đã hoàn thành
  cancelledOrders: number       // Số đơn hàng đã hủy
  lowStockProducts: number      // Số sản phẩm sắp hết hàng
  outOfStockProducts: number    // Số sản phẩm hết hàng
  activeVouchers: number        // Số vouchers đang hoạt động
  expiredVouchers: number       // Số vouchers đã hết hạn
}
```

### RevenueData Response
```typescript
[
  {
    date: string      // YYYY-MM-DD
    revenue: number   // Doanh thu trong ngày
    orders: number    // Số đơn hàng trong ngày
  }
]
```

### OrderStatusData Response
```typescript
[
  {
    status: string      // PENDING, CONFIRMED, PROCESSING, SHIPPING, DELIVERED, CANCELLED
    count: number       // Số lượng đơn hàng
    percentage: number  // Phần trăm so với tổng số đơn
  }
]
```

## Authentication & Authorization

- Tất cả endpoints yêu cầu JWT authentication
- User phải có level >= ADMIN (50)
- Token được gửi qua header: `Authorization: Bearer <token>`

## Troubleshooting

### Lỗi "crypto is not defined"
- Nguyên nhân: Node.js version < 16.17.0
- Giải pháp: Nâng cấp Node.js lên version 18 hoặc 20

### Lỗi "Unauthorized"
- Kiểm tra JWT token có hợp lệ không
- Kiểm tra user có level >= ADMIN không

### Lỗi "Cannot connect to database"
- Kiểm tra PostgreSQL đang chạy
- Kiểm tra file `.env` có đúng thông tin database không

## Next Steps

1. **Nâng cấp Node.js** lên version 18 hoặc 20
2. **Chạy backend server**: `npm run start:dev`
3. **Test API** qua Swagger UI hoặc curl
4. **Chạy frontend**: `npm run dev` trong thư mục frontend
5. **Truy cập dashboard**: `http://localhost:3000/dashboard`

## Support

Nếu gặp vấn đề, kiểm tra:
- Backend logs trong terminal
- Browser console (F12) cho frontend errors
- Swagger documentation tại `http://localhost:3001/api`
- File README.md trong `backend/src/dashboard/`

