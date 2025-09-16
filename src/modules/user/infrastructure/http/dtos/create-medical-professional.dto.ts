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
  ValidateNested,
  IsIn,
  IsNotEmpty
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { MedicalRole, MedicalSpecialty } from '../../../domain/entities/user.entity';

/**
 * DTO específico para crear profesionales médicos
 * Incluye validaciones específicas para licencias y especialidades
 */
export class CreateMedicalProfessionalDto {
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
  @Min(18, { message: 'Los profesionales médicos deben ser mayores de 18 años' })
  @Max(80, { message: 'La edad debe ser menor a 80 años' })
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

  // Campos específicos de profesionales médicos
  @IsNotEmpty({ message: 'El rol médico es requerido para profesionales' })
  @IsIn([
    MedicalRole.DOCTOR, 
    MedicalRole.NURSE, 
    MedicalRole.SPECIALIST, 
    MedicalRole.ONCOLOGIST,
    MedicalRole.INSTITUTION_ADMIN
  ], { 
    message: 'Rol médico no válido para profesional'
  })
  medicalRole: MedicalRole;

  @IsNotEmpty({ message: 'El número de licencia médica es requerido' })
  @IsString({ message: 'El número de licencia médica debe ser una cadena' })
  @MaxLength(50, { message: 'El número de licencia no puede tener más de 50 caracteres' })
  @Matches(/^[A-Z0-9\-]{5,50}$/, { 
    message: 'El número de licencia debe tener un formato válido (letras mayúsculas, números y guiones)' 
  })
  medicalLicenseNumber: string;

  @IsNotEmpty({ message: 'El ID de institución es requerido para profesionales' })
  @IsUUID(4, { message: 'El ID de institución debe ser un UUID válido' })
  institutionId: string;

  @IsNotEmpty({ message: 'El creador es requerido para profesionales' })
  @IsString({ message: 'El creador debe ser una cadena de texto' })
  createdBy: string;

  @IsOptional()
  @IsArray({ message: 'Las especialidades deben ser un array' })
  @ValidateNested({ each: true })
  @Type(() => Object)
  specialties?: MedicalSpecialty[];

  // Información profesional adicional
  @IsOptional()
  @IsString({ message: 'La universidad debe ser una cadena de texto' })
  @MaxLength(150, { message: 'La universidad no puede tener más de 150 caracteres' })
  university?: string;

  @IsOptional()
  @IsInt({ message: 'El año de graduación debe ser un número entero' })
  @Min(1950, { message: 'El año de graduación debe ser posterior a 1950' })
  @Max(new Date().getFullYear(), { message: 'El año de graduación no puede ser futuro' })
  graduationYear?: number;

  @IsOptional()
  @IsArray({ message: 'Las certificaciones deben ser un array' })
  @IsString({ each: true, message: 'Cada certificación debe ser una cadena de texto' })
  certifications?: string[];

  @IsOptional()
  @IsInt({ message: 'Los años de experiencia deben ser un número entero' })
  @Min(0, { message: 'Los años de experiencia no pueden ser negativos' })
  @Max(60, { message: 'Los años de experiencia no pueden ser más de 60' })
  yearsOfExperience?: number;

  @IsOptional()
  @IsString({ message: 'La biografía debe ser una cadena de texto' })
  @MaxLength(1000, { message: 'La biografía no puede tener más de 1000 caracteres' })
  biography?: string;

  @IsOptional()
  @IsArray({ message: 'Los idiomas deben ser un array' })
  @IsString({ each: true, message: 'Cada idioma debe ser una cadena de texto' })
  languages?: string[];
}