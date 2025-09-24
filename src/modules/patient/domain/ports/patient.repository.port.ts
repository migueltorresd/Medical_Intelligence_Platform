import { Patient, PatientStatus, Gender, BloodType } from '../entities/patient.entity';

export interface PatientSearchFilters {
  status?: PatientStatus;
  gender?: Gender;
  bloodType?: BloodType;
  institutionId?: string;
  primaryPhysicianId?: string;
  hasInsurance?: boolean;
  hipaaConsent?: boolean;
  ageMin?: number;
  ageMax?: number;
  createdFromDate?: Date;
  createdToDate?: Date;
  searchTerm?: string; // For searching in names, MRN, etc.
}

export interface PatientSortOptions {
  field: 'createdAt' | 'updatedAt' | 'lastName' | 'firstName' | 'dateOfBirth' | 'medicalRecordNumber';
  order: 'ASC' | 'DESC';
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: PatientSortOptions;
}

export interface PatientSearchResult {
  patients: Patient[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export abstract class PatientRepositoryPort {
  /**
   * Create a new patient record
   */
  abstract create(patient: Partial<Patient>): Promise<Patient>;

  /**
   * Find patient by ID
   */
  abstract findById(id: string): Promise<Patient | null>;

  /**
   * Find patient by medical record number
   */
  abstract findByMedicalRecordNumber(mrn: string): Promise<Patient | null>;

  /**
   * Find patient by email (encrypted search)
   */
  abstract findByEmail(email: string): Promise<Patient | null>;

  /**
   * Find patient by phone number (encrypted search)
   */
  abstract findByPhoneNumber(phoneNumber: string): Promise<Patient | null>;

  /**
   * Update patient record
   */
  abstract update(id: string, updates: Partial<Patient>): Promise<Patient>;

  /**
   * Soft delete patient record
   */
  abstract softDelete(id: string): Promise<void>;

  /**
   * Permanently delete patient record (GDPR compliance)
   */
  abstract permanentDelete(id: string): Promise<void>;

  /**
   * Find all patients with filters, sorting, and pagination
   */
  abstract findAll(
    filters?: PatientSearchFilters,
    pagination?: PaginationOptions
  ): Promise<PatientSearchResult>;

  /**
   * Find patients by institution ID
   */
  abstract findByInstitutionId(
    institutionId: string,
    pagination?: PaginationOptions
  ): Promise<PatientSearchResult>;

  /**
   * Find patients by primary physician ID
   */
  abstract findByPrimaryPhysicianId(
    physicianId: string,
    pagination?: PaginationOptions
  ): Promise<PatientSearchResult>;

  /**
   * Search patients by name (supports partial matching on encrypted fields)
   */
  abstract searchByName(
    searchTerm: string,
    institutionId?: string,
    pagination?: PaginationOptions
  ): Promise<PatientSearchResult>;

  /**
   * Get patient statistics for dashboard
   */
  abstract getPatientStatistics(institutionId?: string): Promise<{
    total: number;
    active: number;
    inactive: number;
    byGender: Record<Gender, number>;
    byAgeGroup: Record<string, number>;
    withInsurance: number;
    withoutInsurance: number;
    withHipaaConsent: number;
    recentlyAdded: number; // Last 30 days
  }>;

  /**
   * Get patients requiring consent updates
   */
  abstract findPatientsRequiringConsentUpdate(
    institutionId?: string
  ): Promise<Patient[]>;

  /**
   * Get patients with upcoming appointments (if integrated with appointments)
   */
  abstract findPatientsWithUpcomingAppointments(
    date: Date,
    institutionId?: string
  ): Promise<Patient[]>;

  /**
   * Find patients by age range
   */
  abstract findByAgeRange(
    minAge: number,
    maxAge: number,
    institutionId?: string,
    pagination?: PaginationOptions
  ): Promise<PatientSearchResult>;

  /**
   * Find patients with specific medical conditions (encrypted search)
   */
  abstract findByMedicalCondition(
    condition: string,
    institutionId?: string,
    pagination?: PaginationOptions
  ): Promise<PatientSearchResult>;

  /**
   * Find patients with specific allergies (encrypted search)
   */
  abstract findByAllergy(
    allergy: string,
    institutionId?: string,
    pagination?: PaginationOptions
  ): Promise<PatientSearchResult>;

  /**
   * Get anonymized patient data for research
   */
  abstract getAnonymizedPatients(
    filters?: PatientSearchFilters,
    institutionId?: string
  ): Promise<Partial<Patient>[]>;

  /**
   * Check if medical record number exists
   */
  abstract existsByMedicalRecordNumber(mrn: string): Promise<boolean>;

  /**
   * Check if patient exists by encrypted email
   */
  abstract existsByEmail(email: string): Promise<boolean>;

  /**
   * Bulk update patients (for data migration or bulk operations)
   */
  abstract bulkUpdate(updates: Array<{ id: string; updates: Partial<Patient> }>): Promise<void>;

  /**
   * Get audit trail for patient (if audit system is implemented)
   */
  abstract getAuditTrail(patientId: string): Promise<any[]>;

  /**
   * Find patients who haven't been updated in X days (for compliance checks)
   */
  abstract findStalePatients(
    daysSinceUpdate: number,
    institutionId?: string
  ): Promise<Patient[]>;

  /**
   * Get patient count by status for institution
   */
  abstract getPatientCountByStatus(
    institutionId?: string
  ): Promise<Record<PatientStatus, number>>;
}