import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Encrypted } from '../../../../shared/decorators/encrypted.decorator';
import { User } from '../../../user/domain/entities/user.entity';

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
  PREFER_NOT_TO_SAY = 'prefer_not_to_say'
}

export enum BloodType {
  A_POSITIVE = 'A+',
  A_NEGATIVE = 'A-',
  B_POSITIVE = 'B+',
  B_NEGATIVE = 'B-',
  AB_POSITIVE = 'AB+',
  AB_NEGATIVE = 'AB-',
  O_POSITIVE = 'O+',
  O_NEGATIVE = 'O-',
  UNKNOWN = 'unknown'
}

export enum PatientStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DISCHARGED = 'discharged',
  DECEASED = 'deceased',
  TRANSFERRED = 'transferred'
}

export enum InsuranceType {
  PUBLIC = 'public',
  PRIVATE = 'private',
  MIXED = 'mixed',
  NONE = 'none'
}

@Entity('patients')
export class Patient {
  @ApiProperty({ description: 'Unique patient identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Personal Information (PHI - Protected Health Information)
  @ApiProperty({ description: 'Patient first name (encrypted)', example: 'John' })
  @Encrypted()
  @Column({ type: 'text' })
  firstName: string;

  @ApiProperty({ description: 'Patient last name (encrypted)', example: 'Doe' })
  @Encrypted()
  @Column({ type: 'text' })
  lastName: string;

  @ApiPropertyOptional({ description: 'Patient middle name (encrypted)', example: 'Michael' })
  @Encrypted()
  @Column({ type: 'text', nullable: true })
  middleName?: string;

  @ApiProperty({ description: 'Date of birth (encrypted)', example: '1990-05-15' })
  @Encrypted()
  @Column({ type: 'text' })
  dateOfBirth: string;

  @ApiProperty({ description: 'Patient gender', enum: Gender, example: Gender.MALE })
  @Column({ type: 'enum', enum: Gender })
  gender: Gender;

  @ApiPropertyOptional({ description: 'Patient email (encrypted)', example: 'john.doe@email.com' })
  @Encrypted()
  @Column({ type: 'text', nullable: true })
  email?: string;

  @ApiPropertyOptional({ description: 'Patient phone number (encrypted)', example: '+1234567890' })
  @Encrypted()
  @Column({ type: 'text', nullable: true })
  phoneNumber?: string;

  // Medical Information
  @ApiPropertyOptional({ description: 'Patient blood type', enum: BloodType, example: BloodType.A_POSITIVE })
  @Column({ type: 'enum', enum: BloodType, default: BloodType.UNKNOWN })
  bloodType: BloodType;

  @ApiPropertyOptional({ description: 'Patient height in cm', example: 175 })
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  height?: number;

  @ApiPropertyOptional({ description: 'Patient weight in kg', example: 70.5 })
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  weight?: number;

  @ApiPropertyOptional({ description: 'Known allergies (encrypted)', example: 'Penicillin, Nuts' })
  @Encrypted()
  @Column({ type: 'text', nullable: true })
  allergies?: string;

  @ApiPropertyOptional({ description: 'Current medications (encrypted)', example: 'Metformin 500mg, Lisinopril 10mg' })
  @Encrypted()
  @Column({ type: 'text', nullable: true })
  medications?: string;

  @ApiPropertyOptional({ description: 'Medical history (encrypted)', example: 'Diabetes Type 2, Hypertension' })
  @Encrypted()
  @Column({ type: 'text', nullable: true })
  medicalHistory?: string;

  @ApiPropertyOptional({ description: 'Family medical history (encrypted)', example: 'Father: Heart Disease, Mother: Diabetes' })
  @Encrypted()
  @Column({ type: 'text', nullable: true })
  familyMedicalHistory?: string;

  // Address Information (PII - Personally Identifiable Information)
  @ApiPropertyOptional({ description: 'Street address (encrypted)', example: '123 Main St' })
  @Encrypted()
  @Column({ type: 'text', nullable: true })
  address?: string;

  @ApiPropertyOptional({ description: 'City (encrypted)', example: 'New York' })
  @Encrypted()
  @Column({ type: 'text', nullable: true })
  city?: string;

  @ApiPropertyOptional({ description: 'State/Province (encrypted)', example: 'NY' })
  @Encrypted()
  @Column({ type: 'text', nullable: true })
  state?: string;

  @ApiPropertyOptional({ description: 'ZIP/Postal code (encrypted)', example: '10001' })
  @Encrypted()
  @Column({ type: 'text', nullable: true })
  zipCode?: string;

  @ApiPropertyOptional({ description: 'Country (encrypted)', example: 'United States' })
  @Encrypted()
  @Column({ type: 'text', nullable: true })
  country?: string;

  // Emergency Contact
  @ApiPropertyOptional({ description: 'Emergency contact name (encrypted)', example: 'Jane Doe' })
  @Encrypted()
  @Column({ type: 'text', nullable: true })
  emergencyContactName?: string;

  @ApiPropertyOptional({ description: 'Emergency contact phone (encrypted)', example: '+1987654321' })
  @Encrypted()
  @Column({ type: 'text', nullable: true })
  emergencyContactPhone?: string;

  @ApiPropertyOptional({ description: 'Emergency contact relationship (encrypted)', example: 'Spouse' })
  @Encrypted()
  @Column({ type: 'text', nullable: true })
  emergencyContactRelationship?: string;

  // Insurance Information
  @ApiPropertyOptional({ description: 'Insurance type', enum: InsuranceType, example: InsuranceType.PRIVATE })
  @Column({ type: 'enum', enum: InsuranceType, default: InsuranceType.NONE })
  insuranceType: InsuranceType;

  @ApiPropertyOptional({ description: 'Insurance provider name (encrypted)', example: 'Blue Cross Blue Shield' })
  @Encrypted()
  @Column({ type: 'text', nullable: true })
  insuranceProvider?: string;

  @ApiPropertyOptional({ description: 'Insurance policy number (encrypted)', example: 'BC123456789' })
  @Encrypted()
  @Column({ type: 'text', nullable: true })
  insurancePolicyNumber?: string;

  @ApiPropertyOptional({ description: 'Insurance group number (encrypted)', example: 'GRP001' })
  @Encrypted()
  @Column({ type: 'text', nullable: true })
  insuranceGroupNumber?: string;

  // Patient Status and Administrative
  @ApiProperty({ description: 'Current patient status', enum: PatientStatus, example: PatientStatus.ACTIVE })
  @Column({ type: 'enum', enum: PatientStatus, default: PatientStatus.ACTIVE })
  status: PatientStatus;

  @ApiProperty({ description: 'Unique medical record number', example: 'MRN-2024-001' })
  @Column({ type: 'varchar', length: 50, unique: true })
  medicalRecordNumber: string;

  @ApiPropertyOptional({ description: 'Institution ID where patient is registered', example: 'uuid-institution' })
  @Column({ type: 'uuid', nullable: true })
  institutionId?: string;

  // Compliance and Privacy
  @ApiPropertyOptional({ description: 'HIPAA consent given', example: true })
  @Column({ type: 'boolean', default: false })
  hipaaConsent: boolean;

  @ApiPropertyOptional({ description: 'Date when HIPAA consent was given', example: '2024-01-15T10:30:00Z' })
  @Column({ type: 'timestamp', nullable: true })
  hipaaConsentDate?: Date;

  @ApiPropertyOptional({ description: 'Consent for data sharing', example: true })
  @Column({ type: 'boolean', default: false })
  dataSharingConsent: boolean;

  @ApiPropertyOptional({ description: 'Date when data sharing consent was given', example: '2024-01-15T10:30:00Z' })
  @Column({ type: 'timestamp', nullable: true })
  dataSharingConsentDate?: Date;

  @ApiPropertyOptional({ description: 'Marketing communications consent', example: false })
  @Column({ type: 'boolean', default: false })
  marketingConsent: boolean;

  // Relationships
  @ApiPropertyOptional({ description: 'Primary care physician ID', example: 'uuid-doctor' })
  @Column({ type: 'uuid', nullable: true })
  primaryPhysicianId?: string;

  @ApiPropertyOptional({ description: 'Primary care physician information' })
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'primaryPhysicianId' })
  primaryPhysician?: User;

  @ApiPropertyOptional({ description: 'Patient created by user ID', example: 'uuid-user' })
  @Column({ type: 'uuid', nullable: true })
  createdByUserId?: string;

  @ApiPropertyOptional({ description: 'User who created the patient record' })
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'createdByUserId' })
  createdByUser?: User;

  @ApiPropertyOptional({ description: 'Last updated by user ID', example: 'uuid-user' })
  @Column({ type: 'uuid', nullable: true })
  updatedByUserId?: string;

  @ApiPropertyOptional({ description: 'User who last updated the patient record' })
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'updatedByUserId' })
  updatedByUser?: User;

  // Audit Information
  @ApiProperty({ description: 'Record creation timestamp' })
  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @ApiProperty({ description: 'Record last update timestamp' })
  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Soft delete timestamp' })
  @Column({ type: 'timestamp with time zone', nullable: true })
  deletedAt?: Date;

  // GDPR/HIPAA Compliance Methods
  /**
   * Get patient full name (decrypted)
   */
  getFullName(): string {
    const middle = this.middleName ? ` ${this.middleName}` : '';
    return `${this.firstName}${middle} ${this.lastName}`;
  }

  /**
   * Get patient age based on date of birth
   */
  getAge(): number | null {
    if (!this.dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  /**
   * Calculate BMI if height and weight are available
   */
  getBMI(): number | null {
    if (!this.height || !this.weight) return null;
    const heightInMeters = this.height / 100;
    return Number((this.weight / (heightInMeters * heightInMeters)).toFixed(2));
  }

  /**
   * Check if patient can give consent (age >= 18 or has guardian consent)
   */
  canGiveConsent(): boolean {
    const age = this.getAge();
    return age !== null && age >= 18;
  }

  /**
   * Anonymize patient data for research (removes PII while keeping PHI for medical research)
   */
  anonymizeForResearch(): Partial<Patient> {
    return {
      id: this.id,
      dateOfBirth: this.dateOfBirth, // Keep for age calculations
      gender: this.gender,
      bloodType: this.bloodType,
      height: this.height,
      weight: this.weight,
      allergies: this.allergies,
      medicalHistory: this.medicalHistory,
      familyMedicalHistory: this.familyMedicalHistory,
      status: this.status,
      institutionId: this.institutionId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * Get summary view (minimal info for listings)
   */
  getSummaryView(): Partial<Patient> {
    return {
      id: this.id,
      firstName: this.firstName,
      lastName: this.lastName,
      dateOfBirth: this.dateOfBirth,
      gender: this.gender,
      status: this.status,
      medicalRecordNumber: this.medicalRecordNumber,
      primaryPhysicianId: this.primaryPhysicianId,
      institutionId: this.institutionId
    };
  }

  /**
   * Soft delete patient record
   */
  softDelete(): void {
    this.deletedAt = new Date();
    this.status = PatientStatus.INACTIVE;
  }

  /**
   * Check if patient record is deleted
   */
  isDeleted(): boolean {
    return this.deletedAt !== null;
  }
}