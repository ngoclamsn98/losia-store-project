import { IsEmail, IsNotEmpty, IsString, MinLength, IsEnum, IsOptional, IsInt, Min, Max, IsIn } from 'class-validator';
import { USER_LEVELS } from '../../common/constants/user-levels.constant';

enum UserRole {
  SUPERADMIN = 'SUPERADMIN',
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  STAFF = 'STAFF',
  USER = 'USER',
}

enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}

const VALID_LEVELS = Object.values(USER_LEVELS);

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

  @IsString()
  @IsOptional()
  address?: string;

  @IsEnum(UserRole)
  @IsNotEmpty()
  role: UserRole;

  @IsInt()
  @Min(USER_LEVELS.USER)
  @Max(USER_LEVELS.SUPERADMIN)
  @IsIn(VALID_LEVELS, { message: `Level must be one of: ${VALID_LEVELS.join(', ')}` })
  @IsNotEmpty()
  level: number;
}

