import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { Product } from './entities/product.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { Category } from '../categories/entities/category.entity';
import { EcoImpact } from '../eco-impacts/entities/eco-impact.entity';
import { ProductCondition } from '../product-conditions/entities/product-condition.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Product, ProductVariant, Category, EcoImpact, ProductCondition])],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}

