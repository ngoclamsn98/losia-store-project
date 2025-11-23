import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentWebhookDto } from './dto/payment-webhook.dto';

@ApiTags('payment')
@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('create-payment-link')
  @ApiOperation({ 
    summary: 'Tạo Payment Link (QR Code) với PayOS',
    description: 'Tạo link thanh toán và QR code để khách hàng quét mã thanh toán'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Payment link created successfully',
    schema: {
      example: {
        success: true,
        data: {
          paymentUrl: 'https://pay.payos.vn/web/...',
          qrCode: 'https://img.vietqr.io/image/...',
          orderCode: 123456789,
          amount: 100000,
          description: 'Thanh toán đơn hàng #ORD-001'
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid payment data' })
  createPaymentLink(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentService.createPaymentLink(createPaymentDto);
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Webhook callback từ PayOS',
    description: 'Endpoint để PayOS gửi thông báo khi thanh toán thành công/thất bại'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Webhook processed successfully',
    schema: {
      example: {
        success: true,
        message: 'Payment status updated',
        orderNumber: 'ORD-20231123-001',
        paymentStatus: 'PAID'
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid webhook signature' })
  handleWebhook(@Body() webhookData: PaymentWebhookDto) {
    return this.paymentService.handlePaymentWebhook(webhookData);
  }

  @Get('status/:orderCode')
  @ApiOperation({ 
    summary: 'Kiểm tra trạng thái thanh toán',
    description: 'Lấy thông tin chi tiết về trạng thái thanh toán'
  })
  @ApiParam({ name: 'orderCode', description: 'PayOS Order Code', example: 123456789 })
  @ApiResponse({ 
    status: 200, 
    description: 'Payment status retrieved successfully'
  })
  @ApiResponse({ status: 400, description: 'Failed to get payment status' })
  getPaymentStatus(@Param('orderCode') orderCode: string) {
    return this.paymentService.getPaymentStatus(Number(orderCode));
  }

  @Delete('cancel/:orderCode')
  @ApiOperation({ 
    summary: 'Hủy payment link',
    description: 'Hủy link thanh toán đã tạo'
  })
  @ApiParam({ name: 'orderCode', description: 'PayOS Order Code', example: 123456789 })
  @ApiResponse({ 
    status: 200, 
    description: 'Payment link cancelled successfully'
  })
  @ApiResponse({ status: 400, description: 'Failed to cancel payment link' })
  cancelPaymentLink(@Param('orderCode') orderCode: string) {
    return this.paymentService.cancelPaymentLink(Number(orderCode));
  }
}

