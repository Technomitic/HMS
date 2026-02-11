import { IsEmail, IsString, MinLength, MaxLength, Matches, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string = '';

  @IsString()
  @MinLength(8)
  @MaxLength(32)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Password must contain uppercase, lowercase, number and special character',
  })
  password: string = '';

  @IsString()
  @MinLength(2)
  firstName: string = '';

  @IsString()
  @MinLength(2)
  lastName: string = '';

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  role?: string;
}

export class LoginDto {
  @IsEmail()
  email: string = '';

  @IsString()
  password: string = '';
}

export class RefreshTokenDto {
  @IsString()
  refreshToken: string = '';
}