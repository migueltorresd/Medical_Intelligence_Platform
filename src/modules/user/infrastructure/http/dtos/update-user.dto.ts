import { PartialType, OmitType } from '@nestjs/mapped-types';
import { IsOptional, IsIn } from 'class-validator';
import { CreateUserDto } from './create-user.dto';
import { UserRole, UserStatus } from '../../../domain/entities/user.entity';

/**
 * DTO para actualizar un usuario
 * Aplica: Inheritance Pattern con PartialType
 * Hereda de CreateUserDto pero hace todos los campos opcionales
 * y omite el password por seguridad
 */
export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['password', 'email'] as const)
) {
  // Campos adicionales que pueden ser actualizados por administradores
  @IsOptional()
  @IsIn(['admin', 'moderator', 'user'])
  role?: UserRole;

  @IsOptional()
  @IsIn(['active', 'inactive', 'suspended'])
  status?: UserStatus;

  // El email y password no se pueden actualizar directamente
  // Para eso se crearán endpoints específicos como /change-password
}
