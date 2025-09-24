import { Injectable, NotFoundException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PatientRepositoryPort, PatientSearchFilters, PatientSearchResult, PaginationOptions } from '../domain/ports/patient.repository.port';
import { Patient, PatientStatus, Gender } from '../domain/entities/patient.entity';
import { CreatePatientDto, UpdatePatientDto, GetAllPatientsParams } from './dto/patient.dto';
import { AuditService } from '../../../shared/audit/audit.service';
import { EncryptionService } from '../../../shared/encryption/encryption.service';

@Injectable()
export class PatientService {
  constructor(
    private readonly patientRepository: PatientRepositoryPort,
    private readonly auditService: AuditService,
    private readonly encryptionService: EncryptionService,
  ) {}

  /**
   * Create a new patient record
   */
  async createPatient(
    createPatientDto: CreatePatientDto,
    userId: string,
    institutionId?: string
  ): Promise<Patient> {
    // Validate business rules
    await this.validateCreatePatient(createPatientDto);

    // Generate unique medical record number
    const medicalRecordNumber = await this.generateMedicalRecordNumber(institutionId);

    // Prepare patient data
    const patientData: Partial<Patient> = {
      ...createPatientDto,
      medicalRecordNumber,
      institutionId: institutionId || createPatientDto.institutionId,
      createdByUserId: userId,
      updatedByUserId: userId,
      hipaaConsentDate: createPatientDto.hipaaConsent ? new Date() : undefined,
      dataSharingConsentDate: createPatientDto.dataSharingConsent ? new Date() : undefined,
      status: PatientStatus.ACTIVE,
    };

    // Create patient
    const patient = await this.patientRepository.create(patientData);

    // Audit log
    await this.auditService.logAccess({
      userId,
      action: 'CREATE_PATIENT',
      resource: 'Patient',
      resourceId: patient.id,
      allowed: true,
      institutionId: patient.institutionId,
      dataClassifications: ['PHI'],
      metadata: {
        medicalRecordNumber: patient.medicalRecordNumber,
        patientName: patient.getFullName(),
      },
    });

    return patient;
  }

  /**
   * Get patient by ID
   */
  async getPatientById(id: string, userId: string, institutionId?: string): Promise<Patient> {
    const patient = await this.patientRepository.findById(id);
    
    if (!patient) {
      throw new NotFoundException(`Patient with ID ${id} not found`);
    }

    // Check institution access if provided
    if (institutionId && patient.institutionId !== institutionId) {
      throw new ForbiddenException('Access denied to patient from different institution');
    }

    // Audit log
    await this.auditService.logAccess({
      userId,
      action: 'VIEW_PATIENT',
      resource: 'Patient',
      resourceId: patient.id,
      allowed: true,
      institutionId: patient.institutionId,
      dataClassifications: ['PHI'],
      metadata: {
        medicalRecordNumber: patient.medicalRecordNumber,
        patientName: patient.getFullName(),
      },
    });

    return patient;
  }

  /**
   * Get patient by medical record number
   */
  async getPatientByMRN(
    medicalRecordNumber: string,
    userId: string,
    institutionId?: string
  ): Promise<Patient> {
    const patient = await this.patientRepository.findByMedicalRecordNumber(medicalRecordNumber);
    
    if (!patient) {
      throw new NotFoundException(`Patient with MRN ${medicalRecordNumber} not found`);
    }

    // Check institution access if provided
    if (institutionId && patient.institutionId !== institutionId) {
      throw new ForbiddenException('Access denied to patient from different institution');
    }

    // Audit log
    await this.auditService.logAccess({
      userId,
      action: 'VIEW_PATIENT_BY_MRN',
      resource: 'Patient',
      resourceId: patient.id,
      allowed: true,
      institutionId: patient.institutionId,
      dataClassifications: ['PHI'],
      metadata: {
        medicalRecordNumber: patient.medicalRecordNumber,
        patientName: patient.getFullName(),
        searchedMRN: medicalRecordNumber,
      },
    });

    return patient;
  }

  /**
   * Update patient record
   */
  async updatePatient(
    id: string,
    updatePatientDto: UpdatePatientDto,
    userId: string,
    institutionId?: string
  ): Promise<Patient> {
    const existingPatient = await this.patientRepository.findById(id);
    
    if (!existingPatient) {
      throw new NotFoundException(`Patient with ID ${id} not found`);
    }

    // Check institution access if provided
    if (institutionId && existingPatient.institutionId !== institutionId) {
      throw new ForbiddenException('Access denied to patient from different institution');
    }

    // Validate update
    await this.validateUpdatePatient(updatePatientDto, existingPatient);

    // Prepare update data
    const updateData: Partial<Patient> = {
      ...updatePatientDto,
      updatedByUserId: userId,
    };

    // Update patient
    const updatedPatient = await this.patientRepository.update(id, updateData);

    // Audit log
    await this.auditService.logAccess({
      userId,
      action: 'UPDATE_PATIENT',
      resource: 'Patient',
      resourceId: updatedPatient.id,
      allowed: true,
      institutionId: updatedPatient.institutionId,
      dataClassifications: ['PHI'],
      metadata: {
        medicalRecordNumber: updatedPatient.medicalRecordNumber,
        patientName: updatedPatient.getFullName(),
        updatedFields: Object.keys(updatePatientDto),
      },
    });

    return updatedPatient;
  }

  /**
   * Soft delete patient record
   */
  async deletePatient(id: string, userId: string, institutionId?: string): Promise<void> {
    const patient = await this.patientRepository.findById(id);
    
    if (!patient) {
      throw new NotFoundException(`Patient with ID ${id} not found`);
    }

    // Check institution access if provided
    if (institutionId && patient.institutionId !== institutionId) {
      throw new ForbiddenException('Access denied to patient from different institution');
    }

    // Check if patient can be deleted (business rules)
    if (patient.status === PatientStatus.ACTIVE) {
      throw new BadRequestException('Cannot delete active patient. Please deactivate first.');
    }

    await this.patientRepository.softDelete(id);

    // Audit log
    await this.auditService.logAccess({
      userId,
      action: 'DELETE_PATIENT',
      resource: 'Patient',
      resourceId: patient.id,
      allowed: true,
      institutionId: patient.institutionId,
      dataClassifications: ['PHI'],
      metadata: {
        medicalRecordNumber: patient.medicalRecordNumber,
        patientName: patient.getFullName(),
        deletionType: 'SOFT_DELETE',
      },
    });
  }

  /**
   * Get all patients with filters and pagination
   */
  async getAllPatients(
    params: GetAllPatientsParams,
    userId: string,
    institutionId?: string
  ): Promise<PatientSearchResult> {
    const filters: PatientSearchFilters = {
      status: params.status,
      gender: params.gender,
      institutionId: institutionId || params.institutionId,
      primaryPhysicianId: params.primaryPhysicianId,
      searchTerm: params.searchTerm,
    };

    const pagination: PaginationOptions = {
      page: params.page || 1,
      limit: params.limit || 10,
      sortBy: params.sortBy ? {
        field: params.sortBy,
        order: params.sortOrder || 'ASC',
      } : undefined,
    };

    const result = await this.patientRepository.findAll(filters, pagination);

    // Audit log
    await this.auditService.logAccess({
      userId,
      action: 'LIST_PATIENTS',
      resource: 'Patient',
      allowed: true,
      institutionId,
      dataClassifications: ['PHI'],
      metadata: {
        filters,
        pagination,
        resultCount: result.patients.length,
        totalCount: result.total,
      },
    });

    return result;
  }

  /**
   * Search patients by name
   */
  async searchPatientsByName(
    searchTerm: string,
    userId: string,
    institutionId?: string,
    pagination?: PaginationOptions
  ): Promise<PatientSearchResult> {
    const result = await this.patientRepository.searchByName(
      searchTerm,
      institutionId,
      pagination
    );

    // Audit log
    await this.auditService.logAccess({
      userId,
      action: 'SEARCH_PATIENTS_BY_NAME',
      resource: 'Patient',
      allowed: true,
      institutionId,
      dataClassifications: ['PHI'],
      metadata: {
        searchTerm,
        resultCount: result.patients.length,
        totalCount: result.total,
      },
    });

    return result;
  }

  /**
   * Get patients by institution
   */
  async getPatientsByInstitution(
    institutionId: string,
    userId: string,
    pagination?: PaginationOptions
  ): Promise<PatientSearchResult> {
    const result = await this.patientRepository.findByInstitutionId(institutionId, pagination);

    // Audit log
    await this.auditService.logAccess({
      userId,
      action: 'LIST_PATIENTS_BY_INSTITUTION',
      resource: 'Patient',
      allowed: true,
      institutionId,
      dataClassifications: ['PHI'],
      metadata: {
        resultCount: result.patients.length,
        totalCount: result.total,
      },
    });

    return result;
  }

  /**
   * Get patients by primary physician
   */
  async getPatientsByPhysician(
    physicianId: string,
    userId: string,
    institutionId?: string,
    pagination?: PaginationOptions
  ): Promise<PatientSearchResult> {
    const result = await this.patientRepository.findByPrimaryPhysicianId(physicianId, pagination);

    // Filter by institution if provided
    if (institutionId) {
      result.patients = result.patients.filter(p => p.institutionId === institutionId);
      result.total = result.patients.length;
    }

    // Audit log
    await this.auditService.logAccess({
      userId,
      action: 'LIST_PATIENTS_BY_PHYSICIAN',
      resource: 'Patient',
      allowed: true,
      institutionId,
      dataClassifications: ['PHI'],
      metadata: {
        physicianId,
        resultCount: result.patients.length,
        totalCount: result.total,
      },
    });

    return result;
  }

  /**
   * Update patient consent
   */
  async updatePatientConsent(
    id: string,
    consentType: 'hipaa' | 'dataSharing' | 'marketing',
    consent: boolean,
    userId: string,
    institutionId?: string
  ): Promise<Patient> {
    const patient = await this.patientRepository.findById(id);
    
    if (!patient) {
      throw new NotFoundException(`Patient with ID ${id} not found`);
    }

    // Check institution access if provided
    if (institutionId && patient.institutionId !== institutionId) {
      throw new ForbiddenException('Access denied to patient from different institution');
    }

    const updateData: Partial<Patient> = {
      updatedByUserId: userId,
    };

    switch (consentType) {
      case 'hipaa':
        updateData.hipaaConsent = consent;
        updateData.hipaaConsentDate = consent ? new Date() : undefined;
        break;
      case 'dataSharing':
        updateData.dataSharingConsent = consent;
        updateData.dataSharingConsentDate = consent ? new Date() : undefined;
        break;
      case 'marketing':
        updateData.marketingConsent = consent;
        break;
    }

    const updatedPatient = await this.patientRepository.update(id, updateData);

    // Audit log
    await this.auditService.logAccess({
      userId,
      action: 'UPDATE_PATIENT_CONSENT',
      resource: 'Patient',
      resourceId: updatedPatient.id,
      allowed: true,
      institutionId: updatedPatient.institutionId,
      dataClassifications: ['PHI'],
      metadata: {
        medicalRecordNumber: updatedPatient.medicalRecordNumber,
        patientName: updatedPatient.getFullName(),
        consentType,
        consent,
      },
    });

    return updatedPatient;
  }

  /**
   * Get patient statistics
   */
  async getPatientStatistics(userId: string, institutionId?: string): Promise<any> {
    const stats = await this.patientRepository.getPatientStatistics(institutionId);

    // Audit log
    await this.auditService.logAccess({
      userId,
      action: 'VIEW_PATIENT_STATISTICS',
      resource: 'Patient',
      allowed: true,
      institutionId,
      dataClassifications: ['AGGREGATED'],
      metadata: {
        totalPatients: stats.total,
        activePatients: stats.active,
      },
    });

    return stats;
  }

  /**
   * Get anonymized patient data for research
   */
  async getAnonymizedPatients(
    filters: PatientSearchFilters,
    userId: string,
    institutionId?: string
  ): Promise<Partial<Patient>[]> {
    // Only allow for research roles
    const anonymizedData = await this.patientRepository.getAnonymizedPatients(filters, institutionId);

    // Audit log
    await this.auditService.logAccess({
      userId,
      action: 'ACCESS_ANONYMIZED_PATIENT_DATA',
      resource: 'Patient',
      allowed: true,
      institutionId,
      dataClassifications: ['ANONYMIZED'],
      metadata: {
        filters,
        recordCount: anonymizedData.length,
      },
    });

    return anonymizedData;
  }

  /**
   * Validate patient creation
   */
  private async validateCreatePatient(createPatientDto: CreatePatientDto): Promise<void> {
    // Check for duplicate email
    if (createPatientDto.email) {
      const existingPatient = await this.patientRepository.findByEmail(createPatientDto.email);
      if (existingPatient) {
        throw new ConflictException('Patient with this email already exists');
      }
    }

    // Check for duplicate phone number
    if (createPatientDto.phoneNumber) {
      const existingPatient = await this.patientRepository.findByPhoneNumber(createPatientDto.phoneNumber);
      if (existingPatient) {
        throw new ConflictException('Patient with this phone number already exists');
      }
    }

    // Validate age (must be reasonable)
    const birthDate = new Date(createPatientDto.dateOfBirth);
    const age = Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    
    if (age < 0 || age > 150) {
      throw new BadRequestException('Invalid date of birth');
    }

    // Validate consent requirements
    if (!createPatientDto.hipaaConsent) {
      throw new BadRequestException('HIPAA consent is required to create patient record');
    }
  }

  /**
   * Validate patient update
   */
  private async validateUpdatePatient(
    updatePatientDto: UpdatePatientDto,
    existingPatient: Patient
  ): Promise<void> {
    // Check for duplicate email if changed
    if (updatePatientDto.email && updatePatientDto.email !== existingPatient.email) {
      const existingWithEmail = await this.patientRepository.findByEmail(updatePatientDto.email);
      if (existingWithEmail && existingWithEmail.id !== existingPatient.id) {
        throw new ConflictException('Another patient with this email already exists');
      }
    }

    // Check for duplicate phone number if changed
    if (updatePatientDto.phoneNumber && updatePatientDto.phoneNumber !== existingPatient.phoneNumber) {
      const existingWithPhone = await this.patientRepository.findByPhoneNumber(updatePatientDto.phoneNumber);
      if (existingWithPhone && existingWithPhone.id !== existingPatient.id) {
        throw new ConflictException('Another patient with this phone number already exists');
      }
    }
  }

  /**
   * Generate unique medical record number
   */
  private async generateMedicalRecordNumber(institutionId?: string): Promise<string> {
    const year = new Date().getFullYear();
    const institutionPrefix = institutionId ? institutionId.substring(0, 4).toUpperCase() : 'MIP';
    
    let isUnique = false;
    let counter = 1;
    let mrn = '';

    while (!isUnique) {
      mrn = `${institutionPrefix}-${year}-${counter.toString().padStart(6, '0')}`;
      const exists = await this.patientRepository.existsByMedicalRecordNumber(mrn);
      
      if (!exists) {
        isUnique = true;
      } else {
        counter++;
      }

      // Prevent infinite loop
      if (counter > 999999) {
        throw new Error('Unable to generate unique medical record number');
      }
    }

    return mrn;
  }
}