import { IsBoolean, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { ClientUserRole } from '../entities/client-user.entity';

export class UpdateClientUserDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEnum(ClientUserRole)
  @IsOptional()
  role?: ClientUserRole;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  emailVerified?: boolean;

  @IsString()
  @IsOptional()
  @MinLength(6)
  password?: string;
}

