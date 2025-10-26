import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min, IsOptional, IsString } from 'class-validator';

export class UpdateStockDto {
  @ApiProperty({
    description: 'New stock quantity',
    example: 100,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  stock: number;

  @ApiProperty({
    description: 'Low stock threshold',
    example: 10,
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  lowStockThreshold?: number;

  @ApiProperty({
    description: 'Reason for stock update',
    example: 'Restocking from supplier',
    required: false,
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

