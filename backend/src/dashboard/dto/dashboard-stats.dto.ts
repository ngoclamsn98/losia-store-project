import { ApiProperty } from '@nestjs/swagger';

export class DashboardStatsDto {
  @ApiProperty({ description: 'Total revenue from all completed orders' })
  totalRevenue: number;

  @ApiProperty({ description: 'Total number of orders' })
  totalOrders: number;

  @ApiProperty({ description: 'Total number of products' })
  totalProducts: number;

  @ApiProperty({ description: 'Total number of categories' })
  totalCategories: number;

  @ApiProperty({ description: 'Total number of admin users' })
  totalUsers: number;

  @ApiProperty({ description: 'Total number of client users' })
  totalClientUsers: number;

  @ApiProperty({ description: 'Total number of uploaded files' })
  totalFiles: number;

  @ApiProperty({ description: 'Total number of vouchers' })
  totalVouchers: number;

  @ApiProperty({ description: 'Number of active orders (not cancelled or delivered)' })
  activeOrders: number;

  @ApiProperty({ description: 'Number of pending orders' })
  pendingOrders: number;

  @ApiProperty({ description: 'Number of completed orders' })
  completedOrders: number;

  @ApiProperty({ description: 'Number of cancelled orders' })
  cancelledOrders: number;

  @ApiProperty({ description: 'Number of products with low stock' })
  lowStockProducts: number;

  @ApiProperty({ description: 'Number of out of stock products' })
  outOfStockProducts: number;

  @ApiProperty({ description: 'Number of active vouchers' })
  activeVouchers: number;

  @ApiProperty({ description: 'Number of expired vouchers' })
  expiredVouchers: number;
}

export class RevenueDataDto {
  @ApiProperty({ description: 'Date in YYYY-MM-DD format' })
  date: string;

  @ApiProperty({ description: 'Total revenue for the date' })
  revenue: number;

  @ApiProperty({ description: 'Number of orders for the date' })
  orders: number;
}

export class OrderStatusDataDto {
  @ApiProperty({ description: 'Order status' })
  status: string;

  @ApiProperty({ description: 'Number of orders with this status' })
  count: number;

  @ApiProperty({ description: 'Percentage of total orders' })
  percentage: number;
}

