import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductImpactsService } from './product-impacts.service';
import { ProductImpactsController } from './product-impacts.controller';
import { ProductImpact } from './entities/product-impact.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ProductImpact])],
  controllers: [ProductImpactsController],
  providers: [ProductImpactsService],
  exports: [ProductImpactsService],
})
export class ProductImpactsModule {}

