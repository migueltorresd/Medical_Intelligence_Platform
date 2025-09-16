import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { User } from '../../domain/entities/user.entity';
import { UserRepositoryPort } from '../../domain/ports/user.repository.port';

/**
 * Adaptador del repositorio de usuarios usando TypeORM
 * Aplica: Dependency Inversion Principle (implementa el puerto del dominio)
 * Aplica: Adapter Pattern (adapta TypeORM al puerto del dominio)
 */
@Injectable()
export class UserRepositoryAdapter implements UserRepositoryPort {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findById(id: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { email } });
  }

  async findAll(page: number, limit: number): Promise<{ users: User[]; total: number }> {
    const [users, total] = await this.userRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return { users, total };
  }

  async findByRole(role: string): Promise<User[]> {
    const queryBuilder = this.userRepository.createQueryBuilder('user');
    queryBuilder.andWhere(':role = ANY(user.medicalRoles)', { role });
    queryBuilder.orderBy('user.createdAt', 'DESC');
    return await queryBuilder.getMany();
  }

  async findByStatus(status: string): Promise<User[]> {
    return await this.userRepository.find({ 
      where: { status: status as any },
      order: { createdAt: 'DESC' },
    });
  }

  async create(user: User): Promise<User> {
    const newUser = this.userRepository.create(user);
    return await this.userRepository.save(newUser);
  }

  async update(id: string, userData: Partial<User>): Promise<User | null> {
    await this.userRepository.update(id, userData);
    return await this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.userRepository.delete(id);
    return result.affected !== undefined && result.affected !== null && result.affected > 0;
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.userRepository.count({ where: { email } });
    return count > 0;
  }

  async countByStatus(status: string): Promise<number> {
    return await this.userRepository.count({ 
      where: { status: status as any } 
    });
  }

  async findWithFilters(filters: {
    name?: string;
    email?: string;
    role?: string;
    status?: string;
    city?: string;
    institutionId?: string;
  }): Promise<User[]> {
    const queryBuilder = this.userRepository.createQueryBuilder('user');

    // Aplicar filtros dinámicamente
    if (filters.name) {
      queryBuilder.andWhere('user.name LIKE :name', { 
        name: `%${filters.name}%` 
      });
    }

    if (filters.email) {
      queryBuilder.andWhere('user.email LIKE :email', { 
        email: `%${filters.email}%` 
      });
    }

    if (filters.role) {
      queryBuilder.andWhere(':role = ANY(user.medicalRoles)', { 
        role: filters.role 
      });
    }

    if (filters.status) {
      queryBuilder.andWhere('user.status = :status', { 
        status: filters.status 
      });
    }

    if (filters.city) {
      queryBuilder.andWhere('user.city LIKE :city', { 
        city: `%${filters.city}%` 
      });
    }

    if (filters.institutionId) {
      queryBuilder.andWhere('user.institutionId = :institutionId', { 
        institutionId: filters.institutionId 
      });
    }

    queryBuilder.orderBy('user.createdAt', 'DESC');

    return await queryBuilder.getMany();
  }
}
