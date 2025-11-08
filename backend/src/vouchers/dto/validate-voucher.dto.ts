import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class ValidateVoucherDto {
  @ApiProperty({ example: 'FIRST50', description: 'Mã voucher cần validate' })
  @IsString()
  code: string;

  @ApiProperty({ example: 500000, description: 'Tổng giá trị đơn hàng (subtotal)' })
  @IsNumber()
  @Min(0)
  orderValue: number;

  @ApiPropertyOptional({ example: 'user-id-123', description: 'ID của user (nếu đã đăng nhập)' })
  @IsOptional()
  @IsString()
  clientUserId?: string;
}

export class ValidateVoucherResponseDto {
  @ApiProperty({ example: true, description: 'Voucher có hợp lệ không' })
  valid: boolean;

  @ApiProperty({ example: 250000, description: 'Số tiền được giảm' })
  discountAmount: number;

  @ApiPropertyOptional({ example: 'Voucher hợp lệ', description: 'Thông báo' })
  message?: string;

  @ApiPropertyOptional({ description: 'Thông tin voucher' })
  voucher?: {
    id: string;
    code: string;
    description: string;
    type: string;
    value: number;
  };
}

