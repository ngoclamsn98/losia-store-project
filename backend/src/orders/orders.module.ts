import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { Order } from './entities/order.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { CartModule } from '../cart/cart.module';
import { VouchersModule } from '../vouchers/vouchers.module';

@Module({
  imports: [TypeOrmModule.forFeature([Order, ProductVariant]), CartModule, VouchersModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}

