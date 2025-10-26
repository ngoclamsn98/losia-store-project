import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { MIN_LEVEL_KEY } from '../decorators/min-level.decorator';

@Injectable()
export class LevelGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredLevel = this.reflector.getAllAndOverride<number>(MIN_LEVEL_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (requiredLevel === undefined) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    if (user.level < requiredLevel) {
      throw new ForbiddenException(
        `Insufficient permissions. Required level: ${requiredLevel}, Your level: ${user.level}`,
      );
    }

    return true;
  }
}

