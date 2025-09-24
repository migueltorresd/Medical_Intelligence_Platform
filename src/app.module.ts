import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './shared/persistencia/database/database.module';
import { UserModule } from './modules/user/user.module';
import { PatientModule } from './modules/patient/patient.module';
import { AuthModule } from './shared/auth/auth.module';
import { LoggerMiddleware } from './shared/middlewares/logger.middleware';
import { TransformInterceptor } from './shared/interceptors/transform.interceptor';
import { GlobalExceptionFilter } from './shared/filters/global-exception.filter';

/**
 * Módulo Principal de la Aplicación
 * Integra todos los módulos siguiendo arquitectura hexagonal modular
 * Aplica: Single Responsibility Principle - coordinar módulos
 */
@Module({
  imports: [
    // Configuración global de variables de entorno
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    
    // Módulos de infraestructura
    DatabaseModule,
    AuthModule,
    
    // Módulos de dominio
    UserModule,
    PatientModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Interceptor global para transformar respuestas
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    // Filtro global para manejar excepciones
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Middleware global de logging
    consumer
      .apply(LoggerMiddleware)
      .forRoutes('*');
  }
}
