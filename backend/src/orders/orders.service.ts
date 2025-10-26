import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus, PaymentStatus, OrderItem } from './entities/order.entity';
import { CreateOrderDto, GuestCheckoutDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { CartService } from '../cart/cart.service';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { PaginatedResult } from '../common/dto/pagination.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(ProductVariant)
    private variantRepository: Repository<ProductVariant>,
    private cartService: CartService,
  ) {}

  private generateOrderNumber(): string {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    return `ORD${timestamp}${random}`;
  }

  async create(userId: string, dto: CreateOrderDto): Promise<Order> {
    const cart = await this.cartService.getCart(userId);

    if (!cart.items || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // Verify stock and get latest prices
    for (const item of cart.items) {
      const variant = await this.variantRepository.findOne({
        where: { id: item.variantId },
      });

      if (!variant) {
        throw new NotFoundException(
          `Product variant ${item.variantId} not found`,
        );
      }

      if (!variant.isActive) {
        throw new BadRequestException(
          `Product ${item.productName} is not available`,
        );
      }

      if (variant.stock < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for ${item.productName}`,
        );
      }

      // Update price to latest
      item.price = variant.price;
    }

    // Calculate totals
    const subtotal = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    const shipping = 0; // Can be calculated based on address
    const tax = 0; // Can be calculated based on subtotal
    const discount = 0; // Can be applied from coupons
    const total = subtotal + shipping + tax - discount;

    // Create order
    const order = this.orderRepository.create({
      orderNumber: this.generateOrderNumber(),
      userId,
      items: cart.items,
      subtotal,
      shipping,
      tax,
      discount,
      total,
      paymentMethod: dto.paymentMethod,
      shippingAddress: dto.shippingAddress,
      notes: dto.notes,
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      isRead: false,
    });

    const savedOrder = await this.orderRepository.save(order);

    // Update stock
    for (const item of cart.items) {
      await this.variantRepository.decrement(
        { id: item.variantId },
        'stock',
        item.quantity,
      );
    }

    // Clear cart
    await this.cartService.clearCart(userId);

    return savedOrder;
  }

  async createGuestOrder(dto: GuestCheckoutDto): Promise<Order> {
    // Validate items
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Items are required');
    }

    // Verify stock for each item
    const orderItems: OrderItem[] = [];
    for (const item of dto.items) {
      // Find product variant by productId (assuming 1 variant per product for simplicity)
      const variant = await this.variantRepository.findOne({
        where: { productId: item.productId },
        relations: ['product'],
      });

      if (!variant) {
        throw new NotFoundException(
          `Product ${item.productId} not found`,
        );
      }

      if (!variant.isActive) {
        throw new BadRequestException(
          `Product ${item.title || variant.product?.name || 'Unknown'} is not available`,
        );
      }

      if (variant.stock < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for ${item.title || variant.product?.name || 'Unknown'}`,
        );
      }

      // Build order item
      orderItems.push({
        variantId: variant.id,
        productId: item.productId,
        productName: item.title || variant.product?.name || 'Unknown',
        variantName: variant.name,
        price: variant.price, // Use current price from database
        quantity: item.quantity,
        imageUrl: variant.product?.thumbnailUrl,
      });
    }

    // Map payment method to enum (handle lowercase from frontend)
    const paymentMethodMap: Record<string, any> = {
      'cod': 'COD',
      'COD': 'COD',
      'bank_transfer': 'BANK_TRANSFER',
      'BANK_TRANSFER': 'BANK_TRANSFER',
      'credit_card': 'CREDIT_CARD',
      'CREDIT_CARD': 'CREDIT_CARD',
      'e_wallet': 'E_WALLET',
      'E_WALLET': 'E_WALLET',
      'qr': 'BANK_TRANSFER', // Map 'qr' to BANK_TRANSFER
    };

    const paymentMethod = paymentMethodMap[dto.paymentMethod] || 'COD';

    // Create order with guest user info
    const order = this.orderRepository.create({
      orderNumber: this.generateOrderNumber(),
      userId: null, // Guest order - no user ID
      items: orderItems,
      subtotal: dto.subtotal,
      shipping: dto.shippingCost,
      tax: dto.tax,
      discount: 0,
      total: dto.total,
      paymentMethod: paymentMethod,
      shippingAddress: {
        fullName: `${dto.shippingAddress.firstName} ${dto.shippingAddress.lastName}`,
        phone: dto.shippingAddress.phone,
        address: `${dto.shippingAddress.address1}${dto.shippingAddress.address2 ? ', ' + dto.shippingAddress.address2 : ''}`,
        city: dto.shippingAddress.city,
        district: dto.shippingAddress.state || '',
        ward: '',
        postalCode: dto.shippingAddress.postalCode || '',
      },
      notes: `Guest order - Email: ${dto.email}, Phone: ${dto.phone}`,
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      isRead: false,
    });

    const savedOrder = await this.orderRepository.save(order);

    // Update stock
    for (const item of orderItems) {
      await this.variantRepository.decrement(
        { id: item.variantId },
        'stock',
        item.quantity,
      );
    }

    return savedOrder;
  }

  async findAll(filters?: {
    status?: OrderStatus;
    paymentStatus?: PaymentStatus;
    search?: string;
    isRead?: boolean;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResult<Order>> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

    const query = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.user', 'user')
      .orderBy('order.createdAt', 'DESC');

    if (filters?.status) {
      query.andWhere('order.status = :status', { status: filters.status });
    }

    if (filters?.paymentStatus) {
      query.andWhere('order.paymentStatus = :paymentStatus', {
        paymentStatus: filters.paymentStatus,
      });
    }

    if (filters?.isRead !== undefined) {
      query.andWhere('order.isRead = :isRead', { isRead: filters.isRead });
    }

    if (filters?.search) {
      query.andWhere(
        '(order.orderNumber ILIKE :search OR user.email ILIKE :search OR user.firstName ILIKE :search OR user.lastName ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    const total = await query.getCount();
    query.skip(skip).take(limit);
    const data = await query.getMany();

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async findByUser(userId: string): Promise<Order[]> {
    return this.orderRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: string, dto: UpdateOrderDto): Promise<Order> {
    const order = await this.findOne(id);

    if (dto.status) {
      order.status = dto.status;
    }

    if (dto.paymentStatus) {
      order.paymentStatus = dto.paymentStatus;
    }

    return this.orderRepository.save(order);
  }

  async markAsRead(id: string): Promise<Order> {
    const order = await this.findOne(id);
    order.isRead = true;
    return this.orderRepository.save(order);
  }

  async markAllAsRead(): Promise<void> {
    await this.orderRepository.update({ isRead: false }, { isRead: true });
  }

  async getUnreadCount(): Promise<number> {
    return this.orderRepository.count({ where: { isRead: false } });
  }

  async delete(id: string): Promise<void> {
    const order = await this.findOne(id);
    await this.orderRepository.remove(order);
  }
}

