import { IsString, IsOptional, IsNumber, IsBoolean, IsObject, Min, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductVariantDto {
  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Variant ID (only for updates)' })
  @IsUUID('4')
  @IsOptional()
  id?: string;

  @ApiPropertyOptional({ example: 'IPHONE-15-BLK-128', description: 'Stock Keeping Unit' })
  @IsString()
  @IsOptional()
  sku?: string;

  @ApiPropertyOptional({ example: 'Black - 128GB', description: 'Variant name' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    example: { color: 'Black', storage: '128GB' },
    description: 'Variant attributes as key-value pairs'
  })
  @IsObject()
  @IsOptional()
  attributes?: Record<string, string>;

  @ApiProperty({ example: 999.99, description: 'Selling price' })
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  price: number;

  @ApiPropertyOptional({ example: 1199.99, description: 'Original price for comparison' })
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  @Min(0)
  compareAtPrice?: number;

  @ApiPropertyOptional({ example: 750.00, description: 'Cost price' })
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  @Min(0)
  costPrice?: number;

  @ApiPropertyOptional({ example: 100, description: 'Stock quantity' })
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  @Min(0)
  stock?: number;

  @ApiPropertyOptional({ example: 10, description: 'Low stock alert threshold' })
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  @Min(0)
  lowStockThreshold?: number;

  @ApiPropertyOptional({ example: 'https://example.com/images/iphone-black.jpg', description: 'Variant image URL' })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional({ example: 200, description: 'Weight in grams' })
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  @Min(0)
  weight?: number;

  @ApiPropertyOptional({ example: true, description: 'Whether this is the default variant' })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @ApiPropertyOptional({ example: true, description: 'Whether the variant is active' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

