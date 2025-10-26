import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsString,
  IsOptional,
  ValidateNested,
  IsNotEmpty,
  IsEmail,
  IsArray,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from '../entities/order.entity';

// Order item from request body (for guest checkout with localStorage cart)
export class OrderItemDto {
  @ApiProperty({ example: '767dc872-a17c-45f7-bf74-281f326ec4de' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ example: 2 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: 1000 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 'Thrift Dress', required: false })
  @IsString()
  @IsOptional()
  title?: string;
}

export class ShippingAddressDto {
  @ApiProperty({ example: 'Ngọc' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Lẫm' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: 'Diễn châu' })
  @IsString()
  @IsNotEmpty()
  address1: string;

  @ApiProperty({ example: '', required: false })
  @IsString()
  @IsOptional()
  address2?: string;

  @ApiProperty({ example: 'Vinh' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ example: '', required: false })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiProperty({ example: '', required: false })
  @IsString()
  @IsOptional()
  postalCode?: string;

  @ApiProperty({ example: '0982144693' })
  @IsString()
  @IsNotEmpty()
  phone: string;
}

// Original DTO (for authenticated users with database cart)
export class CreateOrderDto {
  @ApiProperty({
    enum: PaymentMethod,
    example: PaymentMethod.COD,
  })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty({ type: ShippingAddressDto })
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress: ShippingAddressDto;

  @ApiProperty({ example: 'Please deliver in the morning', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}

// Guest checkout DTO (with items from localStorage)
export class GuestCheckoutDto {
  @ApiProperty({ example: 'ngoclam.sn98@gmail.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Ngọc Lẫm' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: '0982144693' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ type: ShippingAddressDto })
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress: ShippingAddressDto;

  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiProperty({ example: 2000 })
  @IsNumber()
  @Min(0)
  subtotal: number;

  @ApiProperty({ example: 30000 })
  @IsNumber()
  @Min(0)
  shippingCost: number;

  @ApiProperty({ example: 200 })
  @IsNumber()
  @Min(0)
  tax: number;

  @ApiProperty({ example: 32200 })
  @IsNumber()
  @Min(0)
  total: number;

  @ApiProperty({ example: 'bundle', required: false })
  @IsString()
  @IsOptional()
  shippingMethod?: string;

  @ApiProperty({ example: 'cod' })
  @IsString()
  @IsNotEmpty()
  paymentMethod: string;

  @ApiProperty({ example: null, required: false })
  @IsString()
  @IsOptional()
  cartId?: string | null;

  @ApiProperty({ example: 'anon_382df5e0-e514-4ce3-bf2d-f4a347d46167', required: false })
  @IsString()
  @IsOptional()
  anonId?: string | null;
}

