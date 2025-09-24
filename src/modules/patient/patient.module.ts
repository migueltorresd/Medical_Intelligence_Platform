import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PatientController } from './patient.controller';
import { PatientService } from './application/patient.service';
import { PatientRepositoryAdapter } from './infrastructure/persistence/patient.repository.adapter';
import { PatientRepositoryPort } from './domain/ports/patient.repository.port';
import { PatientMapper } from './infrastructure/mappers/patient.mapper';
import { Patient } from './domain/entities/patient.entity';

// Shared modules
import { AuditService } from '../../shared/audit/audit.service';
import { EncryptionService } from '../../shared/encryption/encryption.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Patient]),
  ],
  controllers: [PatientController],
  providers: [
    PatientService,
    PatientMapper,
    {
      provide: PatientRepositoryPort,
      useClass: PatientRepositoryAdapter,
    },
    AuditService,
    EncryptionService,
  ],
  exports: [
    PatientService,
    PatientRepositoryPort,
    PatientMapper,
  ],
})
export class PatientModule {}