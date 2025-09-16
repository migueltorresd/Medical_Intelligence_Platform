import { User } from '../entities/user.entity';

/**
 * Puerto (Interface) del repositorio de usuarios
 * Aplica: Dependency Inversion Principle
 * El dominio define la interfaz que la infraestructura debe implementar
 */
export interface UserRepositoryPort {
  /**
   * Busca un usuario por ID
   */
  findById(id: string): Promise<User | null>;

  /**
   * Busca un usuario por email
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Obtiene todos los usuarios con paginación
   */
  findAll(page: number, limit: number): Promise<{ users: User[]; total: number }>;

  /**
   * Busca usuarios por rol
   */
  findByRole(role: string): Promise<User[]>;

  /**
   * Busca usuarios por estado
   */
  findByStatus(status: string): Promise<User[]>;

  /**
   * Crea un nuevo usuario
   */
  create(user: User): Promise<User>;

  /**
   * Actualiza un usuario existente
   */
  update(id: string, user: Partial<User>): Promise<User | null>;

  /**
   * Elimina un usuario (soft delete)
   */
  delete(id: string): Promise<boolean>;

  /**
   * Verifica si existe un usuario con el email dado
   */
  existsByEmail(email: string): Promise<boolean>;

  /**
   * Cuenta usuarios por estado
   */
  countByStatus(status: string): Promise<number>;

  /**
   * Busca usuarios con filtros dinámicos
   */
  findWithFilters(filters: {
    name?: string;
    email?: string;
    role?: string;
    status?: string;
    city?: string;
  }): Promise<User[]>;
}

/**
 * Token de inyección de dependencias
 * Aplica: Dependency Injection Pattern
 */
export const USER_REPOSITORY_PORT = Symbol('UserRepositoryPort');
