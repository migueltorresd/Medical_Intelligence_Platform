import { User } from '../../domain/entities/user.entity';

/**
 * Response DTO para usuario
 * Controla qué información se expone al cliente
 */
export interface UserResponseDto {
  id: string;
  name: string;
  email: string;
  age?: number;
  role: string;
  status: string;
  phone?: string;
  city?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Mapper para transformar entidades de dominio a DTOs de respuesta
 * Aplica: Data Transfer Object Pattern
 * Responsabilidad: Controlar la exposición de datos al exterior
 */
export class UserMapper {
  /**
   * Convierte una entidad User a UserResponseDto
   * Excluye campos sensibles como password
   */
  static toResponseDto(user: User): UserResponseDto {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      age: user.age,
      role: user.role,
      status: user.status,
      phone: user.phone,
      city: user.city,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  /**
   * Convierte un array de entidades User a array de DTOs
   */
  static toResponseDtoArray(users: User[]): UserResponseDto[] {
    return users.map(user => this.toResponseDto(user));
  }

  /**
   * Convierte respuesta paginada a formato DTO
   */
  static toPaginatedResponseDto(
    users: User[],
    total: number,
    page: number,
    limit: number,
    totalPages: number
  ) {
    return {
      data: this.toResponseDtoArray(users),
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }
}
