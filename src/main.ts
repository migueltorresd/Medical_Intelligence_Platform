import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
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

  // Configuración de Swagger para documentación de API médica
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Medical Intelligence Platform API')
    .setDescription(`
      **🏥 Plataforma Médica Inteligente para Oncología**
      
      Esta API proporciona servicios médicos avanzados con inteligencia artificial 
      para el cuidado oncológico, cumpliendo con estándares de seguridad médica 
      (HIPAA, GDPR) y arquitectura hexagonal modular.
      
      ## 🔐 Seguridad y Compliance
      - **Autenticación**: JWT Bearer Token
      - **Autorización**: RBAC con roles médicos especializados
      - **Cifrado**: Datos PHI/PII cifrados con AES-256-GCM
      - **Auditoría**: Logging inmutable de accesos médicos
      - **Multi-tenancy**: Aislamiento por institución médica
      
      ## 🎯 Roles Médicos Disponibles
      - **Patient**: Pacientes con acceso a sus propios datos
      - **Doctor**: Médicos con acceso a datos PHI
      - **Nurse**: Enfermeros con permisos específicos
      - **Oncologist**: Especialistas en oncología
      - **Specialist**: Especialistas médicos
      - **Institution Admin**: Administradores institucionales
      - **Caregiver**: Cuidadores autorizados
      - **Researcher**: Investigadores (datos anonimizados)
      
      ## 📊 Clasificación de Datos
      - **PHI**: Protected Health Information (máxima seguridad)
      - **PII**: Personally Identifiable Information
      - **PUBLIC**: Datos públicos sin restricciones
      - **INTERNAL**: Datos internos de la plataforma
      
      ## 🚨 Importante
      Esta API maneja información médica sensible. Todos los accesos son auditados
      y deben cumplir con las políticas de compliance médico.
    `)
    .setVersion('1.0.0')
    .setContact(
      'Medical Intelligence Platform Team',
      'https://medical-intelligence-platform.com',
      'support@medical-intelligence-platform.com'
    )
    .setLicense(
      'Medical Software License',
      'https://medical-intelligence-platform.com/license'
    )
    .addTag('👤 Users & Authentication', 'Gestión de usuarios y autenticación médica')
    .addTag('🏥 Patients', 'Gestión de pacientes oncológicos')
    .addTag('👨‍⚕️ Medical Professionals', 'Gestión de profesionales médicos')
    .addTag('🎗️ Oncology', 'Servicios especializados en oncología')
    .addTag('🤖 AI Diagnostics', 'Inteligencia artificial para diagnósticos')
    .addTag('💊 Recommendations', 'Motor de recomendaciones personalizadas')
    .addTag('🥗 Nutrition', 'Planes nutricionales especializados')
    .addTag('📋 Symptoms', 'Seguimiento y análisis de síntomas')
    .addTag('🏥 Institutions', 'Gestión de centros médicos')
    .addTag('🌍 Geolocation', 'Servicios de ubicación médica')
    .addTag('📱 Notifications', 'Sistema de notificaciones médicas')
    .addTag('📊 Analytics', 'Métricas y reportes médicos')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Token JWT para autenticación médica',
        in: 'header',
      },
      'JWT-auth'
    )
    .addSecurityRequirements('JWT-auth')
    .addServer('http://localhost:3000/api/v1', 'Desarrollo Local')
    .addServer('https://staging.medical-platform.com/api/v1', 'Staging')
    .addServer('https://api.medical-platform.com/api/v1', 'Producción')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig, {
    operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
    deepScanRoutes: true,
  });
  
  // Personalizar el documento con información médica adicional
  document.info['x-medical-compliance'] = {
    hipaa: 'compliant',
    gdpr: 'compliant',
    dataClassifications: ['PHI', 'PII', 'PUBLIC', 'INTERNAL'],
    auditLevel: 'full'
  };

  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
      defaultModelsExpandDepth: 2,
      defaultModelExpandDepth: 2,
    },
    customSiteTitle: 'Medical Intelligence Platform API',
    customfavIcon: '/favicon-medical.ico',
    customCss: `
      .swagger-ui .topbar { background-color: #2c5282; }
      .swagger-ui .topbar-wrapper img { content: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIGZpbGw9IiNmZmYiPjxwYXRoIGQ9Im0xNiAyYy04IDAtMTQgNi0xNCAxNHM2IDE0IDE0IDE0IDE0LTYgMTQtMTQtNi0xNC0xNC0xNHptMCAyNGMtNiAwLTEwLTQtMTAtMTBzNC0xMCAxMC0xMCAxMCA0IDEwIDEwLTQgMTAtMTAgMTB6bTAtMTZjLTMgMC02IDMtNiA2czMgNiA2IDYgNi0zIDYtNi0zLTYtNi02eiIvPjwvc3ZnPg=='); }
      .swagger-ui .info .title { color: #2c5282; }
      .swagger-ui .scheme-container { background: #f7fafc; border: 1px solid #e2e8f0; }
    `
  });

  // Puerto de escucha
  const port = configService.get('PORT', 3000);
  
  await app.listen(port);
  
  logger.log(`🚀 Medical Intelligence Platform running on: http://localhost:${port}/api/v1`);
  logger.log(`📋 API Documentation (Swagger): http://localhost:${port}/api-docs`);
  logger.log(`🌍 Environment: ${configService.get('NODE_ENV', 'development')}`);
  logger.log(`🗺️ Database: ${configService.get('DB_HOST', 'localhost')}:${configService.get('DB_PORT', 5432)}`);
  logger.log(`🔒 Security: Medical-grade encryption and audit enabled`);
  logger.log(`🏥 Compliance: HIPAA/GDPR ready with PHI/PII protection`);
}

bootstrap().catch((error) => {
  console.error('❌ Error starting the application:', error);
  process.exit(1);
});
