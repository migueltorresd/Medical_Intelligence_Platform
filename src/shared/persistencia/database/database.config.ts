import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from '../../../modules/user/domain/entities/user.entity';
import { Patient } from '../../../modules/patient/domain/entities/patient.entity';

/**
 * Configuración de la base de datos
 * Aplica: Configuration Pattern
 * Centraliza la configuración de TypeORM para PostgreSQL
 */
export default registerAs(
  'database',
  (): TypeOrmModuleOptions => ({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'medical_admin',
    password: process.env.DB_PASSWORD || 'secure_medical_2024!',
    database: process.env.DB_DATABASE || 'medical_intelligence_platform',
    
    // Configuración de entidades
    entities: [User, Patient],
    
    // Configuración de sincronización (solo para desarrollo)
    synchronize: process.env.DB_SYNCHRONIZE === 'true' || process.env.NODE_ENV === 'development',
    
    // Configuración de logging
    logging: process.env.DB_LOGGING === 'true' || process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
    
    // Configuración de migraciones
    migrations: ['dist/shared/persistencia/database/migrations/*{.ts,.js}'],
    migrationsTableName: 'medical_platform_migrations',
    migrationsRun: false, // Better to run manually in medical environments
    
    // Configuración de pool de conexiones para ambiente médico
    extra: {
      connectionLimit: 20, // Increased for medical platform
      acquireTimeout: 60000,
      timeout: 60000,
      idleTimeout: 300000, // 5 minutes
      max: 20,
      min: 2,
    },
    
    // Configuración de SSL
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    
    // Habilitar cache de consultas (reducido para datos médicos sensibles)
    cache: {
      duration: 10000, // 10 segundos para datos médicos
      type: 'redis', // Use Redis for distributed caching
      options: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || '1'), // Different DB for TypeORM cache
      },
    },
  }),
);
