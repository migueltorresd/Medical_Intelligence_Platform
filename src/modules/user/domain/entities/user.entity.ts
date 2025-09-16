import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, VersionColumn } from 'typeorm';
import { Exclude } from 'class-transformer';

// Roles médicos expandidos
export enum MedicalRole {
  PATIENT = 'patient',
  DOCTOR = 'doctor',
  NURSE = 'nurse',
  SPECIALIST = 'specialist',
  ONCOLOGIST = 'oncologist',
  INSTITUTION_ADMIN = 'institution_admin',
  CAREGIVER = 'caregiver',
  RESEARCHER = 'researcher',
  ADMIN = 'admin',
  USER = 'user'
}

// Alias para compatibilidad con código existente
export const UserRole = MedicalRole;
export type UserRole = MedicalRole;

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_APPROVAL = 'pending_approval'
}

// Clasificación de datos médicos
export enum DataClassification {
  PHI = 'phi',      // Protected Health Information
  PII = 'pii',      // Personally Identifiable Information
  PUBLIC = 'public', // Non-sensitive data
  INTERNAL = 'internal' // Internal business data
}

// Especialidades médicas
export interface MedicalSpecialty {
  id: string;
  name: string;
  category: string;
  licenseRequired: boolean;
}

// Consentimientos de privacidad
export interface PrivacyConsent {
  type: string;
  granted: boolean;
  timestamp: Date;
  version: string;
}

// Log de acceso para auditoría
export interface AccessLogEntry {
  timestamp: Date;
  action: string;
  resource: string;
  ipAddress: string;
  userAgent: string;
  allowed: boolean;
}

@Entity('users')
@Index(['email', 'institutionId']) // Índice compuesto para multi-tenancy
@Index(['medicalRoles']) // Índice para consultas por rol médico
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  name: string;

  @Column({ type: 'varchar', length: 150, unique: true, nullable: false })
  email: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  @Exclude() // Excluir password de las respuestas JSON por seguridad
  password: string;

  @Column({ type: 'int', nullable: true })
  age?: number;

  // Roles médicos múltiples
  @Column({
    type: 'enum',
    enum: MedicalRole,
    array: true,
    default: [MedicalRole.USER]
  })
  medicalRoles: MedicalRole[];

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE })
  status: UserStatus;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city?: string;

  // Campos médicos nuevos
  @Column({ nullable: true })
  @Index() // Para consultas multi-tenant
  institutionId?: string;

  @Column({ nullable: true })
  medicalLicenseNumber?: string;

  @Column({ type: 'jsonb', nullable: true })
  specialties?: MedicalSpecialty[];

  @Column({ type: 'jsonb', default: [] })
  privacyConsents: PrivacyConsent[];

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  lastConsentUpdate: Date;

  // Audit fields para compliance médico
  @Column({ type: 'jsonb', default: [] })
  accessLog: AccessLogEntry[];

  @Column()
  createdBy?: string;

  @Column()
  lastModifiedBy?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @VersionColumn() // Para optimistic locking
  version: number;

  // Domain methods - Principios DDD
  
  /**
   * Activa el usuario
   * Aplica: Single Responsibility Principle
   */
  activate(): void {
    this.status = UserStatus.ACTIVE;
  }

  /**
   * Desactiva el usuario
   * Aplica: Single Responsibility Principle
   */
  deactivate(): void {
    this.status = UserStatus.INACTIVE;
  }

  /**
   * Suspende el usuario
   * Aplica: Single Responsibility Principle
   */
  suspend(): void {
    this.status = UserStatus.SUSPENDED;
  }

  /**
   * Verifica si el usuario está activo
   * Aplica: Tell, Don't Ask principle
   */
  isActive(): boolean {
    return this.status === UserStatus.ACTIVE;
  }

  /**
   * Verifica si el usuario tiene un rol médico específico
   * Aplica: Tell, Don't Ask principle
   */
  hasMedicalRole(role: MedicalRole): boolean {
    return this.medicalRoles.includes(role);
  }

  /**
   * Verifica si el usuario es administrador
   * Aplica: Tell, Don't Ask principle
   */
  isAdmin(): boolean {
    return this.medicalRoles.includes(MedicalRole.ADMIN);
  }

  /**
   * Verifica si el usuario es profesional médico
   */
  isMedicalProfessional(): boolean {
    const medicalProfessionalRoles = [
      MedicalRole.DOCTOR,
      MedicalRole.NURSE,
      MedicalRole.SPECIALIST,
      MedicalRole.ONCOLOGIST
    ];
    return this.medicalRoles.some(role => medicalProfessionalRoles.includes(role));
  }

  /**
   * Verifica si el usuario puede acceder a datos PHI
   */
  canAccessPHI(): boolean {
    return this.isMedicalProfessional() || this.medicalRoles.includes(MedicalRole.INSTITUTION_ADMIN);
  }

  /**
   * Agrega un rol médico al usuario
   * Aplica: Single Responsibility Principle + validación de dominio
   */
  addMedicalRole(role: MedicalRole): void {
    if (!Object.values(MedicalRole).includes(role)) {
      throw new Error('Invalid medical role');
    }
    if (!this.medicalRoles.includes(role)) {
      this.medicalRoles.push(role);
    }
  }

  /**
   * Remueve un rol médico del usuario
   */
  removeMedicalRole(role: MedicalRole): void {
    this.medicalRoles = this.medicalRoles.filter(r => r !== role);
    if (this.medicalRoles.length === 0) {
      this.medicalRoles = [MedicalRole.USER]; // Siempre debe tener al menos un rol
    }
  }

  /**
   * Cambia el rol principal del usuario (compatible con código existente)
   * Aplica: Single Responsibility Principle + validación de dominio
   */
  changeRole(role: MedicalRole): void {
    if (!Object.values(MedicalRole).includes(role)) {
      throw new Error('Invalid medical role');
    }
    this.medicalRoles = [role];
  }

  /**
   * Asigna usuario a una institución médica
   */
  assignToInstitution(institutionId: string, assignedBy: string): void {
    if (!institutionId) {
      throw new Error('Institution ID is required');
    }
    this.institutionId = institutionId;
    this.lastModifiedBy = assignedBy;
  }

  /**
   * Registra consentimiento de privacidad
   */
  grantPrivacyConsent(consentType: string, version: string = '1.0'): void {
    const existingConsent = this.privacyConsents.find(c => c.type === consentType);
    if (existingConsent) {
      existingConsent.granted = true;
      existingConsent.timestamp = new Date();
      existingConsent.version = version;
    } else {
      this.privacyConsents.push({
        type: consentType,
        granted: true,
        timestamp: new Date(),
        version
      });
    }
    this.lastConsentUpdate = new Date();
  }

  /**
   * Registra acceso para auditoría
   */
  logAccess(action: string, resource: string, ipAddress: string, userAgent: string, allowed: boolean): void {
    const logEntry: AccessLogEntry = {
      timestamp: new Date(),
      action,
      resource,
      ipAddress,
      userAgent,
      allowed
    };
    
    this.accessLog.push(logEntry);
    
    // Mantener solo los últimos 100 logs para evitar crecimiento excesivo
    if (this.accessLog.length > 100) {
      this.accessLog = this.accessLog.slice(-100);
    }
  }

  /**
   * Actualiza información básica del usuario
   * Aplica: Single Responsibility Principle + validación de dominio
   */
  updateBasicInfo(name: string, age?: number, phone?: string, city?: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('Name cannot be empty');
    }
    
    if (age && (age < 1 || age > 120)) {
      throw new Error('Age must be between 1 and 120');
    }

    this.name = name.trim();
    this.age = age;
    this.phone = phone;
    this.city = city;
  }

  /**
   * Factory method para crear un nuevo usuario médico
   * Aplica: Factory Pattern + validación de dominio
   */
  static create(
    name: string,
    email: string,
    hashedPassword: string,
    medicalRoles: MedicalRole[] = [MedicalRole.USER],
    age?: number,
    institutionId?: string,
    createdBy?: string
  ): User {
    if (!name || name.trim().length === 0) {
      throw new Error('Name is required');
    }

    if (!email || !email.includes('@')) {
      throw new Error('Valid email is required');
    }

    if (!hashedPassword || hashedPassword.length < 6) {
      throw new Error('Password hash is required');
    }

    if (!medicalRoles || medicalRoles.length === 0) {
      medicalRoles = [MedicalRole.USER];
    }

    const user = new User();
    user.name = name.trim();
    user.email = email.toLowerCase();
    user.password = hashedPassword;
    user.age = age;
    user.medicalRoles = medicalRoles;
    user.institutionId = institutionId;
    user.createdBy = createdBy;
    user.status = UserStatus.ACTIVE;
    user.privacyConsents = [];
    user.accessLog = [];
    user.lastConsentUpdate = new Date();

    return user;
  }

  /**
   * Factory method específico para crear pacientes
   */
  static createPatient(
    name: string,
    email: string,
    hashedPassword: string,
    age?: number,
    institutionId?: string
  ): User {
    const patient = this.create(
      name,
      email,
      hashedPassword,
      [MedicalRole.PATIENT],
      age,
      institutionId
    );
    
    // Los pacientes requieren consentimiento explícito
    patient.status = UserStatus.PENDING_APPROVAL;
    
    return patient;
  }

  /**
   * Factory method específico para crear profesionales médicos
   */
  static createMedicalProfessional(
    name: string,
    email: string,
    hashedPassword: string,
    medicalRole: MedicalRole,
    licenseNumber: string,
    institutionId: string,
    createdBy: string
  ): User {
    const professional = this.create(
      name,
      email,
      hashedPassword,
      [medicalRole],
      undefined,
      institutionId,
      createdBy
    );
    
    professional.medicalLicenseNumber = licenseNumber;
    professional.status = UserStatus.PENDING_APPROVAL; // Requiere aprobación institucional
    
    return professional;
  }
}
