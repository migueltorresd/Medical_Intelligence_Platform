import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

/**
 * Función de arranque de la aplicación
 * Configuración global y inicialización del servidor
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // Configuración global de validación
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
  }));

  // Prefijo global para las rutas de la API
  app.setGlobalPrefix('api/v1');

  // Configuración de CORS
  app.enableCors({
    origin: configService.get('CORS_ORIGIN', 'http://localhost:3000'),
    credentials: true,
  });

  // Puerto de escucha
  const port = configService.get('PORT', 3000);
  
  await app.listen(port);
  
  logger.log(`🚀 Application running on: http://localhost:${port}/api/v1`);
  logger.log(`📚 Environment: ${configService.get('NODE_ENV', 'development')}`);
  logger.log(`🗄️  Database: ${configService.get('DB_HOST', 'localhost')}:${configService.get('DB_PORT', 5432)}`);
}

bootstrap().catch((error) => {
  console.error('❌ Error starting the application:', error);
  process.exit(1);
});
