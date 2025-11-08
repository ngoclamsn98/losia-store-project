# Dashboard API Mapping

Tài liệu này mô tả mapping giữa Backend API và Frontend Dashboard.

## 📊 Tổng Quan

| Component | Backend | Frontend |
|-----------|---------|----------|
| Module | `backend/src/dashboard/` | `frontend/app/pages/(private)/dashboard/` |
| API Client | - | `frontend/app/lib/api/dashboard.ts` |
| Controller | `dashboard.controller.ts` | - |
| Service | `dashboard.service.ts` | - |
| DTOs | `dto/dashboard-stats.dto.ts` | TypeScript interfaces |

## 🔗 API Endpoints Mapping

### 1. Dashboard Statistics

#### Backend
```typescript
// File: backend/src/dashboard/dashboard.controller.ts
@Get('stats')
@MinLevel(USER_LEVELS.ADMIN)
async getStats(): Promise<DashboardStatsDto>

// File: backend/src/dashboard/dashboard.service.ts
async getStats(): Promise<DashboardStatsDto> {
  // Tính toán:
  // - totalRevenue từ orders với status = DELIVERED
  // - totalOrders, activeOrders, pendingOrders, completedOrders, cancelledOrders
  // - totalProducts, lowStockProducts, outOfStockProducts
  // - totalCategories, totalUsers, totalClientUsers, totalFiles
  // - totalVouchers, activeVouchers, expiredVouchers
}
```

#### Frontend
```typescript
// File: frontend/app/lib/api/dashboard.ts
export const dashboardApi = {
  getStats: () => {
    return useApi<DashboardStats>('/dashboard/stats')
  }
}

// File: frontend/app/pages/(private)/dashboard/index.vue
const fetchStats = async () => {
  const { data, error } = await dashboardApi.getStats()
  if (data.value) {
    stats.value = data.value
  }
}
```

#### Data Flow
```
Backend Service → Controller → API Response
    ↓
Frontend API Client → Dashboard Page → UI Components
```

#### Response Structure
```typescript
{
  totalRevenue: number          // Hiển thị trong Revenue Card
  totalOrders: number           // Hiển thị trong Orders Card
  totalProducts: number         // Hiển thị trong Products Card
  totalCategories: number       // Hiển thị trong Categories Card
  totalUsers: number            // Hiển thị trong Users Card
  totalClientUsers: number      // Hiển thị trong Customers Card
  totalFiles: number            // Hiển thị trong Files Card
  totalVouchers: number         // Hiển thị trong Vouchers Card
  activeOrders: number          // Hiển thị trong Active Orders Card
  pendingOrders: number         // Hiển thị trong Pending Orders Card
  completedOrders: number       // Hiển thị trong Completed Orders Card
  cancelledOrders: number       // Hiển thị trong Cancelled Orders Card
  lowStockProducts: number      // Hiển thị trong Low Stock Alert
  outOfStockProducts: number    // Hiển thị trong Out of Stock Alert
  activeVouchers: number        // Hiển thị trong Active Vouchers Card
  expiredVouchers: number       // Hiển thị trong Expired Vouchers Card
}
```

### 2. Revenue Data (for Charts)

#### Backend
```typescript
// File: backend/src/dashboard/dashboard.controller.ts
@Get('revenue')
@MinLevel(USER_LEVELS.ADMIN)
async getRevenue(
  @Query('startDate') startDate?: string,
  @Query('endDate') endDate?: string,
  @Query('period') period?: '7d' | '30d' | '90d',
): Promise<RevenueDataDto[]>

// File: backend/src/dashboard/dashboard.service.ts
async getRevenue(params?: {
  startDate?: string;
  endDate?: string;
  period?: '7d' | '30d' | '90d';
}): Promise<RevenueDataDto[]> {
  // Lấy orders trong khoảng thời gian
  // Group by date
  // Tính tổng revenue và số orders mỗi ngày
  // Fill missing dates với giá trị 0
}
```

#### Frontend
```typescript
// File: frontend/app/lib/api/dashboard.ts
export const dashboardApi = {
  getRevenue: (params?: { 
    startDate?: string; 
    endDate?: string; 
    period?: '7d' | '30d' | '90d' 
  }) => {
    return useApi<RevenueData[]>('/dashboard/revenue', { params })
  }
}

// Usage in Dashboard Page
const { data } = await dashboardApi.getRevenue({ period: '30d' })
// Hiển thị trong Revenue Chart component
```

#### Response Structure
```typescript
[
  {
    date: "2024-01-01",    // X-axis của chart
    revenue: 500000,       // Y-axis (revenue line)
    orders: 10             // Y-axis (orders line) hoặc tooltip
  },
  {
    date: "2024-01-02",
    revenue: 750000,
    orders: 15
  }
  // ... more data points
]
```

### 3. Order Status Distribution

#### Backend
```typescript
// File: backend/src/dashboard/dashboard.controller.ts
@Get('order-status')
@MinLevel(USER_LEVELS.ADMIN)
async getOrderStatus(): Promise<OrderStatusDataDto[]>

// File: backend/src/dashboard/dashboard.service.ts
async getOrderStatus(): Promise<OrderStatusDataDto[]> {
  // Count orders by status
  // Calculate percentage
  // Return array of status data
}
```

#### Frontend
```typescript
// File: frontend/app/lib/api/dashboard.ts
export const dashboardApi = {
  getOrderStatus: () => {
    return useApi<OrderStatusData[]>('/dashboard/order-status')
  }
}

// Usage in Dashboard Page
const { data } = await dashboardApi.getOrderStatus()
// Hiển thị trong Pie Chart hoặc Bar Chart
```

#### Response Structure
```typescript
[
  {
    status: "PENDING",      // Label cho chart
    count: 15,              // Value cho chart
    percentage: 10.0        // Percentage label
  },
  {
    status: "DELIVERED",
    count: 100,
    percentage: 66.67
  },
  {
    status: "CANCELLED",
    count: 5,
    percentage: 3.33
  }
  // ... other statuses
]
```

## 🎨 UI Components Mapping

### Dashboard Page Layout
```
frontend/app/pages/(private)/dashboard/index.vue
├── Header Section
│   ├── Title: "Dashboard"
│   └── Welcome message: "Welcome back, {userName}"
│
├── Statistics Cards Grid (4 columns)
│   ├── Revenue Card (totalRevenue)
│   ├── Orders Card (totalOrders)
│   ├── Products Card (totalProducts)
│   ├── Categories Card (totalCategories)
│   ├── Users Card (totalUsers)
│   ├── Customers Card (totalClientUsers)
│   ├── Files Card (totalFiles)
│   └── Vouchers Card (totalVouchers)
│
├── Order Status Cards Grid (4 columns)
│   ├── Active Orders (activeOrders)
│   ├── Pending Orders (pendingOrders)
│   ├── Completed Orders (completedOrders)
│   └── Cancelled Orders (cancelledOrders)
│
├── Inventory Alerts Grid (2 columns)
│   ├── Low Stock Alert (lowStockProducts)
│   └── Out of Stock Alert (outOfStockProducts)
│
├── Voucher Status Cards Grid (2 columns)
│   ├── Active Vouchers (activeVouchers)
│   └── Expired Vouchers (expiredVouchers)
│
├── Revenue Chart (Optional - if implemented)
│   └── Line/Area chart showing revenue over time
│
├── Order Status Chart (Optional - if implemented)
│   └── Pie/Donut chart showing order distribution
│
└── Quick Actions
    ├── Manage Products
    ├── Manage Orders
    ├── Manage Categories
    ├── Manage Vouchers
    ├── Manage Customers
    ├── Manage Inventory
    ├── Manage Files
    └── Manage Admins (if superadmin)
```

## 🔐 Authentication & Authorization

### Backend Guards
```typescript
@UseGuards(JwtAuthGuard, LevelGuard)
@MinLevel(USER_LEVELS.ADMIN)
```

### Frontend Auth Check
```typescript
// File: frontend/app/pages/(private)/dashboard/index.vue
definePageMeta({
  layout: 'main',
  title: 'Dashboard',
  // Middleware sẽ check authentication
})

const authStore = useAuthStore()
// authStore.userFullName, authStore.isSuperAdmin
```

## 📝 Data Sources

### Backend Entities Used
```typescript
// dashboard.service.ts dependencies
- Order (OrderRepository)
- Product (ProductRepository)
- ProductVariant (VariantRepository)
- Category (CategoryRepository)
- User (UserRepository)
- ClientUser (ClientUserRepository)
- File (FileRepository)
- Voucher (VoucherRepository)
```

### Calculations
```typescript
// Revenue
totalRevenue = SUM(order.total) WHERE status = 'DELIVERED'

// Orders
totalOrders = COUNT(orders)
activeOrders = COUNT(orders) WHERE status IN ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPING']
pendingOrders = COUNT(orders) WHERE status = 'PENDING'
completedOrders = COUNT(orders) WHERE status = 'DELIVERED'
cancelledOrders = COUNT(orders) WHERE status = 'CANCELLED'

// Products
totalProducts = COUNT(products)
lowStockProducts = COUNT(variants) WHERE stock > 0 AND stock <= lowStockThreshold
outOfStockProducts = COUNT(variants) WHERE stock = 0

// Others
totalCategories = COUNT(categories)
totalUsers = COUNT(users)
totalClientUsers = COUNT(client_users)
totalFiles = COUNT(files)
totalVouchers = COUNT(vouchers)
activeVouchers = COUNT(vouchers) WHERE status = 'ACTIVE'
expiredVouchers = COUNT(vouchers) WHERE endDate < NOW() OR status = 'INACTIVE'
```

## 🚀 Usage Example

### Complete Flow
```typescript
// 1. User navigates to /dashboard
// 2. Dashboard page mounts
onMounted(() => {
  fetchStats()
})

// 3. fetchStats() calls API
const fetchStats = async () => {
  loading.value = true
  try {
    const { data, error } = await dashboardApi.getStats()
    if (error.value) {
      toast.error('Failed to fetch dashboard statistics')
      return
    }
    if (data.value) {
      stats.value = data.value  // Update reactive state
    }
  } catch (err) {
    toast.error(err.message)
  } finally {
    loading.value = false
  }
}

// 4. Backend processes request
// - JwtAuthGuard validates token
// - LevelGuard checks user level >= ADMIN
// - DashboardService.getStats() queries database
// - Returns DashboardStatsDto

// 5. Frontend receives data and updates UI
// - Cards show statistics
// - Charts render (if implemented)
// - Loading state removed
```

## 📚 Related Files

### Backend
- `backend/src/dashboard/dashboard.module.ts`
- `backend/src/dashboard/dashboard.controller.ts`
- `backend/src/dashboard/dashboard.service.ts`
- `backend/src/dashboard/dto/dashboard-stats.dto.ts`
- `backend/src/app.module.ts` (imports DashboardModule)
- `backend/src/main.ts` (Swagger config)

### Frontend
- `frontend/app/lib/api/dashboard.ts`
- `frontend/app/lib/api/index.ts` (exports dashboardApi)
- `frontend/app/pages/(private)/dashboard/index.vue`
- `frontend/app/layouts/main.vue` (layout for dashboard)

## 🔧 Configuration

### Environment Variables
```env
# Backend (.env)
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_DATABASE=losia_store
JWT_SECRET=your_secret_key
PORT=3001

# Frontend (.env)
NUXT_PUBLIC_API_URL=http://localhost:3001
```

### API Base URL
```typescript
// frontend/app/lib/api/core.ts
export const API_BASE_URL = process.env.NUXT_PUBLIC_API_URL || 'http://localhost:3001'
```

