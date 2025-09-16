import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from '../../../modules/user/domain/entities/user.entity';

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
    username: process.env.DB_USERNAME || 'nestjs_user',
    password: process.env.DB_PASSWORD || 'nestjs_password',
    database: process.env.DB_DATABASE || 'nestjs_hexagonal_db',
    
    // Configuración de entidades
    entities: [User],
    
    // Configuración de sincronización (solo para desarrollo)
    synchronize: process.env.NODE_ENV === 'development',
    
    // Configuración de logging
    logging: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
    
    // Configuración de migraciones
    migrations: ['dist/infrastructure/database/migrations/*{.ts,.js}'],
    migrationsTableName: 'migrations',
    migrationsRun: true,
    
    // Configuración de pool de conexiones
    extra: {
      connectionLimit: 10,
      acquireTimeout: 60000,
      timeout: 60000,
    },
    
    // Configuración de SSL para producción
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    
    // Habilitar cache de consultas
    cache: {
      duration: 30000, // 30 segundos
    },
  }),
);
