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
  IsUUID,
  IsArray,
  ValidateNested
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PrivacyConsent } from '../../../domain/entities/user.entity';

/**
 * DTO específico para crear pacientes oncológicos
 * Incluye validaciones específicas para el contexto médico
 * Datos PHI protegidos con cifrado automático
 */
export class CreatePatientDto {
  @ApiProperty({
    description: 'Nombre completo del paciente',
    example: 'María Fernanda Rodríguez',
    minLength: 2,
    maxLength: 100
  })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(100, { message: 'El nombre no puede tener más de 100 caracteres' })
  @Transform(({ value }) => value?.trim())
  name: string;

  @ApiProperty({
    description: 'Email del paciente para acceso a la plataforma',
    example: 'maria.rodriguez@email.com',
    format: 'email',
    maxLength: 150
  })
  @IsEmail({}, { message: 'Debe proporcionar un email válido' })
  @MaxLength(150, { message: 'El email no puede tener más de 150 caracteres' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @ApiProperty({
    description: 'Contraseña segura para el paciente',
    example: 'PatientSecure123!',
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

  // Campos específicos de pacientes
  @IsOptional()
  @IsUUID(4, { message: 'El ID de institución debe ser un UUID válido' })
  institutionId?: string;

  @IsOptional()
  @IsArray({ message: 'Los consentimientos de privacidad deben ser un array' })
  @ValidateNested({ each: true })
  @Type(() => Object)
  privacyConsents?: PrivacyConsent[];

  // Información médica básica del paciente (datos PHI protegidos)
  @ApiPropertyOptional({
    description: 'Tipo de sangre del paciente',
    example: 'O+',
    pattern: '^(A|B|AB|O)[+-]$',
    maxLength: 5
  })
  @IsOptional()
  @IsString({ message: 'El tipo de sangre debe ser una cadena de texto' })
  @MaxLength(5, { message: 'El tipo de sangre no puede tener más de 5 caracteres' })
  @Matches(/^(A|B|AB|O)[+-]$/, { message: 'Tipo de sangre inválido (ej: A+, O-, AB+)' })
  bloodType?: string;

  @ApiPropertyOptional({
    description: 'Lista de alergias conocidas del paciente',
    example: ['Penicilina', 'Mariscos', 'Polen'],
    type: [String]
  })
  @IsOptional()
  @IsArray({ message: 'Las alergias deben ser un array' })
  @IsString({ each: true, message: 'Cada alergia debe ser una cadena de texto' })
  allergies?: string[];

  @ApiPropertyOptional({
    description: 'Condiciones médicas preexistentes',
    example: ['Diabetes Tipo 2', 'Hipertensión', 'Historial familiar de cáncer'],
    type: [String]
  })
  @IsOptional()
  @IsArray({ message: 'Las condiciones médicas deben ser un array' })
  @IsString({ each: true, message: 'Cada condición médica debe ser una cadena de texto' })
  medicalConditions?: string[];

  @ApiPropertyOptional({
    description: 'Contacto de emergencia del paciente',
    example: 'Carlos Rodríguez (Esposo) - Relación: Familiar directo',
    maxLength: 200
  })
  @IsOptional()
  @IsString({ message: 'El contacto de emergencia debe ser una cadena de texto' })
  @MaxLength(200, { message: 'El contacto de emergencia no puede tener más de 200 caracteres' })
  emergencyContact?: string;

  @ApiPropertyOptional({
    description: 'Teléfono del contacto de emergencia',
    example: '+57 301 234 5678',
    pattern: '^[\\+]?[1-9][\\d]{0,15}$',
    maxLength: 20
  })
  @IsOptional()
  @IsString({ message: 'El teléfono de emergencia debe ser una cadena de texto' })
  @MaxLength(20, { message: 'El teléfono de emergencia no puede tener más de 20 caracteres' })
  @Matches(/^[\+]?[1-9][\d]{0,15}$/, { 
    message: 'El teléfono de emergencia debe tener un formato válido' 
  })
  emergencyPhone?: string;
}