import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { Order, OrderStatus, PaymentStatus, OrderItem } from './entities/order.entity';
import { CreateOrderDto, GuestCheckoutDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { CartService } from '../cart/cart.service';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { PaginatedResult } from '../common/dto/pagination.dto';
import { VouchersService } from '../vouchers/vouchers.service';
import { MailService } from 'src/mail/mail.service';
import { ViettelPostService } from '../viettel-post/viettel-post.service';
import { ViettelPostCreateOrderDto } from '../viettel-post/dto/create-shipping-order.dto';
import { getProvinceId, parseAddress } from '../viettel-post/helpers/address-mapper';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(ProductVariant)
    private variantRepository: Repository<ProductVariant>,
    private cartService: CartService,
    private vouchersService: VouchersService,
    private mailService: MailService,
    private viettelPostService: ViettelPostService,

  ) {}

  private generateOrderNumber(): string {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    return `ORD${timestamp}${random}`;
  }

  async create(clientUserId: string, dto: CreateOrderDto): Promise<Order> {
    let orderItems: OrderItem[] = [];
    let subtotal: number;
    let shipping: number;
    let tax: number;
    let total: number;

    // Check if items are provided in the request (like guest checkout)
    if (dto.items && dto.items.length > 0) {
      // Use items from request body
      for (const item of dto.items) {
        const variant = await this.variantRepository.findOne({
          where: { productId: item.productId },
          relations: ['product'],
        });

        if (!variant) {
          throw new NotFoundException(`Product ${item.productId} not found`);
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

        orderItems.push({
          variantId: variant.id,
          productId: item.productId,
          productName: item.title || variant.product?.name || 'Unknown',
          variantName: variant.name,
          price: variant.price,
          quantity: item.quantity,
          imageUrl: variant.product?.thumbnailUrl,
        });
      }

      // Use provided totals or calculate
      subtotal = dto.subtotal || orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      shipping = dto.shippingCost || 0;
      tax = dto.tax || 0;
      total = dto.total || subtotal + shipping + tax;
    } else {
      // Use items from cart
      const cart = await this.cartService.getCart(clientUserId);

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

      orderItems = cart.items;
      subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      shipping = 0;
      tax = 0;
      total = subtotal + shipping + tax;
    }

    // Map payment method to enum
    const paymentMethodMap: Record<string, any> = {
      'cod': 'COD',
      'COD': 'COD',
      'bank_transfer': 'BANK_TRANSFER',
      'BANK_TRANSFER': 'BANK_TRANSFER',
      'credit_card': 'CREDIT_CARD',
      'CREDIT_CARD': 'CREDIT_CARD',
      'e_wallet': 'E_WALLET',
      'E_WALLET': 'E_WALLET',
      'qr': 'BANK_TRANSFER',
    };

    const paymentMethod = paymentMethodMap[dto.paymentMethod] || 'COD';

    // Handle voucher if provided
    let discount = dto.discount || 0;
    let voucherCode = dto.voucherCode || null;
    let voucherId: string | null = null;

    if (voucherCode) {
      const voucherValidation = await this.vouchersService.validateVoucher({
        code: voucherCode,
        orderValue: subtotal,
        clientUserId,
      });

      if (voucherValidation.valid) {
        discount = voucherValidation.discountAmount;
        voucherId = voucherValidation.voucher?.id || null;
      } else {
        throw new BadRequestException(voucherValidation.message || 'Invalid voucher');
      }
    }

    // Recalculate total with discount
    total = subtotal + shipping + tax - discount;

    // Create order
    const order = this.orderRepository.create({
      orderNumber: this.generateOrderNumber(),
      clientUserId,
      items: orderItems,
      subtotal,
      shipping,
      tax,
      discount,
      voucherCode,
      voucherId,
      total,
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
      notes: dto.notes || (dto.email ? `Email: ${dto.email}, Phone: ${dto.phone}` : ''),
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      isRead: false,
    });

    const savedOrder = await this.orderRepository.save(order);

    // Record voucher usage if voucher was applied
    if (voucherId && discount > 0) {
      await this.vouchersService.recordUsage(voucherId, clientUserId, savedOrder.id, discount);
    }

    // Update stock
    for (const item of orderItems) {
      await this.variantRepository.decrement(
        { id: item.variantId },
        'stock',
        item.quantity,
      );
    }

    // Clear cart only if items were from cart
    if (!dto.items || dto.items.length === 0) {
      await this.cartService.clearCart(clientUserId);
    }

    // Send order confirmation email
    dto.email && this.mailService.sendOrderConfirmationEmail(dto.email, savedOrder);
    // Tự động tạo vận đơn Viettel Post
    await this.createViettelPostShipping(savedOrder);

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

    // Handle voucher if provided
    let discount = dto.discount || 0;
    let voucherCode = dto.voucherCode || null;
    let voucherId: string | null = null;
    let total = dto.total;

    if (voucherCode) {
      const voucherValidation = await this.vouchersService.validateVoucher({
        code: voucherCode,
        orderValue: dto.subtotal,
        clientUserId: undefined, // Guest user
      });

      if (voucherValidation.valid) {
        discount = voucherValidation.discountAmount;
        voucherId = voucherValidation.voucher?.id || null;
        // Recalculate total with discount
        total = dto.subtotal + dto.shippingCost + dto.tax - discount;
      } else {
        throw new BadRequestException(voucherValidation.message || 'Invalid voucher');
      }
    }

    // Create order with guest user info
    const order = this.orderRepository.create({
      orderNumber: this.generateOrderNumber(),
      clientUserId: null, // Guest order - no client user ID
      items: orderItems,
      subtotal: dto.subtotal,
      shipping: dto.shippingCost,
      tax: dto.tax,
      discount,
      voucherCode,
      voucherId,
      total,
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

    // Record voucher usage if voucher was applied
    if (voucherId && discount > 0) {
      await this.vouchersService.recordUsage(voucherId, null, savedOrder.id, discount);
    }

    // Update stock
    for (const item of orderItems) {
      await this.variantRepository.decrement(
        { id: item.variantId },
        'stock',
        item.quantity,
      );
    }

    // Send order confirmation email
    this.mailService.sendOrderConfirmationEmail(dto.email, savedOrder);
    // Tự động tạo vận đơn Viettel Post
    await this.createViettelPostShipping(savedOrder);

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
      .leftJoinAndSelect('order.clientUser', 'clientUser')
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
        new Brackets((qb) => {
          qb.where('order.orderNumber ILIKE :search', { search: `%${filters.search}%` })
            .orWhere('clientUser.email ILIKE :search', { search: `%${filters.search}%` })
            .orWhere('clientUser.name ILIKE :search', { search: `%${filters.search}%` })
            .orWhere('order.notes ILIKE :search', { search: `%${filters.search}%` });
        }),
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
      relations: ['clientUser'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async findByUser(clientUserId: string): Promise<Order[]> {
    return this.orderRepository.find({
      where: { clientUserId },
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

  /**
   * Tạo vận đơn Viettel Post tự động sau khi tạo order
   */
  private async createViettelPostShipping(order: Order): Promise<void> {
    try {
      this.logger.log(`Creating Viettel Post shipping for order: ${order.orderNumber}`);

      // Parse địa chỉ người nhận
      const receiverAddress = parseAddress(order.shippingAddress.address);
      const receiverProvinceId = getProvinceId(order.shippingAddress.city);

      // Lấy thông tin người gửi từ env hoặc config
      const senderName = process.env.VIETTEL_POST_SENDER_NAME || 'Losia Store';
      const senderPhone = process.env.VIETTEL_POST_SENDER_PHONE || '0123456789';
      const senderAddress = process.env.VIETTEL_POST_SENDER_ADDRESS || 'Hà Nội';
      const senderCity = process.env.VIETTEL_POST_SENDER_CITY || 'Hà Nội';
      const senderProvinceId = getProvinceId(senderCity);

      // Tính tổng khối lượng và chuẩn bị thông tin sản phẩm
      let totalWeight = 0;
      const productNames: string[] = [];

      for (const item of order.items) {
        // Lấy thông tin variant để có weight
        const variant = await this.variantRepository.findOne({
          where: { id: item.variantId },
        });

        if (variant && variant.weight) {
          totalWeight += variant.weight * item.quantity;
        } else {
          // Nếu không có weight, ước tính 500g/sản phẩm
          totalWeight += 500 * item.quantity;
        }

        productNames.push(`${item.productName} x${item.quantity}`);
      }

      // Đảm bảo weight tối thiểu 100g
      if (totalWeight < 100) {
        totalWeight = 100;
      }

      // Tạo DTO cho Viettel Post
      const vtpOrderData: ViettelPostCreateOrderDto = {
        ORDER_NUMBER: order.orderNumber,

        // Thông tin người gửi
        SENDER_FULLNAME: senderName,
        SENDER_PHONE: senderPhone,
        SENDER_ADDRESS: senderAddress,
        SENDER_PROVINCE: senderProvinceId || 1, // Default Hà Nội

        // Thông tin người nhận
        RECEIVER_FULLNAME: order.shippingAddress.fullName,
        RECEIVER_PHONE: order.shippingAddress.phone,
        RECEIVER_ADDRESS: order.shippingAddress.address,
        RECEIVER_PROVINCE: receiverProvinceId || 2, // Default HCM

        // Thông tin hàng hóa
        PRODUCT_NAME: productNames.join(', ').substring(0, 200), // Giới hạn 200 ký tự
        PRODUCT_DESCRIPTION: `Đơn hàng ${order.orderNumber}`,
        PRODUCT_QUANTITY: order.items.reduce((sum, item) => sum + item.quantity, 0),
        PRODUCT_PRICE: Number(order.subtotal),
        PRODUCT_WEIGHT: totalWeight,
        PRODUCT_TYPE: 'HH', // Hàng hóa

        // Thông tin dịch vụ
        ORDER_SERVICE: 'VCN', // Viettel chuyển nhanh
        ORDER_PAYMENT: order.paymentMethod === 'COD' ? 2 : 1, // 1: Người gửi trả, 2: Người nhận trả

        // Tiền thu hộ (COD)
        MONEY_COLLECTION: order.paymentMethod === 'COD' ? Number(order.total) : 0,

        // Ghi chú
        ORDER_NOTE: order.notes || '',
      };

      // Gọi API Viettel Post
      const response = await this.viettelPostService.createShippingOrder(vtpOrderData);

      if (response.status === 200 && response.data?.ORDER_CODE) {
        // Cập nhật order với thông tin vận đơn VTP
        await this.orderRepository.update(order.id, {
          vtpOrderCode: response.data.ORDER_CODE,
          vtpShippingFee: response.data.MONEY_TOTALFEE || null,
          vtpStatus: 'CREATED',
          vtpCreatedAt: new Date(),
        });

        this.logger.log(
          `Successfully created VTP shipping. Order: ${order.orderNumber}, VTP Code: ${response.data.ORDER_CODE}`,
        );
      } else {
        this.logger.warn(
          `Failed to create VTP shipping for order ${order.orderNumber}: ${response.message}`,
        );
      }
    } catch (error) {
      // Log lỗi nhưng không throw để không ảnh hưởng đến việc tạo order
      this.logger.error(
        `Error creating VTP shipping for order ${order.orderNumber}:`,
        error.message,
      );
    }
  }
}

