import { IsString, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductImpactDto {
  @ApiProperty({ 
    example: 'Váy (Dress)', 
    description: 'Product group name (e.g., Dress, Top, Jeans)' 
  })
  @IsString()
  productGroup: string;

  @ApiProperty({ 
    example: 2083.33, 
    description: 'Glasses of water saved (equivalent)' 
  })
  @IsNumber()
  @Min(0)
  glassesOfWater: number;

  @ApiProperty({ 
    example: 100.0, 
    description: 'Hours of LED lighting saved (equivalent)' 
  })
  @IsNumber()
  @Min(0)
  hoursOfLighting: number;

  @ApiProperty({ 
    example: 8.39, 
    description: 'Kilometers of driving emissions saved (equivalent)' 
  })
  @IsNumber()
  @Min(0)
  kmsOfDriving: number;
}

