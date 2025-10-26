import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsEnum, IsOptional, IsString } from 'class-validator';

export enum StockAdjustmentType {
  ADD = 'ADD',
  SUBTRACT = 'SUBTRACT',
  SET = 'SET',
}

export class AdjustStockDto {
  @ApiProperty({
    description: 'Type of stock adjustment',
    enum: StockAdjustmentType,
    example: StockAdjustmentType.ADD,
  })
  @IsEnum(StockAdjustmentType)
  type: StockAdjustmentType;

  @ApiProperty({
    description: 'Quantity to adjust',
    example: 50,
  })
  @IsInt()
  quantity: number;

  @ApiProperty({
    description: 'Reason for stock adjustment',
    example: 'Damaged goods',
    required: false,
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

