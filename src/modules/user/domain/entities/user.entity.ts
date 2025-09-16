import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Exclude } from 'class-transformer';

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  MODERATOR = 'moderator',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  name: string;

  @Column({ type: 'varchar', length: 150, unique: true, nullable: false })
  email: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  @Exclude() // Excluir password de las respuestas JSON por seguridad
  password: string;

  @Column({ type: 'int', nullable: true })
  age?: number;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE })
  status: UserStatus;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Domain methods - Principios DDD
  
  /**
   * Activa el usuario
   * Aplica: Single Responsibility Principle
   */
  activate(): void {
    this.status = UserStatus.ACTIVE;
  }

  /**
   * Desactiva el usuario
   * Aplica: Single Responsibility Principle
   */
  deactivate(): void {
    this.status = UserStatus.INACTIVE;
  }

  /**
   * Suspende el usuario
   * Aplica: Single Responsibility Principle
   */
  suspend(): void {
    this.status = UserStatus.SUSPENDED;
  }

  /**
   * Verifica si el usuario está activo
   * Aplica: Tell, Don't Ask principle
   */
  isActive(): boolean {
    return this.status === UserStatus.ACTIVE;
  }

  /**
   * Verifica si el usuario es administrador
   * Aplica: Tell, Don't Ask principle
   */
  isAdmin(): boolean {
    return this.role === UserRole.ADMIN;
  }

  /**
   * Cambia el rol del usuario
   * Aplica: Single Responsibility Principle + validación de dominio
   */
  changeRole(newRole: UserRole): void {
    if (!Object.values(UserRole).includes(newRole)) {
      throw new Error('Invalid user role');
    }
    this.role = newRole;
  }

  /**
   * Actualiza información básica del usuario
   * Aplica: Single Responsibility Principle + validación de dominio
   */
  updateBasicInfo(name: string, age?: number, phone?: string, city?: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('Name cannot be empty');
    }
    
    if (age && (age < 1 || age > 120)) {
      throw new Error('Age must be between 1 and 120');
    }

    this.name = name.trim();
    this.age = age;
    this.phone = phone;
    this.city = city;
  }

  /**
   * Factory method para crear un nuevo usuario
   * Aplica: Factory Pattern + validación de dominio
   */
  static create(
    name: string,
    email: string,
    hashedPassword: string,
    age?: number,
    role: UserRole = UserRole.USER
  ): User {
    if (!name || name.trim().length === 0) {
      throw new Error('Name is required');
    }

    if (!email || !email.includes('@')) {
      throw new Error('Valid email is required');
    }

    if (!hashedPassword || hashedPassword.length < 6) {
      throw new Error('Password hash is required');
    }

    const user = new User();
    user.name = name.trim();
    user.email = email.toLowerCase();
    user.password = hashedPassword;
    user.age = age;
    user.role = role;
    user.status = UserStatus.ACTIVE;

    return user;
  }
}
