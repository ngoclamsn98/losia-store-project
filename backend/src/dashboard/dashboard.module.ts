import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Order } from '../orders/entities/order.entity';
import { Product } from '../products/entities/product.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { Category } from '../categories/entities/category.entity';
import { User } from '../users/entities/user.entity';
import { ClientUser } from '../client-users/entities/client-user.entity';
import { File } from '../files/entities/file.entity';
import { Voucher } from '../vouchers/entities/voucher.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      Product,
      ProductVariant,
      Category,
      User,
      ClientUser,
      File,
      Voucher,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}

