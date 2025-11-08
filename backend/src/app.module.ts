import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WinstonModule } from 'nest-winston';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CategoriesModule } from './categories/categories.module';
import { ProductsModule } from './products/products.module';
import { User } from './users/entities/user.entity';
import { Category } from './categories/entities/category.entity';
import { Product } from './products/entities/product.entity';
import { ProductVariant } from './products/entities/product-variant.entity';
import { FilesModule } from './files/files.module';
import { File } from './files/entities/file.entity';
import { CartModule } from './cart/cart.module';
import { Cart } from './cart/entities/cart.entity';
import { OrdersModule } from './orders/orders.module';
import { Order } from './orders/entities/order.entity';
import { InventoryModule } from './inventory/inventory.module';
import { ProductImpactsModule } from './product-impacts/product-impacts.module';
import { ProductImpact } from './product-impacts/entities/product-impact.entity';
import { ClientUsersModule } from './client-users/client-users.module';
import { ClientUser } from './client-users/entities/client-user.entity';
import { EcoImpact } from './eco-impacts/entities/eco-impact.entity';
import { ProductCondition } from './product-conditions/entities/product-condition.entity';
import { CommonModule } from './common/common.module';
import { FavoritesModule } from './favorites/favorites.module';
import { FavoriteProduct } from './favorites/entities/favorite.entity';
import { VouchersModule } from './vouchers/vouchers.module';
import { Voucher } from './vouchers/entities/voucher.entity';
import { VoucherUsage } from './vouchers/entities/voucher-usage.entity';
import { DashboardModule } from './dashboard/dashboard.module';
import { winstonConfig } from './config/logger.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Winston Logger Module - chỉ log ra console
    WinstonModule.forRoot(winstonConfig),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: +configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        entities: [User, Category, Product, ProductVariant, File, Cart, Order, ProductImpact, ClientUser, EcoImpact, ProductCondition, FavoriteProduct, Voucher, VoucherUsage],
        synchronize: true,
        logging: false,
        uuidExtension: 'pgcrypto', // Sử dụng gen_random_uuid() thay vì uuid_generate_v4()
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    CategoriesModule,
    ProductsModule,
    FilesModule,
    CartModule,
    OrdersModule,
    InventoryModule,
    ProductImpactsModule,
    ClientUsersModule,
    CommonModule,
    FavoritesModule,
    VouchersModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
