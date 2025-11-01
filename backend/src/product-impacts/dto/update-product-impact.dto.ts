import { PartialType } from '@nestjs/mapped-types';
import { CreateProductImpactDto } from './create-product-impact.dto';

export class UpdateProductImpactDto extends PartialType(CreateProductImpactDto) {}

