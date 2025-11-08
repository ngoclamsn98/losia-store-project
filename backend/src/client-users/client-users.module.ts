import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientUsersController } from './client-users.controller';
import { ClientAuthController } from './client-auth.controller';
import { ClientUsersService } from './client-users.service';
import { ClientUser } from './entities/client-user.entity';
import { ClientJwtStrategy } from './strategies/client-jwt.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([ClientUser]),
    PassportModule,
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
  providers: [ClientUsersService, ClientJwtStrategy],
  exports: [ClientUsersService],
})
export class ClientUsersModule {}

