import { 
  IsEmail, 
  IsString, 
  IsOptional, 
  IsInt, 
  MinLength, 
  MaxLength, 
  Min, 
  Max, 
  Matches,
  IsIn 
} from 'class-validator';
import { Transform } from 'class-transformer';
import { UserRole } from '../../../domain/entities/user.entity';

/**
 * DTO para crear un nuevo usuario
 * Aplica: Data Transfer Object Pattern
 * Valida los datos de entrada usando class-validator
 */
export class CreateUserDto {
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(100, { message: 'El nombre no puede tener más de 100 caracteres' })
  @Transform(({ value }) => value?.trim())
  name: string;

  @IsEmail({}, { message: 'Debe proporcionar un email válido' })
  @MaxLength(150, { message: 'El email no puede tener más de 150 caracteres' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @MaxLength(50, { message: 'La contraseña no puede tener más de 50 caracteres' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    {
      message: 'La contraseña debe contener al menos: 1 minúscula, 1 mayúscula, 1 número y 1 símbolo especial'
    }
  )
  password: string;

  @IsOptional()
  @IsInt({ message: 'La edad debe ser un número entero' })
  @Min(1, { message: 'La edad debe ser mayor a 0' })
  @Max(120, { message: 'La edad debe ser menor a 120' })
  age?: number;

  @IsOptional()
  @IsString({ message: 'El teléfono debe ser una cadena de texto' })
  @MaxLength(20, { message: 'El teléfono no puede tener más de 20 caracteres' })
  @Matches(/^[\+]?[1-9][\d]{0,15}$/, { 
    message: 'El teléfono debe tener un formato válido' 
  })
  phone?: string;

  @IsOptional()
  @IsString({ message: 'La ciudad debe ser una cadena de texto' })
  @MaxLength(100, { message: 'La ciudad no puede tener más de 100 caracteres' })
  @Transform(({ value }) => value?.trim())
  city?: string;

  @IsOptional()
  @IsIn(['admin', 'moderator', 'user'])
  role?: UserRole;
}
