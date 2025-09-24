import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  HttpStatus,
  ParseUUIDPipe,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiSecurity,
  ApiExtraModels,
  getSchemaPath,
} from '@nestjs/swagger';
import { PatientService } from './application/patient.service';
import { 
  CreatePatientDto, 
  UpdatePatientDto, 
  GetAllPatientsParams,
  PatientResponseDto,
  PatientSummaryResponseDto 
} from './application/dto/patient.dto';
import { PatientMapper } from './infrastructure/mappers/patient.mapper';
import { PatientSearchResult } from './domain/ports/patient.repository.port';
import { Patient, PatientStatus, Gender, BloodType } from './domain/entities/patient.entity';

// Guards and Decorators
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { MedicalAuthorizationGuard } from '../../shared/guards/medical-authorization.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { UserStatusGuard } from '../../shared/guards/user-status.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { GetUser } from '../../shared/decorators/get-user.decorator';
import { TransformInterceptor } from '../../shared/interceptors/transform.interceptor';

// Medical Role Types
import { MedicalRole } from '../user/domain/entities/user.entity';

@ApiTags('patients')
@ApiSecurity('bearer')
@ApiBearerAuth()
@ApiExtraModels(PatientResponseDto, PatientSummaryResponseDto)
@Controller('patients')
@UseGuards(JwtAuthGuard, UserStatusGuard, RolesGuard, MedicalAuthorizationGuard)
@UseInterceptors(TransformInterceptor)
export class PatientController {
  constructor(private readonly patientService: PatientService) {}

  @Post()
  @ApiOperation({ 
    summary: 'Create a new patient record',
    description: 'Creates a new patient with encrypted PHI/PII data. Requires medical professional role and HIPAA compliance.'
  })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'Patient successfully created',
    schema: {
      $ref: getSchemaPath(PatientResponseDto),
    },
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid input data or missing HIPAA consent' 
  })
  @ApiResponse({ 
    status: HttpStatus.CONFLICT, 
    description: 'Patient with email or phone already exists' 
  })
  @ApiResponse({ 
    status: HttpStatus.FORBIDDEN, 
    description: 'Insufficient permissions or unauthorized access' 
  })
  @Roles(MedicalRole.DOCTOR, MedicalRole.ONCOLOGIST, MedicalRole.NURSE, MedicalRole.SPECIALIST, MedicalRole.ADMIN)
  async createPatient(
    @Body(ValidationPipe) createPatientDto: CreatePatientDto,
    @GetUser('id') userId: string, @GetUser('institutionId') institutionId?: string,
  ): Promise<PatientResponseDto> {
    const patient = await this.patientService.createPatient(createPatientDto, userId, institutionId);
    return PatientMapper.toResponseDto(patient);
  }

  @Get()
  @ApiOperation({ 
    summary: 'Get all patients with filtering and pagination',
    description: 'Retrieves a paginated list of patients with optional filters. Data returned depends on user role and permissions.'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'List of patients retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        patients: {
          type: 'array',
          items: { $ref: getSchemaPath(PatientResponseDto) }
        },
        total: { type: 'number', description: 'Total number of patients' },
        page: { type: 'number', description: 'Current page number' },
        limit: { type: 'number', description: 'Number of items per page' },
        totalPages: { type: 'number', description: 'Total number of pages' },
      }
    }
  })
  @ApiResponse({ 
    status: HttpStatus.FORBIDDEN, 
    description: 'Insufficient permissions to view patients' 
  })
  @Roles(MedicalRole.DOCTOR, MedicalRole.ONCOLOGIST, MedicalRole.NURSE, MedicalRole.SPECIALIST, MedicalRole.ADMIN, MedicalRole.CAREGIVER)
  async getAllPatients(
    @Query() params: GetAllPatientsParams,
    @GetUser('id') userId: string, @GetUser('institutionId') institutionId?: string,
    @GetUser('medicalRoles') userRoles?: MedicalRole[],
  ): Promise<PatientSearchResult> {
    const result = await this.patientService.getAllPatients(params, userId, institutionId);
    
    // Transform patients based on user role
    const primaryRole = userRoles?.[0] || MedicalRole.ADMIN;
    result.patients = result.patients.map(patient => 
      PatientMapper.toRoleBasedFormat(patient, primaryRole) as Patient
    );

    return result;
  }

  @Get('search')
  @ApiOperation({ 
    summary: 'Search patients by name or medical record number',
    description: 'Performs encrypted search across patient names and medical record numbers.'
  })
  @ApiQuery({ name: 'term', description: 'Search term', required: true, example: 'John Doe' })
  @ApiQuery({ name: 'page', description: 'Page number', required: false, example: 1 })
  @ApiQuery({ name: 'limit', description: 'Items per page', required: false, example: 10 })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Search results retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        patients: {
          type: 'array',
          items: { $ref: getSchemaPath(PatientSummaryResponseDto) }
        },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
        totalPages: { type: 'number' },
      }
    }
  })
  @Roles(MedicalRole.DOCTOR, MedicalRole.ONCOLOGIST, MedicalRole.NURSE, MedicalRole.SPECIALIST, MedicalRole.ADMIN, MedicalRole.CAREGIVER)
  async searchPatients(
    @Query('term') searchTerm: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @GetUser('id') userId: string, @GetUser('institutionId') institutionId?: string,
  ): Promise<PatientSearchResult> {
    const pagination = { page, limit };
    const result = await this.patientService.searchPatientsByName(searchTerm, userId, institutionId, pagination);
    
    // Convert to summary format for search results
    return {
      ...result,
      patients: result.patients.map(patient => 
        PatientMapper.toSummaryResponseDto(patient) as any
      ),
    };
  }

  @Get('statistics')
  @ApiOperation({ 
    summary: 'Get patient statistics for dashboard',
    description: 'Returns aggregated patient statistics including counts by gender, age groups, and insurance status.'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Patient statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number', description: 'Total number of patients' },
        active: { type: 'number', description: 'Number of active patients' },
        inactive: { type: 'number', description: 'Number of inactive patients' },
        byGender: { 
          type: 'object',
          description: 'Patient count by gender',
          properties: {
            male: { type: 'number' },
            female: { type: 'number' },
            other: { type: 'number' },
            prefer_not_to_say: { type: 'number' },
          }
        },
        byAgeGroup: {
          type: 'object',
          description: 'Patient count by age groups',
          properties: {
            pediatric: { type: 'number' },
            young_adult: { type: 'number' },
            adult: { type: 'number' },
            middle_aged: { type: 'number' },
            senior: { type: 'number' },
            unknown: { type: 'number' },
          }
        },
        withInsurance: { type: 'number', description: 'Patients with insurance' },
        withoutInsurance: { type: 'number', description: 'Patients without insurance' },
        withHipaaConsent: { type: 'number', description: 'Patients with HIPAA consent' },
        recentlyAdded: { type: 'number', description: 'Patients added in last 30 days' },
      }
    }
  })
  @Roles(MedicalRole.DOCTOR, MedicalRole.ONCOLOGIST, MedicalRole.ADMIN, MedicalRole.SPECIALIST)
  async getPatientStatistics(
    @GetUser('id') userId: string, @GetUser('institutionId') institutionId?: string,
  ): Promise<any> {
    return this.patientService.getPatientStatistics(userId, institutionId);
  }

  @Get('by-physician/:physicianId')
  @ApiOperation({ 
    summary: 'Get patients by primary physician',
    description: 'Retrieves all patients assigned to a specific primary physician.'
  })
  @ApiParam({ name: 'physicianId', description: 'Primary physician UUID', example: 'uuid-physician' })
  @ApiQuery({ name: 'page', description: 'Page number', required: false, example: 1 })
  @ApiQuery({ name: 'limit', description: 'Items per page', required: false, example: 10 })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Patients retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        patients: {
          type: 'array',
          items: { $ref: getSchemaPath(PatientResponseDto) }
        },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
        totalPages: { type: 'number' },
      }
    }
  })
  @Roles(MedicalRole.DOCTOR, MedicalRole.ONCOLOGIST, MedicalRole.NURSE, MedicalRole.SPECIALIST, MedicalRole.ADMIN)
  async getPatientsByPhysician(
    @Param('physicianId', ParseUUIDPipe) physicianId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @GetUser('id') userId: string, @GetUser('institutionId') institutionId?: string,
  ): Promise<PatientSearchResult> {
    const pagination = { page, limit };
    return this.patientService.getPatientsByPhysician(physicianId, userId, institutionId, pagination);
  }

  @Get('by-institution/:institutionId')
  @ApiOperation({ 
    summary: 'Get patients by institution',
    description: 'Retrieves all patients registered to a specific institution.'
  })
  @ApiParam({ name: 'institutionId', description: 'Institution UUID', example: 'uuid-institution' })
  @ApiQuery({ name: 'page', description: 'Page number', required: false, example: 1 })
  @ApiQuery({ name: 'limit', description: 'Items per page', required: false, example: 10 })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Patients retrieved successfully' 
  })
  @Roles(MedicalRole.ADMIN, MedicalRole.INSTITUTION_ADMIN)
  async getPatientsByInstitution(
    @Param('institutionId', ParseUUIDPipe) institutionId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @GetUser('id') userId: string,
  ): Promise<PatientSearchResult> {
    const pagination = { page, limit };
    return this.patientService.getPatientsByInstitution(institutionId, userId, pagination);
  }

  @Get('mrn/:medicalRecordNumber')
  @ApiOperation({ 
    summary: 'Get patient by medical record number',
    description: 'Retrieves a patient using their unique medical record number.'
  })
  @ApiParam({ name: 'medicalRecordNumber', description: 'Medical record number', example: 'MIP-2024-000001' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Patient retrieved successfully',
    type: PatientResponseDto,
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Patient not found' 
  })
  @Roles(MedicalRole.DOCTOR, MedicalRole.ONCOLOGIST, MedicalRole.NURSE, MedicalRole.SPECIALIST, MedicalRole.ADMIN, MedicalRole.CAREGIVER)
  async getPatientByMRN(
    @Param('medicalRecordNumber') medicalRecordNumber: string,
    @GetUser('id') userId: string, @GetUser('institutionId') institutionId?: string,
    @GetUser('medicalRoles') userRoles?: MedicalRole[],
  ): Promise<PatientResponseDto> {
    const patient = await this.patientService.getPatientByMRN(medicalRecordNumber, userId, institutionId);
    const primaryRole = userRoles?.[0] || MedicalRole.ADMIN;
    const filteredPatient = PatientMapper.toRoleBasedFormat(patient, primaryRole);
    return PatientMapper.toResponseDto(filteredPatient as Patient);
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Get patient by ID',
    description: 'Retrieves a specific patient by their unique identifier. Data returned depends on user role.'
  })
  @ApiParam({ name: 'id', description: 'Patient UUID', example: 'uuid-patient' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Patient retrieved successfully',
    type: PatientResponseDto,
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Patient not found' 
  })
  @ApiResponse({ 
    status: HttpStatus.FORBIDDEN, 
    description: 'Access denied to patient from different institution' 
  })
  @Roles(MedicalRole.DOCTOR, MedicalRole.ONCOLOGIST, MedicalRole.NURSE, MedicalRole.SPECIALIST, MedicalRole.ADMIN, MedicalRole.CAREGIVER)
  async getPatientById(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser('id') userId: string, @GetUser('institutionId') institutionId?: string,
    @GetUser('medicalRoles') userRoles?: MedicalRole[],
  ): Promise<PatientResponseDto> {
    const patient = await this.patientService.getPatientById(id, userId, institutionId);
    const primaryRole = userRoles?.[0] || MedicalRole.ADMIN;
    const filteredPatient = PatientMapper.toRoleBasedFormat(patient, primaryRole);
    return PatientMapper.toResponseDto(filteredPatient as Patient);
  }

  @Put(':id')
  @ApiOperation({ 
    summary: 'Update patient information',
    description: 'Updates patient information. Only authorized medical professionals can perform updates.'
  })
  @ApiParam({ name: 'id', description: 'Patient UUID', example: 'uuid-patient' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Patient updated successfully',
    type: PatientResponseDto,
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Patient not found' 
  })
  @ApiResponse({ 
    status: HttpStatus.CONFLICT, 
    description: 'Email or phone number already in use' 
  })
  @ApiResponse({ 
    status: HttpStatus.FORBIDDEN, 
    description: 'Insufficient permissions or access denied' 
  })
  @Roles(MedicalRole.DOCTOR, MedicalRole.ONCOLOGIST, MedicalRole.NURSE, MedicalRole.SPECIALIST, MedicalRole.ADMIN)
  async updatePatient(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updatePatientDto: UpdatePatientDto,
    @GetUser('id') userId: string, @GetUser('institutionId') institutionId?: string,
  ): Promise<PatientResponseDto> {
    const patient = await this.patientService.updatePatient(id, updatePatientDto, userId, institutionId);
    return PatientMapper.toResponseDto(patient);
  }

  @Put(':id/consent/:consentType')
  @ApiOperation({ 
    summary: 'Update patient consent',
    description: 'Updates specific consent types for a patient (HIPAA, data sharing, marketing).'
  })
  @ApiParam({ name: 'id', description: 'Patient UUID', example: 'uuid-patient' })
  @ApiParam({ 
    name: 'consentType', 
    description: 'Type of consent to update',
    enum: ['hipaa', 'dataSharing', 'marketing'],
    example: 'hipaa'
  })
  @ApiQuery({ name: 'consent', description: 'Consent status', example: true, type: 'boolean' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Patient consent updated successfully',
    type: PatientResponseDto,
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Patient not found' 
  })
  @Roles(MedicalRole.DOCTOR, MedicalRole.ONCOLOGIST, MedicalRole.NURSE, MedicalRole.SPECIALIST, MedicalRole.ADMIN, MedicalRole.CAREGIVER)
  async updatePatientConsent(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('consentType') consentType: 'hipaa' | 'dataSharing' | 'marketing',
    @Query('consent') consent: boolean,
    @GetUser('id') userId: string,
    @GetUser('institutionId') institutionId?: string,
  ): Promise<PatientResponseDto> {
    const patient = await this.patientService.updatePatientConsent(id, consentType, consent, userId, institutionId);
    return PatientMapper.toResponseDto(patient);
  }

  @Delete(':id')
  @ApiOperation({ 
    summary: 'Soft delete patient record',
    description: 'Performs a soft delete of the patient record. Patient must be inactive to be deleted.'
  })
  @ApiParam({ name: 'id', description: 'Patient UUID', example: 'uuid-patient' })
  @ApiResponse({ 
    status: HttpStatus.NO_CONTENT, 
    description: 'Patient soft deleted successfully' 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Patient not found' 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Cannot delete active patient' 
  })
  @ApiResponse({ 
    status: HttpStatus.FORBIDDEN, 
    description: 'Insufficient permissions' 
  })
  @Roles(MedicalRole.DOCTOR, MedicalRole.ONCOLOGIST, MedicalRole.ADMIN)
  async deletePatient(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser('id') userId: string,
    @GetUser('institutionId') institutionId?: string,
  ): Promise<void> {
    return this.patientService.deletePatient(id, userId, institutionId);
  }

  @Get('research/anonymized')
  @ApiOperation({ 
    summary: 'Get anonymized patient data for research',
    description: 'Returns anonymized patient data suitable for medical research. Only available to research roles.'
  })
  @ApiQuery({ name: 'status', description: 'Filter by patient status', required: false, enum: PatientStatus })
  @ApiQuery({ name: 'gender', description: 'Filter by gender', required: false, enum: Gender })
  @ApiQuery({ name: 'bloodType', description: 'Filter by blood type', required: false, enum: BloodType })
  @ApiQuery({ name: 'hasInsurance', description: 'Filter by insurance status', required: false, type: 'boolean' })
  @ApiQuery({ name: 'hipaaConsent', description: 'Filter by HIPAA consent', required: false, type: 'boolean' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Anonymized patient data retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        description: 'Anonymized patient data',
      }
    }
  })
  @ApiResponse({ 
    status: HttpStatus.FORBIDDEN, 
    description: 'Insufficient permissions - requires research role' 
  })
  @Roles(MedicalRole.RESEARCHER, MedicalRole.ADMIN)
  async getAnonymizedPatients(
    @GetUser('id') userId: string,
    @GetUser('institutionId') institutionId?: string,
    @Query('status') status?: PatientStatus,
    @Query('gender') gender?: Gender,
    @Query('bloodType') bloodType?: BloodType,
    @Query('hasInsurance') hasInsurance?: boolean,
    @Query('hipaaConsent') hipaaConsent?: boolean,
  ): Promise<Partial<Patient>[]> {
    const filters = {
      status,
      gender,
      bloodType,
      hasInsurance,
      hipaaConsent,
    };
    return this.patientService.getAnonymizedPatients(filters, userId, institutionId);
  }
}

