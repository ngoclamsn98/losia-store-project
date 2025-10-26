import { ApiProperty } from '@nestjs/swagger';

export class UploadResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'product-image.jpg' })
  originalName: string;

  @ApiProperty({ example: 'losia_store/products/abc123.jpg' })
  fileName: string;

  @ApiProperty({ example: 'https://res.cloudinary.com/dqhjujezw/image/upload/v1234567890/losia_store/products/abc123.jpg' })
  fileUrl: string;

  @ApiProperty({ example: 'losia_store/products/abc123' })
  publicId: string;

  @ApiProperty({ example: 'IMAGE' })
  type: string;

  @ApiProperty({ example: 'image/jpeg' })
  mimeType: string;

  @ApiProperty({ example: 102400 })
  size: number;

  @ApiProperty({ example: 1920, required: false })
  width?: number;

  @ApiProperty({ example: 1080, required: false })
  height?: number;
}

