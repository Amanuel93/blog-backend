// src/modules/auth/dto/register.dto.ts
import { IsEmail, IsString, MinLength, IsOptional, IsIn } from 'class-validator';
import { UserRole } from '../../users/entities/user.entity';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsIn([UserRole.ADMIN, UserRole.AUTHOR, UserRole.READER])
  role?: UserRole;
}
