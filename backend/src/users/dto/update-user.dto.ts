import { IsEmail, IsString, MinLength, IsEnum, IsOptional, IsInt, Min, Max, IsBoolean, IsIn } from 'class-validator';
import { USER_LEVELS } from '../../common/constants/user-levels.constant';

enum UserRole {
  SUPERADMIN = 'SUPERADMIN',
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  STAFF = 'STAFF',
  USER = 'USER',
}

const VALID_LEVELS = Object.values(USER_LEVELS);

export class UpdateUserDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @MinLength(6)
  @IsOptional()
  password?: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @IsInt()
  @Min(USER_LEVELS.USER)
  @Max(USER_LEVELS.SUPERADMIN)
  @IsIn(VALID_LEVELS, { message: `Level must be one of: ${VALID_LEVELS.join(', ')}` })
  @IsOptional()
  level?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

