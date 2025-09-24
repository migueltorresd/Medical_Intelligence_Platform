import { Injectable } from '@nestjs/common';
import { Patient, Gender, BloodType, PatientStatus, InsuranceType } from '../../domain/entities/patient.entity';
import { CreatePatientDto, UpdatePatientDto, PatientResponseDto, PatientSummaryResponseDto } from '../../application/dto/patient.dto';

@Injectable()
export class PatientMapper {
  /**
   * Convert CreatePatientDto to Patient entity
   */
  static toEntity(createPatientDto: CreatePatientDto): Partial<Patient> {
    return {
      firstName: createPatientDto.firstName,
      lastName: createPatientDto.lastName,
      middleName: createPatientDto.middleName,
      dateOfBirth: createPatientDto.dateOfBirth,
      gender: createPatientDto.gender,
      email: createPatientDto.email,
      phoneNumber: createPatientDto.phoneNumber,
      bloodType: createPatientDto.bloodType || BloodType.UNKNOWN,
      height: createPatientDto.height,
      weight: createPatientDto.weight,
      allergies: createPatientDto.allergies,
      medications: createPatientDto.medications,
      medicalHistory: createPatientDto.medicalHistory,
      familyMedicalHistory: createPatientDto.familyMedicalHistory,
      address: createPatientDto.address,
      city: createPatientDto.city,
      state: createPatientDto.state,
      zipCode: createPatientDto.zipCode,
      country: createPatientDto.country,
      emergencyContactName: createPatientDto.emergencyContactName,
      emergencyContactPhone: createPatientDto.emergencyContactPhone,
      emergencyContactRelationship: createPatientDto.emergencyContactRelationship,
      insuranceType: createPatientDto.insuranceType || InsuranceType.NONE,
      insuranceProvider: createPatientDto.insuranceProvider,
      insurancePolicyNumber: createPatientDto.insurancePolicyNumber,
      insuranceGroupNumber: createPatientDto.insuranceGroupNumber,
      institutionId: createPatientDto.institutionId,
      primaryPhysicianId: createPatientDto.primaryPhysicianId,
      hipaaConsent: createPatientDto.hipaaConsent,
      dataSharingConsent: createPatientDto.dataSharingConsent || false,
      marketingConsent: createPatientDto.marketingConsent || false,
      status: PatientStatus.ACTIVE,
    };
  }

  /**
   * Convert UpdatePatientDto to partial Patient entity
   */
  static toUpdateEntity(updatePatientDto: UpdatePatientDto): Partial<Patient> {
    const updateData: Partial<Patient> = {};

    if (updatePatientDto.firstName !== undefined) {
      updateData.firstName = updatePatientDto.firstName;
    }
    if (updatePatientDto.lastName !== undefined) {
      updateData.lastName = updatePatientDto.lastName;
    }
    if (updatePatientDto.middleName !== undefined) {
      updateData.middleName = updatePatientDto.middleName;
    }
    if (updatePatientDto.email !== undefined) {
      updateData.email = updatePatientDto.email;
    }
    if (updatePatientDto.phoneNumber !== undefined) {
      updateData.phoneNumber = updatePatientDto.phoneNumber;
    }
    if (updatePatientDto.bloodType !== undefined) {
      updateData.bloodType = updatePatientDto.bloodType;
    }
    if (updatePatientDto.height !== undefined) {
      updateData.height = updatePatientDto.height;
    }
    if (updatePatientDto.weight !== undefined) {
      updateData.weight = updatePatientDto.weight;
    }
    if (updatePatientDto.allergies !== undefined) {
      updateData.allergies = updatePatientDto.allergies;
    }
    if (updatePatientDto.medications !== undefined) {
      updateData.medications = updatePatientDto.medications;
    }
    if (updatePatientDto.medicalHistory !== undefined) {
      updateData.medicalHistory = updatePatientDto.medicalHistory;
    }
    if (updatePatientDto.familyMedicalHistory !== undefined) {
      updateData.familyMedicalHistory = updatePatientDto.familyMedicalHistory;
    }
    if (updatePatientDto.status !== undefined) {
      updateData.status = updatePatientDto.status;
    }
    if (updatePatientDto.primaryPhysicianId !== undefined) {
      updateData.primaryPhysicianId = updatePatientDto.primaryPhysicianId;
    }

    return updateData;
  }

  /**
   * Convert Patient entity to PatientResponseDto
   */
  static toResponseDto(patient: Patient): PatientResponseDto {
    return {
      id: patient.id,
      firstName: patient.firstName,
      lastName: patient.lastName,
      middleName: patient.middleName,
      dateOfBirth: patient.dateOfBirth,
      gender: patient.gender,
      email: patient.email,
      phoneNumber: patient.phoneNumber,
      status: patient.status,
      medicalRecordNumber: patient.medicalRecordNumber,
      institutionId: patient.institutionId,
      createdAt: patient.createdAt,
      updatedAt: patient.updatedAt,
    };
  }

  /**
   * Convert Patient entity to PatientSummaryResponseDto
   */
  static toSummaryResponseDto(patient: Patient, primaryPhysicianName?: string): PatientSummaryResponseDto {
    return {
      id: patient.id,
      fullName: patient.getFullName(),
      age: patient.getAge(),
      gender: patient.gender,
      medicalRecordNumber: patient.medicalRecordNumber,
      status: patient.status,
      primaryPhysicianName,
    };
  }

  /**
   * Convert multiple Patient entities to PatientResponseDto array
   */
  static toResponseDtoArray(patients: Patient[]): PatientResponseDto[] {
    return patients.map(patient => this.toResponseDto(patient));
  }

  /**
   * Convert multiple Patient entities to PatientSummaryResponseDto array
   */
  static toSummaryResponseDtoArray(patients: Patient[]): PatientSummaryResponseDto[] {
    return patients.map(patient => this.toSummaryResponseDto(patient));
  }

  /**
   * Convert Patient entity to safe display format (removes sensitive data)
   */
  static toSafeDisplayFormat(patient: Patient): Partial<Patient> {
    return {
      id: patient.id,
      firstName: patient.firstName,
      lastName: patient.lastName,
      middleName: patient.middleName,
      gender: patient.gender,
      status: patient.status,
      medicalRecordNumber: patient.medicalRecordNumber,
      institutionId: patient.institutionId,
      primaryPhysicianId: patient.primaryPhysicianId,
      createdAt: patient.createdAt,
      updatedAt: patient.updatedAt,
    };
  }

  /**
   * Convert Patient entity to anonymized format for research
   */
  static toAnonymizedFormat(patient: Patient): Partial<Patient> {
    const age = patient.getAge();
    const bmi = patient.getBMI();

    return {
      id: patient.id, // Keep ID for research correlation
      gender: patient.gender,
      bloodType: patient.bloodType,
      height: patient.height,
      weight: patient.weight,
      allergies: patient.allergies,
      medicalHistory: patient.medicalHistory,
      familyMedicalHistory: patient.familyMedicalHistory,
      insuranceType: patient.insuranceType,
      status: patient.status,
      institutionId: patient.institutionId,
      createdAt: patient.createdAt,
      updatedAt: patient.updatedAt,
      // Computed fields - these are calculated fields, not entity properties
      // age: age,
      // bmi: bmi,
      // ageGroup: this.getAgeGroup(age),
    };
  }

  /**
   * Convert Patient entity to detailed medical format (for authorized medical professionals)
   */
  static toDetailedMedicalFormat(patient: Patient): Patient {
    // Return full patient data for authorized medical access
    return patient;
  }

  /**
   * Convert Patient entity to limited format (for non-medical staff)
   */
  static toLimitedFormat(patient: Patient): Partial<Patient> {
    return {
      id: patient.id,
      firstName: patient.firstName,
      lastName: patient.lastName,
      middleName: patient.middleName,
      gender: patient.gender,
      status: patient.status,
      medicalRecordNumber: patient.medicalRecordNumber,
      institutionId: patient.institutionId,
      primaryPhysicianId: patient.primaryPhysicianId,
      email: patient.email,
      phoneNumber: patient.phoneNumber,
      address: patient.address,
      city: patient.city,
      state: patient.state,
      zipCode: patient.zipCode,
      country: patient.country,
      emergencyContactName: patient.emergencyContactName,
      emergencyContactPhone: patient.emergencyContactPhone,
      emergencyContactRelationship: patient.emergencyContactRelationship,
      insuranceType: patient.insuranceType,
      insuranceProvider: patient.insuranceProvider,
      createdAt: patient.createdAt,
      updatedAt: patient.updatedAt,
    };
  }

  /**
   * Convert Patient entity to audit-safe format (removes sensitive PHI/PII)
   */
  static toAuditSafeFormat(patient: Patient): Partial<Patient> {
    return {
      id: patient.id,
      gender: patient.gender,
      status: patient.status,
      medicalRecordNumber: patient.medicalRecordNumber,
      institutionId: patient.institutionId,
      primaryPhysicianId: patient.primaryPhysicianId,
      bloodType: patient.bloodType,
      insuranceType: patient.insuranceType,
      hipaaConsent: patient.hipaaConsent,
      dataSharingConsent: patient.dataSharingConsent,
      marketingConsent: patient.marketingConsent,
      createdAt: patient.createdAt,
      updatedAt: patient.updatedAt,
    };
  }

  /**
   * Convert Patient entity for API response based on user role
   */
  static toRoleBasedFormat(patient: Patient, userRole: string): Partial<Patient> {
    switch (userRole.toLowerCase()) {
      case 'doctor':
      case 'oncologist':
      case 'nurse':
      case 'physician':
        return this.toDetailedMedicalFormat(patient);
      
      case 'researcher':
        return this.toAnonymizedFormat(patient);
      
      case 'admin':
      case 'institution_admin':
        return this.toLimitedFormat(patient);
      
      case 'receptionist':
      case 'clerk':
        return this.toSafeDisplayFormat(patient);
      
      default:
        return this.toSafeDisplayFormat(patient);
    }
  }

  /**
   * Helper method to determine age group
   */
  private static getAgeGroup(age: number | null): string {
    if (age === null) return 'unknown';
    if (age < 18) return 'pediatric';
    if (age < 30) return 'young_adult';
    if (age < 50) return 'adult';
    if (age < 65) return 'middle_aged';
    return 'senior';
  }

  /**
   * Validate patient data integrity
   */
  static validatePatientData(patient: Partial<Patient>): string[] {
    const errors: string[] = [];

    if (!patient.firstName?.trim()) {
      errors.push('First name is required');
    }

    if (!patient.lastName?.trim()) {
      errors.push('Last name is required');
    }

    if (!patient.dateOfBirth) {
      errors.push('Date of birth is required');
    } else {
      const birthDate = new Date(patient.dateOfBirth);
      const today = new Date();
      
      if (birthDate > today) {
        errors.push('Date of birth cannot be in the future');
      }
      
      const age = Math.floor((today.getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      if (age > 150) {
        errors.push('Invalid date of birth - age cannot exceed 150 years');
      }
    }

    if (!patient.gender || !Object.values(Gender).includes(patient.gender)) {
      errors.push('Valid gender is required');
    }

    if (patient.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(patient.email)) {
      errors.push('Invalid email format');
    }

    if (patient.phoneNumber && !/^\+[1-9]\d{1,14}$/.test(patient.phoneNumber)) {
      errors.push('Invalid phone number format - must be in international format');
    }

    if (patient.height && (patient.height < 30 || patient.height > 300)) {
      errors.push('Height must be between 30 and 300 cm');
    }

    if (patient.weight && (patient.weight < 0.5 || patient.weight > 1000)) {
      errors.push('Weight must be between 0.5 and 1000 kg');
    }

    return errors;
  }

  /**
   * Sanitize patient data for storage
   */
  static sanitizeForStorage(patient: Partial<Patient>): Partial<Patient> {
    const sanitized = { ...patient };

    // Trim string fields
    if (sanitized.firstName) sanitized.firstName = sanitized.firstName.trim();
    if (sanitized.lastName) sanitized.lastName = sanitized.lastName.trim();
    if (sanitized.middleName) sanitized.middleName = sanitized.middleName.trim();
    if (sanitized.email) sanitized.email = sanitized.email.toLowerCase().trim();
    if (sanitized.address) sanitized.address = sanitized.address.trim();
    if (sanitized.city) sanitized.city = sanitized.city.trim();
    if (sanitized.state) sanitized.state = sanitized.state.trim();
    if (sanitized.zipCode) sanitized.zipCode = sanitized.zipCode.trim();
    if (sanitized.country) sanitized.country = sanitized.country.trim();
    if (sanitized.allergies) sanitized.allergies = sanitized.allergies.trim();
    if (sanitized.medications) sanitized.medications = sanitized.medications.trim();
    if (sanitized.medicalHistory) sanitized.medicalHistory = sanitized.medicalHistory.trim();
    if (sanitized.familyMedicalHistory) sanitized.familyMedicalHistory = sanitized.familyMedicalHistory.trim();
    if (sanitized.emergencyContactName) sanitized.emergencyContactName = sanitized.emergencyContactName.trim();
    if (sanitized.emergencyContactRelationship) sanitized.emergencyContactRelationship = sanitized.emergencyContactRelationship.trim();
    if (sanitized.insuranceProvider) sanitized.insuranceProvider = sanitized.insuranceProvider.trim();
    if (sanitized.insurancePolicyNumber) sanitized.insurancePolicyNumber = sanitized.insurancePolicyNumber.trim();
    if (sanitized.insuranceGroupNumber) sanitized.insuranceGroupNumber = sanitized.insuranceGroupNumber.trim();

    // Convert empty strings to null
    Object.keys(sanitized).forEach(key => {
      if (sanitized[key] === '') {
        sanitized[key] = null;
      }
    });

    return sanitized;
  }
}