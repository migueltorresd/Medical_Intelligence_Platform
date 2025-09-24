import { 
  IsString, 
  IsEmail, 
  IsPhoneNumber, 
  IsEnum, 
  IsOptional, 
  IsBoolean, 
  IsDateString, 
  IsNumber, 
  Min, 
  Max, 
  IsUUID, 
  Length, 
  Matches, 
  IsDecimal,
  ValidateIf,
  IsNotEmpty
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { Gender, BloodType, PatientStatus, InsuranceType } from '../../domain/entities/patient.entity';

export class CreatePatientDto {
  @ApiProperty({ 
    description: 'Patient first name', 
    example: 'John',
    minLength: 1,
    maxLength: 100
  })
  @IsString({ message: 'First name must be a string' })
  @IsNotEmpty({ message: 'First name is required' })
  @Length(1, 100, { message: 'First name must be between 1 and 100 characters' })
  @Transform(({ value }) => value?.trim())
  firstName: string;

  @ApiProperty({ 
    description: 'Patient last name', 
    example: 'Doe',
    minLength: 1,
    maxLength: 100
  })
  @IsString({ message: 'Last name must be a string' })
  @IsNotEmpty({ message: 'Last name is required' })
  @Length(1, 100, { message: 'Last name must be between 1 and 100 characters' })
  @Transform(({ value }) => value?.trim())
  lastName: string;

  @ApiPropertyOptional({ 
    description: 'Patient middle name', 
    example: 'Michael',
    maxLength: 100
  })
  @IsOptional()
  @IsString({ message: 'Middle name must be a string' })
  @Length(1, 100, { message: 'Middle name must be between 1 and 100 characters' })
  @Transform(({ value }) => value?.trim())
  middleName?: string;

  @ApiProperty({ 
    description: 'Date of birth in ISO format', 
    example: '1990-05-15',
    format: 'date'
  })
  @IsDateString({}, { message: 'Date of birth must be a valid date' })
  @Transform(({ value }) => {
    // Ensure the date is not in the future and patient is not older than 150 years
    const date = new Date(value);
    const today = new Date();
    const minDate = new Date();
    minDate.setFullYear(today.getFullYear() - 150);
    
    if (date > today) {
      throw new Error('Date of birth cannot be in the future');
    }
    if (date < minDate) {
      throw new Error('Date of birth cannot be more than 150 years ago');
    }
    
    return value;
  })
  dateOfBirth: string;

  @ApiProperty({ 
    description: 'Patient gender', 
    enum: Gender,
    example: Gender.MALE
  })
  @IsEnum(Gender, { message: 'Gender must be a valid enum value' })
  gender: Gender;

  @ApiPropertyOptional({ 
    description: 'Patient email address', 
    example: 'john.doe@email.com',
    format: 'email'
  })
  @IsOptional()
  @IsEmail({}, { message: 'Email must be a valid email address' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email?: string;

  @ApiPropertyOptional({ 
    description: 'Patient phone number', 
    example: '+1234567890',
    pattern: '^\\+[1-9]\\d{1,14}$'
  })
  @IsOptional()
  @IsString({ message: 'Phone number must be a string' })
  @Matches(/^\+[1-9]\d{1,14}$/, { 
    message: 'Phone number must be in international format (+1234567890)' 
  })
  phoneNumber?: string;

  @ApiPropertyOptional({ 
    description: 'Patient blood type', 
    enum: BloodType,
    example: BloodType.A_POSITIVE
  })
  @IsOptional()
  @IsEnum(BloodType, { message: 'Blood type must be a valid enum value' })
  bloodType?: BloodType;

  @ApiPropertyOptional({ 
    description: 'Patient height in centimeters', 
    example: 175,
    minimum: 30,
    maximum: 300
  })
  @IsOptional()
  @IsNumber({}, { message: 'Height must be a number' })
  @Min(30, { message: 'Height must be at least 30 cm' })
  @Max(300, { message: 'Height cannot exceed 300 cm' })
  height?: number;

  @ApiPropertyOptional({ 
    description: 'Patient weight in kilograms', 
    example: 70.5,
    minimum: 0.5,
    maximum: 1000
  })
  @IsOptional()
  @IsNumber({}, { message: 'Weight must be a number' })
  @Min(0.5, { message: 'Weight must be at least 0.5 kg' })
  @Max(1000, { message: 'Weight cannot exceed 1000 kg' })
  weight?: number;

  @ApiPropertyOptional({ 
    description: 'Known allergies', 
    example: 'Penicillin, Nuts, Shellfish',
    maxLength: 1000
  })
  @IsOptional()
  @IsString({ message: 'Allergies must be a string' })
  @Length(0, 1000, { message: 'Allergies must not exceed 1000 characters' })
  @Transform(({ value }) => value?.trim())
  allergies?: string;

  @ApiPropertyOptional({ 
    description: 'Current medications', 
    example: 'Metformin 500mg twice daily, Lisinopril 10mg daily',
    maxLength: 2000
  })
  @IsOptional()
  @IsString({ message: 'Medications must be a string' })
  @Length(0, 2000, { message: 'Medications must not exceed 2000 characters' })
  @Transform(({ value }) => value?.trim())
  medications?: string;

  @ApiPropertyOptional({ 
    description: 'Medical history', 
    example: 'Type 2 Diabetes (2015), Hypertension (2018)',
    maxLength: 3000
  })
  @IsOptional()
  @IsString({ message: 'Medical history must be a string' })
  @Length(0, 3000, { message: 'Medical history must not exceed 3000 characters' })
  @Transform(({ value }) => value?.trim())
  medicalHistory?: string;

  @ApiPropertyOptional({ 
    description: 'Family medical history', 
    example: 'Father: Heart Disease, Mother: Diabetes, Sister: Breast Cancer',
    maxLength: 2000
  })
  @IsOptional()
  @IsString({ message: 'Family medical history must be a string' })
  @Length(0, 2000, { message: 'Family medical history must not exceed 2000 characters' })
  @Transform(({ value }) => value?.trim())
  familyMedicalHistory?: string;

  // Address Information
  @ApiPropertyOptional({ 
    description: 'Street address', 
    example: '123 Main Street, Apt 4B',
    maxLength: 200
  })
  @IsOptional()
  @IsString({ message: 'Address must be a string' })
  @Length(0, 200, { message: 'Address must not exceed 200 characters' })
  @Transform(({ value }) => value?.trim())
  address?: string;

  @ApiPropertyOptional({ 
    description: 'City', 
    example: 'New York',
    maxLength: 100
  })
  @IsOptional()
  @IsString({ message: 'City must be a string' })
  @Length(0, 100, { message: 'City must not exceed 100 characters' })
  @Transform(({ value }) => value?.trim())
  city?: string;

  @ApiPropertyOptional({ 
    description: 'State or Province', 
    example: 'NY',
    maxLength: 100
  })
  @IsOptional()
  @IsString({ message: 'State must be a string' })
  @Length(0, 100, { message: 'State must not exceed 100 characters' })
  @Transform(({ value }) => value?.trim())
  state?: string;

  @ApiPropertyOptional({ 
    description: 'ZIP or Postal Code', 
    example: '10001',
    maxLength: 20
  })
  @IsOptional()
  @IsString({ message: 'ZIP code must be a string' })
  @Length(0, 20, { message: 'ZIP code must not exceed 20 characters' })
  @Transform(({ value }) => value?.trim())
  zipCode?: string;

  @ApiPropertyOptional({ 
    description: 'Country', 
    example: 'United States',
    maxLength: 100
  })
  @IsOptional()
  @IsString({ message: 'Country must be a string' })
  @Length(0, 100, { message: 'Country must not exceed 100 characters' })
  @Transform(({ value }) => value?.trim())
  country?: string;

  // Emergency Contact
  @ApiPropertyOptional({ 
    description: 'Emergency contact name', 
    example: 'Jane Doe',
    maxLength: 100
  })
  @IsOptional()
  @IsString({ message: 'Emergency contact name must be a string' })
  @Length(0, 100, { message: 'Emergency contact name must not exceed 100 characters' })
  @Transform(({ value }) => value?.trim())
  emergencyContactName?: string;

  @ApiPropertyOptional({ 
    description: 'Emergency contact phone', 
    example: '+1987654321',
    pattern: '^\\+[1-9]\\d{1,14}$'
  })
  @IsOptional()
  @IsString({ message: 'Emergency contact phone must be a string' })
  @Matches(/^\+[1-9]\d{1,14}$/, { 
    message: 'Emergency contact phone must be in international format' 
  })
  emergencyContactPhone?: string;

  @ApiPropertyOptional({ 
    description: 'Emergency contact relationship', 
    example: 'Spouse',
    maxLength: 50
  })
  @IsOptional()
  @IsString({ message: 'Emergency contact relationship must be a string' })
  @Length(0, 50, { message: 'Emergency contact relationship must not exceed 50 characters' })
  @Transform(({ value }) => value?.trim())
  emergencyContactRelationship?: string;

  // Insurance Information
  @ApiPropertyOptional({ 
    description: 'Insurance type', 
    enum: InsuranceType,
    example: InsuranceType.PRIVATE
  })
  @IsOptional()
  @IsEnum(InsuranceType, { message: 'Insurance type must be a valid enum value' })
  insuranceType?: InsuranceType;

  @ApiPropertyOptional({ 
    description: 'Insurance provider name', 
    example: 'Blue Cross Blue Shield',
    maxLength: 100
  })
  @ValidateIf((o) => o.insuranceType && o.insuranceType !== InsuranceType.NONE)
  @IsString({ message: 'Insurance provider must be a string' })
  @Length(1, 100, { message: 'Insurance provider must be between 1 and 100 characters' })
  @Transform(({ value }) => value?.trim())
  insuranceProvider?: string;

  @ApiPropertyOptional({ 
    description: 'Insurance policy number', 
    example: 'BC123456789',
    maxLength: 50
  })
  @ValidateIf((o) => o.insuranceType && o.insuranceType !== InsuranceType.NONE)
  @IsString({ message: 'Insurance policy number must be a string' })
  @Length(1, 50, { message: 'Insurance policy number must be between 1 and 50 characters' })
  @Transform(({ value }) => value?.trim())
  insurancePolicyNumber?: string;

  @ApiPropertyOptional({ 
    description: 'Insurance group number', 
    example: 'GRP001',
    maxLength: 50
  })
  @IsOptional()
  @IsString({ message: 'Insurance group number must be a string' })
  @Length(0, 50, { message: 'Insurance group number must not exceed 50 characters' })
  @Transform(({ value }) => value?.trim())
  insuranceGroupNumber?: string;

  // Administrative
  @ApiPropertyOptional({ 
    description: 'Institution ID where patient will be registered', 
    example: 'uuid-institution'
  })
  @IsOptional()
  @IsUUID(4, { message: 'Institution ID must be a valid UUID' })
  institutionId?: string;

  @ApiPropertyOptional({ 
    description: 'Primary physician ID', 
    example: 'uuid-physician'
  })
  @IsOptional()
  @IsUUID(4, { message: 'Primary physician ID must be a valid UUID' })
  primaryPhysicianId?: string;

  // Compliance
  @ApiProperty({ 
    description: 'HIPAA consent acknowledgment', 
    example: true
  })
  @IsBoolean({ message: 'HIPAA consent must be a boolean value' })
  hipaaConsent: boolean;

  @ApiPropertyOptional({ 
    description: 'Data sharing consent', 
    example: false
  })
  @IsOptional()
  @IsBoolean({ message: 'Data sharing consent must be a boolean value' })
  dataSharingConsent?: boolean;

  @ApiPropertyOptional({ 
    description: 'Marketing communications consent', 
    example: false
  })
  @IsOptional()
  @IsBoolean({ message: 'Marketing consent must be a boolean value' })
  marketingConsent?: boolean;
}

export class UpdatePatientDto {
  @ApiPropertyOptional({ 
    description: 'Patient first name', 
    example: 'John',
    maxLength: 100
  })
  @IsOptional()
  @IsString({ message: 'First name must be a string' })
  @Length(1, 100, { message: 'First name must be between 1 and 100 characters' })
  @Transform(({ value }) => value?.trim())
  firstName?: string;

  @ApiPropertyOptional({ 
    description: 'Patient last name', 
    example: 'Doe',
    maxLength: 100
  })
  @IsOptional()
  @IsString({ message: 'Last name must be a string' })
  @Length(1, 100, { message: 'Last name must be between 1 and 100 characters' })
  @Transform(({ value }) => value?.trim())
  lastName?: string;

  @ApiPropertyOptional({ 
    description: 'Patient middle name', 
    example: 'Michael',
    maxLength: 100
  })
  @IsOptional()
  @IsString({ message: 'Middle name must be a string' })
  @Length(1, 100, { message: 'Middle name must be between 1 and 100 characters' })
  @Transform(({ value }) => value?.trim())
  middleName?: string;

  @ApiPropertyOptional({ 
    description: 'Patient email address', 
    example: 'john.doe@email.com',
    format: 'email'
  })
  @IsOptional()
  @IsEmail({}, { message: 'Email must be a valid email address' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email?: string;

  @ApiPropertyOptional({ 
    description: 'Patient phone number', 
    example: '+1234567890',
    pattern: '^\\+[1-9]\\d{1,14}$'
  })
  @IsOptional()
  @IsString({ message: 'Phone number must be a string' })
  @Matches(/^\+[1-9]\d{1,14}$/, { 
    message: 'Phone number must be in international format (+1234567890)' 
  })
  phoneNumber?: string;

  @ApiPropertyOptional({ 
    description: 'Patient blood type', 
    enum: BloodType,
    example: BloodType.A_POSITIVE
  })
  @IsOptional()
  @IsEnum(BloodType, { message: 'Blood type must be a valid enum value' })
  bloodType?: BloodType;

  @ApiPropertyOptional({ 
    description: 'Patient height in centimeters', 
    example: 175,
    minimum: 30,
    maximum: 300
  })
  @IsOptional()
  @IsNumber({}, { message: 'Height must be a number' })
  @Min(30, { message: 'Height must be at least 30 cm' })
  @Max(300, { message: 'Height cannot exceed 300 cm' })
  height?: number;

  @ApiPropertyOptional({ 
    description: 'Patient weight in kilograms', 
    example: 70.5,
    minimum: 0.5,
    maximum: 1000
  })
  @IsOptional()
  @IsNumber({}, { message: 'Weight must be a number' })
  @Min(0.5, { message: 'Weight must be at least 0.5 kg' })
  @Max(1000, { message: 'Weight cannot exceed 1000 kg' })
  weight?: number;

  @ApiPropertyOptional({ 
    description: 'Known allergies', 
    example: 'Penicillin, Nuts',
    maxLength: 1000
  })
  @IsOptional()
  @IsString({ message: 'Allergies must be a string' })
  @Length(0, 1000, { message: 'Allergies must not exceed 1000 characters' })
  @Transform(({ value }) => value?.trim())
  allergies?: string;

  @ApiPropertyOptional({ 
    description: 'Current medications', 
    example: 'Metformin 500mg twice daily',
    maxLength: 2000
  })
  @IsOptional()
  @IsString({ message: 'Medications must be a string' })
  @Length(0, 2000, { message: 'Medications must not exceed 2000 characters' })
  @Transform(({ value }) => value?.trim())
  medications?: string;

  @ApiPropertyOptional({ 
    description: 'Medical history', 
    example: 'Type 2 Diabetes, Hypertension',
    maxLength: 3000
  })
  @IsOptional()
  @IsString({ message: 'Medical history must be a string' })
  @Length(0, 3000, { message: 'Medical history must not exceed 3000 characters' })
  @Transform(({ value }) => value?.trim())
  medicalHistory?: string;

  @ApiPropertyOptional({ 
    description: 'Family medical history', 
    example: 'Father: Heart Disease, Mother: Diabetes',
    maxLength: 2000
  })
  @IsOptional()
  @IsString({ message: 'Family medical history must be a string' })
  @Length(0, 2000, { message: 'Family medical history must not exceed 2000 characters' })
  @Transform(({ value }) => value?.trim())
  familyMedicalHistory?: string;

  @ApiPropertyOptional({ 
    description: 'Patient status', 
    enum: PatientStatus,
    example: PatientStatus.ACTIVE
  })
  @IsOptional()
  @IsEnum(PatientStatus, { message: 'Status must be a valid enum value' })
  status?: PatientStatus;

  @ApiPropertyOptional({ 
    description: 'Primary physician ID', 
    example: 'uuid-physician'
  })
  @IsOptional()
  @IsUUID(4, { message: 'Primary physician ID must be a valid UUID' })
  primaryPhysicianId?: string;
}

export class GetAllPatientsParams {
  @ApiPropertyOptional({ 
    description: 'Page number for pagination', 
    example: 1,
    minimum: 1,
    default: 1
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber({}, { message: 'Page must be a number' })
  @Min(1, { message: 'Page must be at least 1' })
  page?: number = 1;

  @ApiPropertyOptional({ 
    description: 'Number of items per page', 
    example: 10,
    minimum: 1,
    maximum: 100,
    default: 10
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber({}, { message: 'Limit must be a number' })
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit cannot exceed 100' })
  limit?: number = 10;

  @ApiPropertyOptional({ 
    description: 'Filter by patient status', 
    enum: PatientStatus,
    example: PatientStatus.ACTIVE
  })
  @IsOptional()
  @IsEnum(PatientStatus, { message: 'Status must be a valid enum value' })
  status?: PatientStatus;

  @ApiPropertyOptional({ 
    description: 'Filter by gender', 
    enum: Gender,
    example: Gender.MALE
  })
  @IsOptional()
  @IsEnum(Gender, { message: 'Gender must be a valid enum value' })
  gender?: Gender;

  @ApiPropertyOptional({ 
    description: 'Filter by institution ID', 
    example: 'uuid-institution'
  })
  @IsOptional()
  @IsUUID(4, { message: 'Institution ID must be a valid UUID' })
  institutionId?: string;

  @ApiPropertyOptional({ 
    description: 'Filter by primary physician ID', 
    example: 'uuid-physician'
  })
  @IsOptional()
  @IsUUID(4, { message: 'Primary physician ID must be a valid UUID' })
  primaryPhysicianId?: string;

  @ApiPropertyOptional({ 
    description: 'Search term for name or medical record number', 
    example: 'John Doe',
    maxLength: 100
  })
  @IsOptional()
  @IsString({ message: 'Search term must be a string' })
  @Length(0, 100, { message: 'Search term must not exceed 100 characters' })
  @Transform(({ value }) => value?.trim())
  searchTerm?: string;

  @ApiPropertyOptional({ 
    description: 'Sort field', 
    example: 'lastName',
    enum: ['createdAt', 'updatedAt', 'lastName', 'firstName', 'dateOfBirth', 'medicalRecordNumber']
  })
  @IsOptional()
  @IsString({ message: 'Sort field must be a string' })
  sortBy?: 'createdAt' | 'updatedAt' | 'lastName' | 'firstName' | 'dateOfBirth' | 'medicalRecordNumber';

  @ApiPropertyOptional({ 
    description: 'Sort order', 
    example: 'ASC',
    enum: ['ASC', 'DESC']
  })
  @IsOptional()
  @IsString({ message: 'Sort order must be a string' })
  sortOrder?: 'ASC' | 'DESC';
}

export class PatientResponseDto {
  @ApiProperty({ description: 'Unique patient identifier' })
  id: string;

  @ApiProperty({ description: 'Patient first name' })
  firstName: string;

  @ApiProperty({ description: 'Patient last name' })
  lastName: string;

  @ApiPropertyOptional({ description: 'Patient middle name' })
  middleName?: string;

  @ApiProperty({ description: 'Date of birth' })
  dateOfBirth: string;

  @ApiProperty({ description: 'Patient gender', enum: Gender })
  gender: Gender;

  @ApiPropertyOptional({ description: 'Patient email' })
  email?: string;

  @ApiPropertyOptional({ description: 'Patient phone number' })
  phoneNumber?: string;

  @ApiProperty({ description: 'Current patient status', enum: PatientStatus })
  status: PatientStatus;

  @ApiProperty({ description: 'Medical record number' })
  medicalRecordNumber: string;

  @ApiPropertyOptional({ description: 'Institution ID' })
  institutionId?: string;

  @ApiProperty({ description: 'Record creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Record last update timestamp' })
  updatedAt: Date;
}

export class PatientSummaryResponseDto {
  @ApiProperty({ description: 'Unique patient identifier' })
  id: string;

  @ApiProperty({ description: 'Patient full name' })
  fullName: string;

  @ApiProperty({ description: 'Patient age' })
  age: number | null;

  @ApiProperty({ description: 'Patient gender', enum: Gender })
  gender: Gender;

  @ApiProperty({ description: 'Medical record number' })
  medicalRecordNumber: string;

  @ApiProperty({ description: 'Current patient status', enum: PatientStatus })
  status: PatientStatus;

  @ApiPropertyOptional({ description: 'Primary physician name' })
  primaryPhysicianName?: string;
}