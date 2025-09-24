import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, Like, Between, IsNull } from 'typeorm';
import { PatientRepositoryPort, PatientSearchFilters, PatientSearchResult, PaginationOptions } from '../../domain/ports/patient.repository.port';
import { Patient, PatientStatus, Gender, BloodType } from '../../domain/entities/patient.entity';
import { EncryptionService } from '../../../../shared/encryption/encryption.service';

@Injectable()
export class PatientRepositoryAdapter extends PatientRepositoryPort {
  constructor(
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
    private readonly encryptionService: EncryptionService,
  ) {
    super();
  }

  /**
   * Create a new patient record
   */
  async create(patient: Partial<Patient>): Promise<Patient> {
    const patientEntity = this.patientRepository.create(patient);
    return await this.patientRepository.save(patientEntity);
  }

  /**
   * Find patient by ID
   */
  async findById(id: string): Promise<Patient | null> {
    const patient = await this.patientRepository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['primaryPhysician', 'createdByUser', 'updatedByUser'],
    });
    return patient || null;
  }

  /**
   * Find patient by medical record number
   */
  async findByMedicalRecordNumber(mrn: string): Promise<Patient | null> {
    const patient = await this.patientRepository.findOne({
      where: { medicalRecordNumber: mrn, deletedAt: IsNull() },
      relations: ['primaryPhysician', 'createdByUser', 'updatedByUser'],
    });
    return patient || null;
  }

  /**
   * Find patient by email (encrypted search)
   */
  async findByEmail(email: string): Promise<Patient | null> {
    // Since email is encrypted, we need to search through all patients
    // This is not ideal for performance but necessary for encrypted fields
    const patients = await this.patientRepository.find({
      where: { deletedAt: IsNull() },
    });

    for (const patient of patients) {
      if (patient.email && patient.email === email) {
        return patient;
      }
    }

    return null;
  }

  /**
   * Find patient by phone number (encrypted search)
   */
  async findByPhoneNumber(phoneNumber: string): Promise<Patient | null> {
    // Since phone number is encrypted, we need to search through all patients
    const patients = await this.patientRepository.find({
      where: { deletedAt: IsNull() },
    });

    for (const patient of patients) {
      if (patient.phoneNumber && patient.phoneNumber === phoneNumber) {
        return patient;
      }
    }

    return null;
  }

  /**
   * Update patient record
   */
  async update(id: string, updates: Partial<Patient>): Promise<Patient> {
    await this.patientRepository.update(id, updates);
    const updatedPatient = await this.findById(id);
    if (!updatedPatient) {
      throw new Error('Patient not found after update');
    }
    return updatedPatient;
  }

  /**
   * Soft delete patient record
   */
  async softDelete(id: string): Promise<void> {
    await this.patientRepository.update(id, { 
      deletedAt: new Date(),
      status: PatientStatus.INACTIVE 
    });
  }

  /**
   * Permanently delete patient record (GDPR compliance)
   */
  async permanentDelete(id: string): Promise<void> {
    await this.patientRepository.delete(id);
  }

  /**
   * Find all patients with filters, sorting, and pagination
   */
  async findAll(
    filters?: PatientSearchFilters,
    pagination?: PaginationOptions
  ): Promise<PatientSearchResult> {
    const queryBuilder = this.createBaseQueryBuilder();

    // Apply filters
    this.applyFilters(queryBuilder, filters);

    // Apply sorting
    this.applySorting(queryBuilder, pagination?.sortBy);

    // Apply pagination
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;

    queryBuilder.skip(skip).take(limit);

    // Execute query
    const [patients, total] = await queryBuilder.getManyAndCount();

    return {
      patients,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Find patients by institution ID
   */
  async findByInstitutionId(
    institutionId: string,
    pagination?: PaginationOptions
  ): Promise<PatientSearchResult> {
    const filters: PatientSearchFilters = { institutionId };
    return this.findAll(filters, pagination);
  }

  /**
   * Find patients by primary physician ID
   */
  async findByPrimaryPhysicianId(
    physicianId: string,
    pagination?: PaginationOptions
  ): Promise<PatientSearchResult> {
    const filters: PatientSearchFilters = { primaryPhysicianId: physicianId };
    return this.findAll(filters, pagination);
  }

  /**
   * Search patients by name (supports partial matching on encrypted fields)
   */
  async searchByName(
    searchTerm: string,
    institutionId?: string,
    pagination?: PaginationOptions
  ): Promise<PatientSearchResult> {
    // For encrypted fields, we need to load all patients and filter in memory
    // This is a limitation of encrypted search - in production, you might want
    // to implement a search index or use searchable encryption
    const queryBuilder = this.createBaseQueryBuilder();
    
    if (institutionId) {
      queryBuilder.andWhere('patient.institutionId = :institutionId', { institutionId });
    }

    const allPatients = await queryBuilder.getMany();
    
    const filteredPatients = allPatients.filter(patient => {
      const fullName = patient.getFullName().toLowerCase();
      const searchTermLower = searchTerm.toLowerCase();
      return fullName.includes(searchTermLower) || 
             patient.medicalRecordNumber.toLowerCase().includes(searchTermLower);
    });

    // Apply pagination manually
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;
    const paginatedPatients = filteredPatients.slice(skip, skip + limit);

    return {
      patients: paginatedPatients,
      total: filteredPatients.length,
      page,
      limit,
      totalPages: Math.ceil(filteredPatients.length / limit),
    };
  }

  /**
   * Get patient statistics for dashboard
   */
  async getPatientStatistics(institutionId?: string): Promise<{
    total: number;
    active: number;
    inactive: number;
    byGender: Record<Gender, number>;
    byAgeGroup: Record<string, number>;
    withInsurance: number;
    withoutInsurance: number;
    withHipaaConsent: number;
    recentlyAdded: number;
  }> {
    const queryBuilder = this.createBaseQueryBuilder();
    
    if (institutionId) {
      queryBuilder.andWhere('patient.institutionId = :institutionId', { institutionId });
    }

    const patients = await queryBuilder.getMany();
    
    const stats = {
      total: patients.length,
      active: 0,
      inactive: 0,
      byGender: {
        [Gender.MALE]: 0,
        [Gender.FEMALE]: 0,
        [Gender.OTHER]: 0,
        [Gender.PREFER_NOT_TO_SAY]: 0,
      } as Record<Gender, number>,
      byAgeGroup: {
        'pediatric': 0,
        'young_adult': 0,
        'adult': 0,
        'middle_aged': 0,
        'senior': 0,
        'unknown': 0,
      },
      withInsurance: 0,
      withoutInsurance: 0,
      withHipaaConsent: 0,
      recentlyAdded: 0,
    };

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    patients.forEach(patient => {
      // Status
      if (patient.status === PatientStatus.ACTIVE) {
        stats.active++;
      } else {
        stats.inactive++;
      }

      // Gender
      stats.byGender[patient.gender]++;

      // Age groups
      const age = patient.getAge();
      if (age === null) {
        stats.byAgeGroup['unknown']++;
      } else if (age < 18) {
        stats.byAgeGroup['pediatric']++;
      } else if (age < 30) {
        stats.byAgeGroup['young_adult']++;
      } else if (age < 50) {
        stats.byAgeGroup['adult']++;
      } else if (age < 65) {
        stats.byAgeGroup['middle_aged']++;
      } else {
        stats.byAgeGroup['senior']++;
      }

      // Insurance
      if (patient.insuranceType && patient.insuranceType !== 'none') {
        stats.withInsurance++;
      } else {
        stats.withoutInsurance++;
      }

      // HIPAA consent
      if (patient.hipaaConsent) {
        stats.withHipaaConsent++;
      }

      // Recently added
      if (patient.createdAt > thirtyDaysAgo) {
        stats.recentlyAdded++;
      }
    });

    return stats;
  }

  /**
   * Get patients requiring consent updates
   */
  async findPatientsRequiringConsentUpdate(institutionId?: string): Promise<Patient[]> {
    const queryBuilder = this.createBaseQueryBuilder();
    
    queryBuilder.andWhere('patient.hipaaConsent = :hipaaConsent', { hipaaConsent: false });
    
    if (institutionId) {
      queryBuilder.andWhere('patient.institutionId = :institutionId', { institutionId });
    }

    return queryBuilder.getMany();
  }

  /**
   * Get patients with upcoming appointments (placeholder - would integrate with appointments module)
   */
  async findPatientsWithUpcomingAppointments(
    date: Date,
    institutionId?: string
  ): Promise<Patient[]> {
    // Placeholder implementation - would require appointments module integration
    return [];
  }

  /**
   * Find patients by age range
   */
  async findByAgeRange(
    minAge: number,
    maxAge: number,
    institutionId?: string,
    pagination?: PaginationOptions
  ): Promise<PatientSearchResult> {
    // For age-based queries, we need to calculate ages from encrypted birth dates
    const queryBuilder = this.createBaseQueryBuilder();
    
    if (institutionId) {
      queryBuilder.andWhere('patient.institutionId = :institutionId', { institutionId });
    }

    const patients = await queryBuilder.getMany();
    
    const filteredPatients = patients.filter(patient => {
      const age = patient.getAge();
      return age !== null && age >= minAge && age <= maxAge;
    });

    // Apply pagination
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;
    const paginatedPatients = filteredPatients.slice(skip, skip + limit);

    return {
      patients: paginatedPatients,
      total: filteredPatients.length,
      page,
      limit,
      totalPages: Math.ceil(filteredPatients.length / limit),
    };
  }

  /**
   * Find patients with specific medical conditions (encrypted search)
   */
  async findByMedicalCondition(
    condition: string,
    institutionId?: string,
    pagination?: PaginationOptions
  ): Promise<PatientSearchResult> {
    const queryBuilder = this.createBaseQueryBuilder();
    
    if (institutionId) {
      queryBuilder.andWhere('patient.institutionId = :institutionId', { institutionId });
    }

    const patients = await queryBuilder.getMany();
    
    const filteredPatients = patients.filter(patient => {
      return patient.medicalHistory?.toLowerCase().includes(condition.toLowerCase());
    });

    // Apply pagination
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;
    const paginatedPatients = filteredPatients.slice(skip, skip + limit);

    return {
      patients: paginatedPatients,
      total: filteredPatients.length,
      page,
      limit,
      totalPages: Math.ceil(filteredPatients.length / limit),
    };
  }

  /**
   * Find patients with specific allergies (encrypted search)
   */
  async findByAllergy(
    allergy: string,
    institutionId?: string,
    pagination?: PaginationOptions
  ): Promise<PatientSearchResult> {
    const queryBuilder = this.createBaseQueryBuilder();
    
    if (institutionId) {
      queryBuilder.andWhere('patient.institutionId = :institutionId', { institutionId });
    }

    const patients = await queryBuilder.getMany();
    
    const filteredPatients = patients.filter(patient => {
      return patient.allergies?.toLowerCase().includes(allergy.toLowerCase());
    });

    // Apply pagination
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;
    const paginatedPatients = filteredPatients.slice(skip, skip + limit);

    return {
      patients: paginatedPatients,
      total: filteredPatients.length,
      page,
      limit,
      totalPages: Math.ceil(filteredPatients.length / limit),
    };
  }

  /**
   * Get anonymized patient data for research
   */
  async getAnonymizedPatients(
    filters?: PatientSearchFilters,
    institutionId?: string
  ): Promise<Partial<Patient>[]> {
    const queryBuilder = this.createBaseQueryBuilder();
    
    this.applyFilters(queryBuilder, filters);
    
    if (institutionId) {
      queryBuilder.andWhere('patient.institutionId = :institutionId', { institutionId });
    }

    const patients = await queryBuilder.getMany();
    
    return patients.map(patient => patient.anonymizeForResearch());
  }

  /**
   * Check if medical record number exists
   */
  async existsByMedicalRecordNumber(mrn: string): Promise<boolean> {
    const count = await this.patientRepository.count({
      where: { medicalRecordNumber: mrn, deletedAt: IsNull() },
    });
    return count > 0;
  }

  /**
   * Check if patient exists by encrypted email
   */
  async existsByEmail(email: string): Promise<boolean> {
    const patient = await this.findByEmail(email);
    return patient !== null;
  }

  /**
   * Bulk update patients (for data migration or bulk operations)
   */
  async bulkUpdate(updates: Array<{ id: string; updates: Partial<Patient> }>): Promise<void> {
    await this.patientRepository.manager.transaction(async manager => {
      for (const update of updates) {
        await manager.update(Patient, update.id, update.updates);
      }
    });
  }

  /**
   * Get audit trail for patient (placeholder for audit integration)
   */
  async getAuditTrail(patientId: string): Promise<any[]> {
    // Placeholder - would integrate with audit module
    return [];
  }

  /**
   * Find patients who haven't been updated in X days
   */
  async findStalePatients(
    daysSinceUpdate: number,
    institutionId?: string
  ): Promise<Patient[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysSinceUpdate);

    const queryBuilder = this.createBaseQueryBuilder();
    
    queryBuilder.andWhere('patient.updatedAt < :cutoffDate', { cutoffDate });
    
    if (institutionId) {
      queryBuilder.andWhere('patient.institutionId = :institutionId', { institutionId });
    }

    return queryBuilder.getMany();
  }

  /**
   * Get patient count by status for institution
   */
  async getPatientCountByStatus(
    institutionId?: string
  ): Promise<Record<PatientStatus, number>> {
    const queryBuilder = this.createBaseQueryBuilder();
    
    if (institutionId) {
      queryBuilder.andWhere('patient.institutionId = :institutionId', { institutionId });
    }

    queryBuilder.select('patient.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('patient.status');

    const results = await queryBuilder.getRawMany();
    
    const counts: Record<PatientStatus, number> = {
      [PatientStatus.ACTIVE]: 0,
      [PatientStatus.INACTIVE]: 0,
      [PatientStatus.DISCHARGED]: 0,
      [PatientStatus.DECEASED]: 0,
      [PatientStatus.TRANSFERRED]: 0,
    };

    results.forEach(result => {
      counts[result.status as PatientStatus] = parseInt(result.count);
    });

    return counts;
  }

  /**
   * Create base query builder with common conditions
   */
  private createBaseQueryBuilder(): SelectQueryBuilder<Patient> {
    return this.patientRepository
      .createQueryBuilder('patient')
      .leftJoinAndSelect('patient.primaryPhysician', 'primaryPhysician')
      .leftJoinAndSelect('patient.createdByUser', 'createdByUser')
      .leftJoinAndSelect('patient.updatedByUser', 'updatedByUser')
      .where('patient.deletedAt IS NULL');
  }

  /**
   * Apply filters to query builder
   */
  private applyFilters(queryBuilder: SelectQueryBuilder<Patient>, filters?: PatientSearchFilters): void {
    if (!filters) return;

    if (filters.status) {
      queryBuilder.andWhere('patient.status = :status', { status: filters.status });
    }

    if (filters.gender) {
      queryBuilder.andWhere('patient.gender = :gender', { gender: filters.gender });
    }

    if (filters.bloodType) {
      queryBuilder.andWhere('patient.bloodType = :bloodType', { bloodType: filters.bloodType });
    }

    if (filters.institutionId) {
      queryBuilder.andWhere('patient.institutionId = :institutionId', { institutionId: filters.institutionId });
    }

    if (filters.primaryPhysicianId) {
      queryBuilder.andWhere('patient.primaryPhysicianId = :primaryPhysicianId', { primaryPhysicianId: filters.primaryPhysicianId });
    }

    if (filters.hasInsurance !== undefined) {
      if (filters.hasInsurance) {
        queryBuilder.andWhere('patient.insuranceType != :noneType', { noneType: 'none' });
      } else {
        queryBuilder.andWhere('patient.insuranceType = :noneType', { noneType: 'none' });
      }
    }

    if (filters.hipaaConsent !== undefined) {
      queryBuilder.andWhere('patient.hipaaConsent = :hipaaConsent', { hipaaConsent: filters.hipaaConsent });
    }

    if (filters.createdFromDate) {
      queryBuilder.andWhere('patient.createdAt >= :createdFromDate', { createdFromDate: filters.createdFromDate });
    }

    if (filters.createdToDate) {
      queryBuilder.andWhere('patient.createdAt <= :createdToDate', { createdToDate: filters.createdToDate });
    }

    if (filters.searchTerm) {
      // For encrypted fields, we would need to search in memory or use a search index
      queryBuilder.andWhere('patient.medicalRecordNumber ILIKE :searchTerm', { searchTerm: `%${filters.searchTerm}%` });
    }
  }

  /**
   * Apply sorting to query builder
   */
  private applySorting(queryBuilder: SelectQueryBuilder<Patient>, sortOptions?: any): void {
    if (!sortOptions) {
      queryBuilder.orderBy('patient.createdAt', 'DESC');
      return;
    }

    const { field, order } = sortOptions;
    queryBuilder.orderBy(`patient.${field}`, order === 'DESC' ? 'DESC' : 'ASC');
  }
}
