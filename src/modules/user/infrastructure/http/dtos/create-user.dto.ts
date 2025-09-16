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
  IsIn,
  IsArray,
  IsUUID,
  ValidateNested
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MedicalRole, MedicalSpecialty, PrivacyConsent } from '../../../domain/entities/user.entity';

/**
 * DTO para crear un nuevo usuario médico
 * Aplica: Data Transfer Object Pattern
 * Valida los datos de entrada usando class-validator
 * Compatible con roles médicos y seguridad PHI/PII
 */
export class CreateUserDto {
  @ApiProperty({
    description: 'Nombre completo del usuario',
    example: 'Dr. Juan Carlos Pérez',
    minLength: 2,
    maxLength: 100,
    type: String
  })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(100, { message: 'El nombre no puede tener más de 100 caracteres' })
  @Transform(({ value }) => value?.trim())
  name: string;

  @ApiProperty({
    description: 'Email único del usuario (será usado para login)',
    example: 'doctor.perez@hospital-abc.com',
    format: 'email',
    maxLength: 150,
    uniqueItems: true
  })
  @IsEmail({}, { message: 'Debe proporcionar un email válido' })
  @MaxLength(150, { message: 'El email no puede tener más de 150 caracteres' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @ApiProperty({
    description: 'Contraseña segura con requisitos médicos. Debe contener: 1 minúscula, 1 mayúscula, 1 número, 1 símbolo especial',
    example: 'MedicalPass123!',
    minLength: 8,
    maxLength: 50,
    pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'
  })
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

  @ApiPropertyOptional({
    description: 'Edad del usuario',
    example: 45,
    minimum: 1,
    maximum: 120,
    type: Number
  })
  @IsOptional()
  @IsInt({ message: 'La edad debe ser un número entero' })
  @Min(1, { message: 'La edad debe ser mayor a 0' })
  @Max(120, { message: 'La edad debe ser menor a 120' })
  age?: number;

  @ApiPropertyOptional({
    description: 'Número telefónico de contacto',
    example: '+57 300 123 4567',
    pattern: '^[\\+]?[1-9][\\d]{0,15}$',
    maxLength: 20
  })
  @IsOptional()
  @IsString({ message: 'El teléfono debe ser una cadena de texto' })
  @MaxLength(20, { message: 'El teléfono no puede tener más de 20 caracteres' })
  @Matches(/^[\+]?[1-9][\d]{0,15}$/, { 
    message: 'El teléfono debe tener un formato válido' 
  })
  phone?: string;

  @ApiPropertyOptional({
    description: 'Ciudad de residencia del usuario',
    example: 'Bogotá',
    maxLength: 100
  })
  @IsOptional()
  @IsString({ message: 'La ciudad debe ser una cadena de texto' })
  @MaxLength(100, { message: 'La ciudad no puede tener más de 100 caracteres' })
  @Transform(({ value }) => value?.trim())
  city?: string;

  @ApiPropertyOptional({
    description: 'Roles médicos del usuario (puede tener múltiples)',
    example: ['doctor', 'oncologist'],
    enum: MedicalRole,
    isArray: true,
    default: ['user']
  })
  @IsOptional()
  @IsArray({ message: 'Los roles médicos deben ser un array' })
  @IsIn(Object.values(MedicalRole), { each: true, message: 'Rol médico no válido' })
  medicalRoles?: MedicalRole[];

  @ApiPropertyOptional({
    description: 'ID de la institución médica asociada',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    format: 'uuid'
  })
  @IsOptional()
  @IsUUID(4, { message: 'El ID de institución debe ser un UUID válido' })
  institutionId?: string;

  @ApiPropertyOptional({
    description: 'Número de licencia médica profesional',
    example: 'MED-12345-COL',
    maxLength: 50
  })
  @IsOptional()
  @IsString({ message: 'El número de licencia médica debe ser una cadena' })
  @MaxLength(50, { message: 'El número de licencia no puede tener más de 50 caracteres' })
  medicalLicenseNumber?: string;

  @ApiPropertyOptional({
    description: 'Especialidades médicas del profesional',
    example: [
      {
        "id": "oncology-001",
        "name": "Oncología Médica",
        "category": "Especialidad",
        "licenseRequired": true
      }
    ],
    type: [Object]
  })
  @IsOptional()
  @IsArray({ message: 'Las especialidades deben ser un array' })
  @ValidateNested({ each: true })
  @Type(() => Object)
  specialties?: MedicalSpecialty[];

  @ApiPropertyOptional({
    description: 'Consentimientos de privacidad otorgados por el usuario',
    example: [
      {
        "type": "data_processing",
        "granted": true,
        "timestamp": "2024-01-15T10:30:00Z",
        "version": "1.0"
      }
    ],
    type: [Object]
  })
  @IsOptional()
  @IsArray({ message: 'Los consentimientos de privacidad deben ser un array' })
  @ValidateNested({ each: true })
  @Type(() => Object)
  privacyConsents?: PrivacyConsent[];

  @ApiPropertyOptional({
    description: 'ID del usuario que crea este registro (para auditoría)',
    example: 'admin-user-123'
  })
  @IsOptional()
  @IsString({ message: 'El creador debe ser una cadena de texto' })
  createdBy?: string;
}
