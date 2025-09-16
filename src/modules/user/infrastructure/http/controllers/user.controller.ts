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
import { UserService } from '../../../application/user.service';
import { UserMapper } from '../../mappers/user.mapper';
import { CreateUserDto } from '../dtos/create-user.dto';
import { UpdateUserDto } from '../dtos/update-user.dto';
import { PaginationDto } from '../dtos/pagination.dto';
import { UserFilterDto } from '../dtos/user-filter.dto';
import { JwtAuthGuard } from '../../../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../../shared/guards/roles.guard';
import { UserStatusGuard } from '../../../../../shared/guards/user-status.guard';
import { ResourceOwnerGuard } from '../../../../../shared/guards/resource-owner.guard';
import { Roles } from '../../../../../shared/decorators/roles.decorator';
import { GetUser } from '../../../../../shared/decorators/get-user.decorator';
import { TransformInterceptor } from '../../../../../shared/interceptors/transform.interceptor';
import { User, UserStatus } from '../../../domain/entities/user.entity';

/**
 * Controlador de Usuarios
 * Implementa CRUD completo con autenticación, autorización y validación
 * Aplica: Open/Closed Principle - extensible para nuevas operaciones
 */
@Controller('users')
@UseInterceptors(TransformInterceptor)
export class UserController {
  constructor(
    private readonly userService: UserService,
  ) {}

  /**
   * Crear nuevo usuario
   * Acceso: Solo administradores
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard, UserStatusGuard)
  @Roles('admin')
  async createUser(@Body() createUserDto: CreateUserDto) {
    const user = await this.userService.createUser(createUserDto);
    return UserMapper.toResponseDto(user);
  }

  /**
   * Obtener todos los usuarios con filtros y paginación
   * Acceso: Administradores y moderadores
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard, UserStatusGuard)
  @Roles('admin', 'moderator')
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
   * Obtener usuario por ID
   * Acceso: Administradores, moderadores, o el propio usuario
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, UserStatusGuard, ResourceOwnerGuard)
  @Roles('admin', 'moderator', 'user')
  async getUserById(@Param('id', ParseUUIDPipe) id: string) {
    const user = await this.userService.getUserById(id);
    return UserMapper.toResponseDto(user);
  }

  /**
   * Actualizar usuario
   * Acceso: Administradores o el propio usuario
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, UserStatusGuard, ResourceOwnerGuard)
  @Roles('admin', 'user')
  async updateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
    @GetUser() currentUser: User,
  ) {
    // Solo admin puede cambiar roles y status
    if (currentUser.role !== 'admin') {
      if (updateUserDto.role || updateUserDto.status) {
        throw new BadRequestException('Only administrators can modify user roles and status');
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
   * Obtener perfil del usuario actual
   * Acceso: Usuario autenticado
   */
  @Get('me/profile')
  @UseGuards(JwtAuthGuard, UserStatusGuard)
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
  @Put(':id/suspend')
  @UseGuards(JwtAuthGuard, RolesGuard, UserStatusGuard)
  @Roles('admin')
  async suspendUser(@Param('id', ParseUUIDPipe) id: string) {
    const updatedUser = await this.userService.suspendUser(id);
    return UserMapper.toResponseDto(updatedUser);
  }
}
