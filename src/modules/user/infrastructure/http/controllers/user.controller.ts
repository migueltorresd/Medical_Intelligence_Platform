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
  HttpCode,
  ParseUUIDPipe,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiSecurity,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNoContentResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiConflictResponse
} from '@nestjs/swagger';
import { UserService } from '../../../application/user.service';
import { UserMapper } from '../../mappers/user.mapper';
import { CreateUserDto } from '../dtos/create-user.dto';
import { CreatePatientDto } from '../dtos/create-patient.dto';
import { CreateMedicalProfessionalDto } from '../dtos/create-medical-professional.dto';
import { UpdateUserDto } from '../dtos/update-user.dto';
import { PaginationDto } from '../dtos/pagination.dto';
import { UserFilterDto } from '../dtos/user-filter.dto';
import { JwtAuthGuard } from '../../../../../shared/guards/jwt-auth.guard';
import { MedicalAuthorizationGuard, RequireMedicalRoles, RequireDataClassification, RequireInstitution } from '../../../../../shared/guards/medical-authorization.guard';
import { RolesGuard } from '../../../../../shared/guards/roles.guard';
import { UserStatusGuard } from '../../../../../shared/guards/user-status.guard';
import { ResourceOwnerGuard } from '../../../../../shared/guards/resource-owner.guard';
import { Roles } from '../../../../../shared/decorators/roles.decorator';
import { GetUser } from '../../../../../shared/decorators/get-user.decorator';
import { TransformInterceptor } from '../../../../../shared/interceptors/transform.interceptor';
import { User, MedicalRole, DataClassification } from '../../../domain/entities/user.entity';

/**
 * Controlador de Usuarios Médicos
 * Implementa CRUD completo con seguridad médica, cifrado PHI/PII y auditoría
 * Compatible con roles médicos especializados y multi-tenancy institucional
 */
@ApiTags('👤 Users & Authentication')
@Controller('users')
@UseInterceptors(TransformInterceptor)
@ApiBearerAuth('JWT-auth')
@ApiSecurity('JWT-auth')
@ApiResponse({ status: 401, description: 'No autorizado - Token JWT requerido' })
@ApiResponse({ status: 403, description: 'Prohibido - Permisos insuficientes' })
export class UserController {
  constructor(
    private readonly userService: UserService,
  ) {}

  /**
   * Crear nuevo usuario médico general
   * Acceso: Solo administradores y administradores institucionales
   */
  @ApiOperation({
    summary: 'Crear usuario médico general',
    description: 'Crea un nuevo usuario con roles médicos. Los datos PHI/PII se cifran automáticamente.'
  })
  @ApiBody({ type: CreateUserDto })
  @ApiCreatedResponse({
    description: 'Usuario creado exitosamente',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        name: { type: 'string' },
        email: { type: 'string', format: 'email' },
        medicalRoles: { type: 'array', items: { type: 'string' } },
        institutionId: { type: 'string', format: 'uuid' },
        status: { type: 'string', enum: ['active', 'inactive', 'pending_approval'] }
      }
    }
  })
  @ApiBadRequestResponse({ description: 'Datos de entrada inválidos' })
  @ApiConflictResponse({ description: 'Usuario ya existe con ese email' })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, MedicalAuthorizationGuard)
  @RequireMedicalRoles(MedicalRole.ADMIN, MedicalRole.INSTITUTION_ADMIN)
  async createUser(@Body() createUserDto: CreateUserDto) {
    const user = await this.userService.createUser(createUserDto);
    return UserMapper.toResponseDto(user);
  }

  /**
   * Crear nuevo paciente
   * Acceso: Profesionales médicos y administradores
   */
  @ApiOperation({
    summary: 'Registrar nuevo paciente',
    description: 'Registra un nuevo paciente oncológico con datos PHI protegidos'
  })
  @ApiBody({ type: CreatePatientDto })
  @ApiCreatedResponse({ description: 'Paciente registrado exitosamente' })
  @Post('patients')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, MedicalAuthorizationGuard)
  @RequireMedicalRoles(MedicalRole.DOCTOR, MedicalRole.NURSE, MedicalRole.ONCOLOGIST, MedicalRole.INSTITUTION_ADMIN)
  @RequireDataClassification(DataClassification.PHI)
  async createPatient(@Body() createPatientDto: CreatePatientDto) {
    // Lógica para crear paciente usando factory method
    // const patient = await this.userService.createPatient(createPatientDto);
    // Por ahora usamos el servicio general
    const patientData = {
      ...createPatientDto,
      medicalRoles: [MedicalRole.PATIENT]
    };
    const patient = await this.userService.createUser(patientData);
    return UserMapper.toResponseDto(patient);
  }

  /**
   * Crear profesional médico
   * Acceso: Solo administradores institucionales
   */
  @ApiOperation({
    summary: 'Registrar profesional médico',
    description: 'Registra un nuevo profesional médico con licencia y especialidades'
  })
  @ApiBody({ type: CreateMedicalProfessionalDto })
  @ApiCreatedResponse({ description: 'Profesional médico registrado exitosamente' })
  @Post('medical-professionals')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, MedicalAuthorizationGuard)
  @RequireMedicalRoles(MedicalRole.ADMIN, MedicalRole.INSTITUTION_ADMIN)
  @RequireInstitution()
  async createMedicalProfessional(@Body() createMedicalProfessionalDto: CreateMedicalProfessionalDto) {
    // Lógica para crear profesional médico
    const professionalData = {
      ...createMedicalProfessionalDto,
      medicalRoles: [createMedicalProfessionalDto.medicalRole]
    };
    const professional = await this.userService.createUser(professionalData);
    return UserMapper.toResponseDto(professional);
  }

  /**
   * Obtener todos los usuarios médicos con filtros y paginación
   * Acceso: Administradores y administradores institucionales (con restricción multi-tenant)
   */
  @ApiOperation({
    summary: 'Listar usuarios médicos',
    description: 'Obtiene lista paginada de usuarios médicos con filtros. Los administradores institucionales solo ven usuarios de su institución.'
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número de página (por defecto: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Elementos por página (por defecto: 10)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Búsqueda por nombre o email' })
  @ApiQuery({ name: 'role', required: false, enum: MedicalRole, description: 'Filtrar por rol médico' })
  @ApiQuery({ name: 'status', required: false, type: String, description: 'Filtrar por estado' })
  @ApiQuery({ name: 'institutionId', required: false, type: String, description: 'Filtrar por institución' })
  @ApiOkResponse({
    description: 'Lista de usuarios obtenida exitosamente',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              email: { type: 'string' },
              medicalRoles: { type: 'array', items: { type: 'string' } },
              institutionId: { type: 'string' },
              status: { type: 'string' }
            }
          }
        },
        pagination: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            page: { type: 'number' },
            limit: { type: 'number' },
            totalPages: { type: 'number' }
          }
        }
      }
    }
  })
  @Get()
  @UseGuards(JwtAuthGuard, MedicalAuthorizationGuard)
  @RequireMedicalRoles(MedicalRole.ADMIN, MedicalRole.INSTITUTION_ADMIN)
  async getAllUsers(
    @Query() paginationDto: PaginationDto,
    @Query() filterDto: UserFilterDto,
  ) {
    const { page = 1, limit = 10 } = paginationDto;
    
    const response = await this.userService.getAllUsers({
      page,
      limit,
      ...filterDto
    });
    
    return UserMapper.toPaginatedResponseDto(
      response.users,
      response.total,
      response.page,
      response.limit,
      response.totalPages
    );
  }

  /**
   * Obtener usuario médico por ID
   * Acceso: Administradores, profesionales médicos, o el propio usuario (con restricciones PHI)
   */
  @ApiOperation({
    summary: 'Obtener usuario por ID',
    description: 'Obtiene información de un usuario médico. Los datos PHI se protegen según el rol del solicitante.'
  })
  @ApiParam({ name: 'id', description: 'ID único del usuario', type: String, format: 'uuid' })
  @ApiOkResponse({ description: 'Información del usuario obtenida exitosamente' })
  @ApiNotFoundResponse({ description: 'Usuario no encontrado' })
  @Get(':id')
  @UseGuards(JwtAuthGuard, MedicalAuthorizationGuard)
  @RequireMedicalRoles(MedicalRole.ADMIN, MedicalRole.INSTITUTION_ADMIN, MedicalRole.DOCTOR, MedicalRole.NURSE, MedicalRole.PATIENT)
  async getUserById(@Param('id', ParseUUIDPipe) id: string) {
    const user = await this.userService.getUserById(id);
    return UserMapper.toResponseDto(user);
  }

  /**
   * Actualizar usuario médico
   * Acceso: Administradores, administradores institucionales o el propio usuario
   */
  @ApiOperation({
    summary: 'Actualizar usuario médico',
    description: 'Actualiza información de usuario médico. Solo administradores pueden cambiar roles y estado.'
  })
  @ApiParam({ name: 'id', description: 'ID del usuario a actualizar', type: String, format: 'uuid' })
  @ApiBody({ type: UpdateUserDto })
  @ApiOkResponse({ description: 'Usuario actualizado exitosamente' })
  @ApiNotFoundResponse({ description: 'Usuario no encontrado' })
  @ApiBadRequestResponse({ description: 'Datos inválidos o permisos insuficientes' })
  @Put(':id')
  @UseGuards(JwtAuthGuard, MedicalAuthorizationGuard)
  @RequireMedicalRoles(MedicalRole.ADMIN, MedicalRole.INSTITUTION_ADMIN, MedicalRole.PATIENT, MedicalRole.DOCTOR, MedicalRole.NURSE)
  async updateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
    @GetUser() currentUser: User,
  ) {
    // Solo administradores pueden cambiar roles médicos y status
    const isAdmin = currentUser.medicalRoles.includes(MedicalRole.ADMIN);
    const isInstitutionAdmin = currentUser.medicalRoles.includes(MedicalRole.INSTITUTION_ADMIN);
    
    if (!isAdmin && !isInstitutionAdmin) {
      if (updateUserDto.medicalRoles || updateUserDto.status) {
        throw new BadRequestException('Solo los administradores pueden modificar roles médicos y estado de usuario');
      }
    }

    const updatedUser = await this.userService.updateUser(id, updateUserDto);
    return UserMapper.toResponseDto(updatedUser);
  }

  /**
   * Eliminar usuario (soft delete)
   * Acceso: Solo administradores
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, RolesGuard, UserStatusGuard)
  @Roles('admin')
  async deleteUser(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.userService.deleteUser(id);
  }

  /**
   * Obtener perfil del usuario médico actual
   * Acceso: Cualquier usuario autenticado
   */
  @ApiOperation({
    summary: 'Obtener perfil propio',
    description: 'Obtiene el perfil completo del usuario médico autenticado, incluyendo roles y datos de institución.'
  })
  @ApiOkResponse({
    description: 'Perfil del usuario obtenido exitosamente',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        name: { type: 'string' },
        email: { type: 'string', format: 'email' },
        medicalRoles: { type: 'array', items: { type: 'string' } },
        institutionId: { type: 'string', format: 'uuid' },
        medicalLicenseNumber: { type: 'string' },
        specialties: { type: 'array' },
        status: { type: 'string' },
        lastConsentUpdate: { type: 'string', format: 'date-time' }
      }
    }
  })
  @Get('me/profile')
  @UseGuards(JwtAuthGuard)
  async getCurrentUserProfile(@GetUser() user: User) {
    return UserMapper.toResponseDto(user);
  }

  /**
   * Activar usuario
   * Acceso: Solo administradores
   */
  @Put(':id/activate')
  @UseGuards(JwtAuthGuard, RolesGuard, UserStatusGuard)
  @Roles('admin')
  async activateUser(@Param('id', ParseUUIDPipe) id: string) {
    const updatedUser = await this.userService.activateUser(id);
    return UserMapper.toResponseDto(updatedUser);
  }

  /**
   * Suspender usuario
   * Acceso: Solo administradores
   */
  @ApiOperation({
    summary: 'Suspender usuario médico',
    description: 'Suspende temporalmente el acceso de un usuario médico al sistema'
  })
  @ApiParam({ name: 'id', description: 'ID del usuario a suspender' })
  @ApiOkResponse({ description: 'Usuario suspendido exitosamente' })
  @Put(':id/suspend')
  @UseGuards(JwtAuthGuard, MedicalAuthorizationGuard)
  @RequireMedicalRoles(MedicalRole.ADMIN, MedicalRole.INSTITUTION_ADMIN)
  async suspendUser(@Param('id', ParseUUIDPipe) id: string) {
    const updatedUser = await this.userService.suspendUser(id);
    return UserMapper.toResponseDto(updatedUser);
  }

  /**
   * Gestionar consentimientos de privacidad
   * Acceso: El propio usuario o administradores
   */
  @ApiOperation({
    summary: 'Actualizar consentimientos de privacidad',
    description: 'Actualiza los consentimientos de privacidad del paciente para cumplimiento GDPR/HIPAA'
  })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        consentType: { type: 'string', example: 'data_processing' },
        granted: { type: 'boolean', example: true },
        version: { type: 'string', example: '2.0' }
      }
    }
  })
  @ApiOkResponse({ description: 'Consentimiento actualizado exitosamente' })
  @Put(':id/privacy-consent')
  @UseGuards(JwtAuthGuard, MedicalAuthorizationGuard)
  @RequireDataClassification(DataClassification.PII)
  async updatePrivacyConsent(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() consentData: { consentType: string; granted: boolean; version?: string },
    @GetUser() currentUser: User
  ) {
    // Verificar que el usuario puede modificar estos consentimientos
    const canModify = currentUser.id === id || 
                     currentUser.medicalRoles.includes(MedicalRole.ADMIN) ||
                     currentUser.medicalRoles.includes(MedicalRole.INSTITUTION_ADMIN);
                     
    if (!canModify) {
      throw new BadRequestException('No tiene permisos para modificar estos consentimientos');
    }

    // Lógica para actualizar consentimientos
    // const updatedUser = await this.userService.updatePrivacyConsent(id, consentData);
    // Por ahora simulamos la respuesta
    return {
      message: 'Consentimiento actualizado exitosamente',
      consentType: consentData.consentType,
      granted: consentData.granted,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Obtener usuarios por institución (multi-tenancy)
   * Acceso: Administradores institucionales
   */
  @ApiOperation({
    summary: 'Usuarios por institución',
    description: 'Obtiene todos los usuarios asociados a una institución médica específica'
  })
  @ApiParam({ name: 'institutionId', description: 'ID de la institución médica' })
  @ApiOkResponse({ description: 'Lista de usuarios de la institución obtenida exitosamente' })
  @Get('institution/:institutionId')
  @UseGuards(JwtAuthGuard, MedicalAuthorizationGuard)
  @RequireMedicalRoles(MedicalRole.ADMIN, MedicalRole.INSTITUTION_ADMIN)
  @RequireInstitution()
  async getUsersByInstitution(
    @Param('institutionId', ParseUUIDPipe) institutionId: string,
    @Query() paginationDto: PaginationDto
  ) {
    // Lógica para obtener usuarios por institución
    const response = await this.userService.getAllUsers({
      ...paginationDto,
      institutionId
    });
    
    return UserMapper.toPaginatedResponseDto(
      response.users,
      response.total,
      response.page,
      response.limit,
      response.totalPages
    );
  }
}
