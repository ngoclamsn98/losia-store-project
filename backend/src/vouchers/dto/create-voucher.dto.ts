import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsNumber, IsOptional, IsBoolean, IsDate, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { VoucherType, VoucherStatus } from '../entities/voucher.entity';

export class CreateVoucherDto {
  @ApiProperty({ example: 'FIRST50', description: 'Mã voucher (unique)' })
  @IsString()
  code: string;

  @ApiPropertyOptional({ example: 'Giảm 50% cho đơn hàng đầu tiên', description: 'Mô tả voucher' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: VoucherType, example: VoucherType.PERCENTAGE, description: 'Loại voucher' })
  @IsEnum(VoucherType)
  type: VoucherType;

  @ApiProperty({ example: 50, description: 'Giá trị giảm (% hoặc số tiền)' })
  @IsNumber()
  @Min(0)
  value: number;

  @ApiPropertyOptional({ example: 100000, description: 'Giá trị đơn hàng tối thiểu' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minOrderValue?: number;

  @ApiPropertyOptional({ example: 200000, description: 'Giảm tối đa (cho loại PERCENTAGE)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxDiscount?: number;

  @ApiPropertyOptional({ example: 100, description: 'Số lượng voucher có thể sử dụng' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  usageLimit?: number;

  @ApiPropertyOptional({ example: 1, description: 'Giới hạn số lần sử dụng mỗi user' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  usageLimitPerUser?: number;

  @ApiPropertyOptional({ example: '2024-01-01T00:00:00Z', description: 'Ngày bắt đầu' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @ApiPropertyOptional({ example: '2024-12-31T23:59:59Z', description: 'Ngày kết thúc' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;

  @ApiPropertyOptional({ example: false, description: 'Chỉ dành cho khách hàng mới' })
  @IsOptional()
  @IsBoolean()
  isFirstPurchaseOnly?: boolean;

  @ApiPropertyOptional({ example: false, description: 'Chỉ dành cho khách hàng đã đăng nhập' })
  @IsOptional()
  @IsBoolean()
  isAuthenticatedOnly?: boolean;

  @ApiPropertyOptional({ enum: VoucherStatus, example: VoucherStatus.ACTIVE, description: 'Trạng thái voucher' })
  @IsOptional()
  @IsEnum(VoucherStatus)
  status?: VoucherStatus;
}

