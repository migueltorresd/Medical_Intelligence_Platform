import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './domain/entities/user.entity';
import { UserRepositoryAdapter } from './infrastructure/persistence/user.repository.adapter';
import { USER_REPOSITORY_PORT } from './domain/ports/user.repository.port';
import { UserService } from './application/user.service';
import { UserController } from './infrastructure/http/controllers/user.controller';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

/**
 * Módulo de Usuarios
 * Integra todos los componentes del contexto de usuarios siguiendo arquitectura hexagonal
 * Aplica: Dependency Inversion Principle e Interface Segregation Principle
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET', 'super-secret-key'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRES_IN', '1h'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [UserController],
  providers: [
    // Repository Pattern - Dependency Injection
    {
      provide: USER_REPOSITORY_PORT,
      useClass: UserRepositoryAdapter,
    },
    // Application Service
    UserService,
  ],
  exports: [
    USER_REPOSITORY_PORT,
    UserService,
  ],
})
export class UserModule {}
