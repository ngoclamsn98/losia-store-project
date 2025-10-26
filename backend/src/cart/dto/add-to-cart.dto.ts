import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsInt, Min } from 'class-validator';

export class AddToCartDto {
  @ApiProperty({
    description: 'Product variant ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  variantId: string;

  @ApiProperty({
    description: 'Quantity to add',
    example: 1,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  quantity: number;
}

