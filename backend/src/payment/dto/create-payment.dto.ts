import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsNotEmpty, Min, IsOptional } from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty({ 
    example: 'ORD-20231123-001',
    description: 'Order number or unique identifier'
  })
  @IsString()
  @IsNotEmpty()
  orderCode: string;

  @ApiProperty({ 
    example: 100000,
    description: 'Amount in VND'
  })
  @IsNumber()
  @Min(1000)
  amount: number;

  @ApiProperty({ 
    example: 'Thanh toán đơn hàng #ORD-20231123-001',
    description: 'Payment description'
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ 
    example: 'Nguyễn Văn A',
    description: 'Buyer name',
    required: false
  })
  @IsString()
  @IsOptional()
  buyerName?: string;

  @ApiProperty({ 
    example: 'nguyenvana@gmail.com',
    description: 'Buyer email',
    required: false
  })
  @IsString()
  @IsOptional()
  buyerEmail?: string;

  @ApiProperty({ 
    example: '0987654321',
    description: 'Buyer phone',
    required: false
  })
  @IsString()
  @IsOptional()
  buyerPhone?: string;

  @ApiProperty({ 
    example: 'Hà Nội',
    description: 'Buyer address',
    required: false
  })
  @IsString()
  @IsOptional()
  buyerAddress?: string;
}

