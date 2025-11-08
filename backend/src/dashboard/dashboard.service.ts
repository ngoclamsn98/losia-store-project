import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Order, OrderStatus } from '../orders/entities/order.entity';
import { Product } from '../products/entities/product.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { Category } from '../categories/entities/category.entity';
import { User } from '../users/entities/user.entity';
import { ClientUser } from '../client-users/entities/client-user.entity';
import { File } from '../files/entities/file.entity';
import { Voucher, VoucherStatus } from '../vouchers/entities/voucher.entity';
import { DashboardStatsDto, RevenueDataDto, OrderStatusDataDto } from './dto/dashboard-stats.dto';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(ProductVariant)
    private variantRepository: Repository<ProductVariant>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(ClientUser)
    private clientUserRepository: Repository<ClientUser>,
    @InjectRepository(File)
    private fileRepository: Repository<File>,
    @InjectRepository(Voucher)
    private voucherRepository: Repository<Voucher>,
  ) {}

  async getStats(): Promise<DashboardStatsDto> {
    // Get total revenue from completed orders
    const revenueResult = await this.orderRepository
      .createQueryBuilder('order')
      .select('SUM(order.total)', 'total')
      .where('order.status = :status', { status: OrderStatus.DELIVERED })
      .getRawOne();

    const totalRevenue = Number(revenueResult?.total || 0);

    // Get order counts
    const totalOrders = await this.orderRepository.count();
    const activeOrders = await this.orderRepository.count({
      where: [
        { status: OrderStatus.PENDING },
        { status: OrderStatus.CONFIRMED },
        { status: OrderStatus.PROCESSING },
        { status: OrderStatus.SHIPPING },
      ],
    });
    const pendingOrders = await this.orderRepository.count({
      where: { status: OrderStatus.PENDING },
    });
    const completedOrders = await this.orderRepository.count({
      where: { status: OrderStatus.DELIVERED },
    });
    const cancelledOrders = await this.orderRepository.count({
      where: { status: OrderStatus.CANCELLED },
    });

    // Get product counts
    const totalProducts = await this.productRepository.count();

    // Get stock statistics
    const lowStockProducts = await this.variantRepository
      .createQueryBuilder('variant')
      .where('variant.stock > 0 AND variant.stock <= variant.lowStockThreshold')
      .getCount();

    const outOfStockProducts = await this.variantRepository
      .createQueryBuilder('variant')
      .where('variant.stock = 0')
      .getCount();

    // Get other counts
    const totalCategories = await this.categoryRepository.count();
    const totalUsers = await this.userRepository.count();
    const totalClientUsers = await this.clientUserRepository.count();
    const totalFiles = await this.fileRepository.count();
    const totalVouchers = await this.voucherRepository.count();

    // Get voucher statistics
    const now = new Date();
    const activeVouchers = await this.voucherRepository.count({
      where: { status: VoucherStatus.ACTIVE },
    });

    const expiredVouchers = await this.voucherRepository
      .createQueryBuilder('voucher')
      .where('voucher.endDate < :now', { now })
      .orWhere('voucher.status = :status', { status: VoucherStatus.INACTIVE })
      .getCount();

    return {
      totalRevenue,
      totalOrders,
      totalProducts,
      totalCategories,
      totalUsers,
      totalClientUsers,
      totalFiles,
      totalVouchers,
      activeOrders,
      pendingOrders,
      completedOrders,
      cancelledOrders,
      lowStockProducts,
      outOfStockProducts,
      activeVouchers,
      expiredVouchers,
    };
  }

  async getRevenue(params?: {
    startDate?: string;
    endDate?: string;
    period?: '7d' | '30d' | '90d';
  }): Promise<RevenueDataDto[]> {
    let startDate: Date;
    let endDate: Date = new Date();

    if (params?.startDate && params?.endDate) {
      startDate = new Date(params.startDate);
      endDate = new Date(params.endDate);
    } else {
      // Use period to calculate date range
      const period = params?.period || '30d';
      const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
      startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
    }

    // Get orders within date range
    const orders = await this.orderRepository
      .createQueryBuilder('order')
      .select('DATE(order.createdAt)', 'date')
      .addSelect('SUM(order.total)', 'revenue')
      .addSelect('COUNT(order.id)', 'orders')
      .where('order.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('order.status = :status', { status: OrderStatus.DELIVERED })
      .groupBy('DATE(order.createdAt)')
      .orderBy('DATE(order.createdAt)', 'ASC')
      .getRawMany();

    // Fill in missing dates with zero values
    const result: RevenueDataDto[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const existingData = orders.find((o) => o.date === dateStr);

      result.push({
        date: dateStr,
        revenue: existingData ? Number(existingData.revenue) : 0,
        orders: existingData ? Number(existingData.orders) : 0,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return result;
  }

  async getOrderStatus(): Promise<OrderStatusDataDto[]> {
    const totalOrders = await this.orderRepository.count();

    if (totalOrders === 0) {
      return [];
    }

    const statusCounts = await this.orderRepository
      .createQueryBuilder('order')
      .select('order.status', 'status')
      .addSelect('COUNT(order.id)', 'count')
      .groupBy('order.status')
      .getRawMany();

    return statusCounts.map((item) => ({
      status: item.status,
      count: Number(item.count),
      percentage: Number(((Number(item.count) / totalOrders) * 100).toFixed(2)),
    }));
  }
}

