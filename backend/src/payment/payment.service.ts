import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PayOS } from '@payos/node';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, PaymentStatus, OrderStatus } from '../orders/entities/order.entity';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private payOS: PayOS;

  constructor(
    private configService: ConfigService,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
  ) {
    const clientId = this.configService.get<string>('PAYOS_CLIENT_ID');
    const apiKey = this.configService.get<string>('PAYOS_API_KEY');
    const checksumKey = this.configService.get<string>('PAYOS_CHECKSUM_KEY');

    if (!clientId || !apiKey || !checksumKey) {
      this.logger.warn('PayOS credentials not configured');
    }

    this.payOS = new PayOS({
      clientId,
      apiKey,
      checksumKey,
    });
  }

  /**
   * Tạo Payment Link (QR Code) với PayOS
   */
  async createPaymentLink(dto: CreatePaymentDto) {
    try {
      // Tạo orderCode duy nhất (số nguyên)
      const orderCode = Number(Date.now().toString().slice(-9));

      const paymentData = {
        orderCode: orderCode,
        amount: dto.amount,
        description: dto.description,
        buyerName: dto.buyerName,
        buyerEmail: dto.buyerEmail,
        buyerPhone: dto.buyerPhone,
        buyerAddress: dto.buyerAddress,
        items: [
          {
            name: dto.description,
            quantity: 1,
            price: dto.amount,
          },
        ],
        returnUrl: this.configService.get<string>('PAYOS_RETURN_URL') ||
                   `${this.configService.get<string>('FRONTEND_URL')}/payment/success`,
        cancelUrl: this.configService.get<string>('PAYOS_CANCEL_URL') ||
                   `${this.configService.get<string>('FRONTEND_URL')}/payment/cancel`,
      };

      this.logger.log(`Creating payment link for order: ${dto.orderCode}`);
      const paymentLinkResponse = await this.payOS.paymentRequests.create(paymentData);
      return {
        success: true,
        data: {
          paymentUrl: paymentLinkResponse.checkoutUrl,
          qrCode: paymentLinkResponse.qrCode,
          orderCode: orderCode,
          amount: dto.amount,
          description: dto.description,
        },
      };
    } catch (error) {
      this.logger.error('Error creating payment link:', error);
      throw new BadRequestException(
        error.message || 'Failed to create payment link',
      );
    }
  }

  /**
   * Xác thực webhook từ PayOS
   */
  async verifyWebhookData(webhookData: any): Promise<any> {
    try {
      return this.payOS.webhooks.verify(webhookData);
    } catch (error) {
      this.logger.error('Webhook verification failed:', error);
      throw new BadRequestException('Invalid webhook signature');
    }
  }

  /**
   * Xử lý webhook callback từ PayOS
   */
  async handlePaymentWebhook(webhookData: any) {
    try {
      // Verify webhook signature
      const verifiedData = await this.verifyWebhookData(webhookData);

      this.logger.log(`Payment webhook received for order: ${verifiedData.orderCode}`);

      // Tìm order theo orderCode hoặc reference
      const order = await this.orderRepository.findOne({
        where: { orderNumber: verifiedData.data?.reference || verifiedData.orderCode.toString() },
      });

      if (!order) {
        this.logger.warn(`Order not found: ${verifiedData.orderCode}`);
        return {
          success: false,
          message: 'Order not found',
        };
      }

      // Cập nhật trạng thái thanh toán và order status
      if (verifiedData.code === '00' || verifiedData.data?.code === '00') {
        // Thanh toán thành công
        order.paymentStatus = PaymentStatus.PAID;

        // Tự động chuyển order status sang CONFIRMED khi thanh toán thành công
        if (order.status === OrderStatus.PENDING) {
          order.status = OrderStatus.CONFIRMED;
          this.logger.log(`Order ${order.orderNumber} status changed from PENDING to CONFIRMED`);
        }

        this.logger.log(`Order ${order.orderNumber} payment marked as PAID`);
      } else {
        // Thanh toán thất bại
        order.paymentStatus = PaymentStatus.FAILED;
        this.logger.log(`Order ${order.orderNumber} payment marked as FAILED`);
      }

      await this.orderRepository.save(order);

      return {
        success: true,
        message: 'Payment and order status updated',
        orderNumber: order.orderNumber,
        paymentStatus: order.paymentStatus,
        orderStatus: order.status,
      };
    } catch (error) {
      this.logger.error('Error handling payment webhook:', error);
      throw new BadRequestException('Failed to process webhook');
    }
  }

  /**
   * Kiểm tra trạng thái thanh toán
   */
  async getPaymentStatus(orderCode: number) {
    try {
      this.logger.log(`Getting payment status for order: ${orderCode}`);
      const paymentInfo = await this.payOS.paymentRequests.get(orderCode);
      return {
        success: true,
        data: paymentInfo,
      };
    } catch (error) {
      this.logger.error('Error getting payment status:', error);
      throw new BadRequestException('Failed to get payment status');
    }
  }

  /**
   * Hủy payment link
   */
  async cancelPaymentLink(orderCode: number) {
    try {
      const result = await this.payOS.paymentRequests.cancel(orderCode);
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      this.logger.error('Error canceling payment link:', error);
      throw new BadRequestException('Failed to cancel payment link');
    }
  }
}

