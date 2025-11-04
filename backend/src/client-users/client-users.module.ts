import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientUsersController } from './client-users.controller';
import { ClientAuthController } from './client-auth.controller';
import { ClientUsersService } from './client-users.service';
import { ClientUser } from './entities/client-user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ClientUser]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [ClientUsersController, ClientAuthController],
  providers: [ClientUsersService],
  exports: [ClientUsersService],
})
export class ClientUsersModule {}

