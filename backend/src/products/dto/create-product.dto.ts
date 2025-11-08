import {
  IsString,
  IsOptional,
  IsArray,
  IsBoolean,
  IsEnum,
  IsUUID,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductStatus, ProductSeason } from '../entities/product.entity';
import { CreateProductVariantDto } from './create-product-variant.dto';

export class CreateProductDto {
  @ApiProperty({ example: 'iPhone 15 Pro', description: 'Product name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'iphone-15-pro', description: 'URL-friendly slug (auto-generated if not provided)' })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiPropertyOptional({ example: 'Latest iPhone with A17 Pro chip', description: 'Short product description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'Full product details with specifications...', description: 'Detailed product content (HTML supported)' })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiPropertyOptional({
    example: ['123e4567-e89b-12d3-a456-426614174000', '987e6543-e21b-34d5-b678-123456789abc'],
    description: 'Array of Category IDs'
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  categoryIds?: string[];

  @ApiPropertyOptional({
    example: ['https://example.com/img1.jpg', 'https://example.com/img2.jpg'],
    description: 'Array of product image URLs for slideshow'
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  imageUrls?: string[];

  @ApiPropertyOptional({ example: 'https://example.com/thumb.jpg', description: 'Thumbnail image URL' })
  @IsString()
  @IsOptional()
  thumbnailUrl?: string;

  @ApiProperty({
    type: [CreateProductVariantDto],
    description: 'Product variants (at least one required)',
    example: [{
      name: 'Black - 128GB',
      sku: 'IPHONE-15-BLK-128',
      price: 999.99,
      stock: 100,
      attributes: { color: 'Black', storage: '128GB' },
      isDefault: true
    }]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductVariantDto)
  @ArrayMinSize(1, { message: 'Product must have at least one variant' })
  variants: CreateProductVariantDto[];

  @ApiPropertyOptional({ enum: ProductStatus, example: ProductStatus.ACTIVE, description: 'Product status' })
  @IsEnum(ProductStatus)
  @IsOptional()
  status?: ProductStatus;

  @ApiPropertyOptional({ example: false, description: 'Whether product is featured' })
  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @ApiPropertyOptional({ example: ['smartphone', 'apple', 'ios'], description: 'Product tags' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({ example: 'Buy iPhone 15 Pro - Best Price', description: 'SEO title' })
  @IsString()
  @IsOptional()
  seoTitle?: string;

  @ApiPropertyOptional({ example: 'Get the latest iPhone 15 Pro with amazing features', description: 'SEO description' })
  @IsString()
  @IsOptional()
  seoDescription?: string;

  @ApiPropertyOptional({ example: ['iphone', 'smartphone', 'apple'], description: 'SEO keywords' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  seoKeywords?: string[];

  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Eco Impact ID (UUID) - references eco_impacts table'
  })
  @IsUUID('4')
  @IsOptional()
  ecoImpactId?: string;

  @ApiPropertyOptional({
    enum: ProductSeason,
    example: ProductSeason.SUMMER,
    description: 'Product season'
  })
  @IsEnum(ProductSeason)
  @IsOptional()
  season?: ProductSeason;

  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Product Condition ID (UUID) - references product_conditions table'
  })
  @IsUUID('4')
  @IsOptional()
  productConditionId?: string;
}

