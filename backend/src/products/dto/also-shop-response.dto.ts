import { ApiProperty } from '@nestjs/swagger';

export class ProductMiniDto {
  @ApiProperty({ description: 'Product ID' })
  id: string;

  @ApiProperty({ description: 'Product slug for URL', required: false })
  slug?: string;

  @ApiProperty({ description: 'Product image URL' })
  image: string;

  @ApiProperty({ description: 'Product title/name' })
  title: string;

  @ApiProperty({ description: 'Product size', required: false, nullable: true })
  size?: string | null;

  @ApiProperty({ description: 'Product price', required: false, nullable: true })
  price?: number | null;

  @ApiProperty({ description: 'Product retail/compare price', required: false, nullable: true })
  retailPrice?: number | null;
}

export class BrandGroupDto {
  @ApiProperty({ description: 'Brand name' })
  brand: string;

  @ApiProperty({ description: 'List of products from this brand', type: [ProductMiniDto] })
  products: ProductMiniDto[];
}

