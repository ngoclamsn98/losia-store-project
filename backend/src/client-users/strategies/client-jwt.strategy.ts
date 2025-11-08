import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientUser } from '../entities/client-user.entity';

export interface ClientJwtPayload {
  sub: string;
  email: string;
  role: string;
  type: string;
}

@Injectable()
export class ClientJwtStrategy extends PassportStrategy(Strategy, 'client-jwt') {
  constructor(
    private configService: ConfigService,
    @InjectRepository(ClientUser)
    private clientUserRepository: Repository<ClientUser>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'default-secret-key',
    });
  }

  async validate(payload: ClientJwtPayload) {
    // Check if token is for client users
    if (payload.type !== 'client') {
      throw new UnauthorizedException('Invalid token type');
    }

    const user = await this.clientUserRepository.findOne({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      phone: user.phone,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
    };
  }
}

