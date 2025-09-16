import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { User, UserRole, UserStatus, MedicalRole } from '../domain/entities/user.entity';
import { UserRepositoryPort, USER_REPOSITORY_PORT } from '../domain/ports/user.repository.port';
import * as bcrypt from 'bcryptjs';

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  age?: number;
  phone?: string;
  city?: string;
  medicalRoles?: MedicalRole[];
  institutionId?: string;
  createdBy?: string;
}

export interface UpdateUserData {
  name?: string;
  age?: number;
  phone?: string;
  city?: string;
  medicalRoles?: MedicalRole[];
  status?: UserStatus;
}

export interface GetAllUsersParams {
  page?: number;
  limit?: number;
  role?: string;
  status?: string;
  name?: string;
  email?: string;
  city?: string;
  institutionId?: string;
}

export interface GetAllUsersResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Servicio de aplicación para usuarios
 * Consolida todos los casos de uso en una sola clase
 * Aplica: Single Responsibility Principle (responsabilidad = gestión de usuarios)
 */
@Injectable()
export class UserService {
  constructor(
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: UserRepositoryPort,
  ) {}

  /**
   * Crear un nuevo usuario
   * Aplica: Factory Pattern + validación de negocio
   */
  async createUser(userData: CreateUserData): Promise<User> {
    // Verificar que el email no exista
    const existingUser = await this.userRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(userData.password, 12);

    // Crear usuario usando factory method del dominio
    const user = User.create(
      userData.name,
      userData.email,
      hashedPassword,
      userData.medicalRoles || [MedicalRole.USER],
      userData.age,
      userData.institutionId,
      userData.createdBy
    );

    // Asignar campos opcionales
    if (userData.phone) user.phone = userData.phone;
    if (userData.city) user.city = userData.city;

    return await this.userRepository.create(user);
  }

  /**
   * Obtener usuario por ID
   */
  async getUserById(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  /**
   * Obtener usuario por email
   */
  async getUserByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findByEmail(email);
  }

  /**
   * Obtener todos los usuarios con filtros y paginación
   */
  async getAllUsers(params: GetAllUsersParams = {}): Promise<GetAllUsersResponse> {
    const {
      page = 1,
      limit = 10,
      role,
      status,
      name,
      email,
      city,
    } = params;

    // Si hay filtros específicos, usar búsqueda con filtros
    if (role || status || name || email || city) {
      const users = await this.userRepository.findWithFilters({
        role,
        status,
        name,
        email,
        city,
      });

      // Aplicar paginación manual para filtros
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedUsers = users.slice(startIndex, endIndex);

      return {
        users: paginatedUsers,
        total: users.length,
        page,
        limit,
        totalPages: Math.ceil(users.length / limit),
      };
    }

    // Si no hay filtros, usar paginación directa
    const { users, total } = await this.userRepository.findAll(page, limit);

    return {
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Actualizar usuario
   * Aplica: Domain methods para mantener consistencia
   */
  async updateUser(id: string, updateData: UpdateUserData): Promise<User> {
    const user = await this.getUserById(id);

    // Usar métodos del dominio para actualizaciones
    if (updateData.name || updateData.age || updateData.phone || updateData.city) {
      user.updateBasicInfo(
        updateData.name || user.name,
        updateData.age !== undefined ? updateData.age : user.age,
        updateData.phone !== undefined ? updateData.phone : user.phone,
        updateData.city !== undefined ? updateData.city : user.city
      );
    }

    // Cambiar roles médicos si se especifican
    if (updateData.medicalRoles) {
      // Limpiar roles existentes y asignar nuevos
      user.medicalRoles = [];
      updateData.medicalRoles.forEach(role => user.addMedicalRole(role));
    }

    // Cambiar estado si se especifica
    if (updateData.status) {
      switch (updateData.status) {
        case UserStatus.ACTIVE:
          user.activate();
          break;
        case UserStatus.INACTIVE:
          user.deactivate();
          break;
        case UserStatus.SUSPENDED:
          user.suspend();
          break;
      }
    }

    const updatedUser = await this.userRepository.update(id, user);
    if (!updatedUser) {
      throw new NotFoundException('Failed to update user');
    }

    return updatedUser;
  }

  /**
   * Eliminar usuario (soft delete)
   */
  async deleteUser(id: string): Promise<void> {
    const user = await this.getUserById(id);
    
    const deleted = await this.userRepository.delete(id);
    if (!deleted) {
      throw new NotFoundException('Failed to delete user');
    }
  }

  /**
   * Activar usuario
   */
  async activateUser(id: string): Promise<User> {
    return this.updateUserStatus(id, UserStatus.ACTIVE);
  }

  /**
   * Suspender usuario
   */
  async suspendUser(id: string): Promise<User> {
    return this.updateUserStatus(id, UserStatus.SUSPENDED);
  }

  /**
   * Desactivar usuario
   */
  async deactivateUser(id: string): Promise<User> {
    return this.updateUserStatus(id, UserStatus.INACTIVE);
  }

  /**
   * Cambiar status de usuario
   * Método privado para reutilización
   */
  private async updateUserStatus(id: string, status: UserStatus): Promise<User> {
    const user = await this.getUserById(id);

    // Usar métodos del dominio
    switch (status) {
      case UserStatus.ACTIVE:
        user.activate();
        break;
      case UserStatus.INACTIVE:
        user.deactivate();
        break;
      case UserStatus.SUSPENDED:
        user.suspend();
        break;
    }

    const updatedUser = await this.userRepository.update(id, { status: user.status });
    if (!updatedUser) {
      throw new NotFoundException('Failed to update user status');
    }

    return updatedUser;
  }

  /**
   * Verificar si un email existe
   */
  async emailExists(email: string): Promise<boolean> {
    return await this.userRepository.existsByEmail(email);
  }

  /**
   * Contar usuarios por estado
   */
  async countUsersByStatus(status: string): Promise<number> {
    return await this.userRepository.countByStatus(status);
  }
}
