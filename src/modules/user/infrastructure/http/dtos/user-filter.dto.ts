import { IsOptional, IsString, IsEmail, IsIn } from 'class-validator';

export class UserFilterDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsIn(['admin', 'moderator', 'user'])
  role?: string;

  @IsOptional()
  @IsIn(['active', 'inactive', 'suspended'])
  status?: string;

  @IsOptional()
  @IsString()
  city?: string;
}
