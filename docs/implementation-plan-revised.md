# 🏥 Medical Intelligence Platform - Implementation Plan Revised

## 🎯 **Plan Revisado con Recomendaciones del Arquitecto**

### 📋 **Principios Fundamentales Aplicados**
1. **Security First**: Datos médicos requieren máxima protección
2. **Compliance by Design**: GDPR, HIPAA, normativas Colombia
3. **Observability desde Day 1**: No hay producción sin observabilidad
4. **Boundaries Claros**: Contratos API y domain separation
5. **Testing Pragmático**: Contract tests y E2E para flujos críticos

---

## 🚀 **FASE 1 MEJORADA: Medical-Grade Foundation** (2-3 meses)

### **Sprint 1-2: Security & Compliance Foundation** (Semanas 1-2)

#### 🔐 **1. Sistema de Roles Médicos Avanzado**

**Expansión del módulo `users` existente:**

```typescript
// src/modules/users/domain/entities/medical-user.entity.ts
export enum MedicalRole {
  PATIENT = 'patient',
  DOCTOR = 'doctor',
  NURSE = 'nurse',
  SPECIALIST = 'specialist',
  INSTITUTION_ADMIN = 'institution_admin',
  CAREGIVER = 'caregiver',
  RESEARCHER = 'researcher'
}

export enum DataClassification {
  PHI = 'phi',      // Protected Health Information
  PII = 'pii',      // Personally Identifiable Information
  PUBLIC = 'public', // Non-sensitive data
  INTERNAL = 'internal' // Internal business data
}

@Entity()
export class MedicalUser extends User {
  @Column({
    type: 'enum',
    enum: MedicalRole,
    array: true,
    default: [MedicalRole.PATIENT]
  })
  medicalRoles: MedicalRole[];

  @Column({ nullable: true })
  institutionId?: string;

  @Column({ nullable: true })
  medicalLicenseNumber?: string;

  @Column({ type: 'jsonb', nullable: true })
  specialties?: MedicalSpecialty[];

  @Column({ type: 'jsonb', default: {} })
  privacyConsents: PrivacyConsent[];

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  lastConsentUpdate: Date;

  // Audit fields
  @Column({ type: 'jsonb', default: [] })
  accessLog: AccessLogEntry[];
}
```

**Sistema de Políticas con OPA (Open Policy Agent):**

```typescript
// src/shared/auth/policies/medical-policies.rego
package medical.policies

# Regla básica: solo médicos pueden ver datos PHI
allow_phi_access {
  input.user.roles[_] == "doctor"
  input.user.roles[_] == "nurse"
  input.user.institutionId == input.resource.institutionId
}

# Pacientes solo pueden ver sus propios datos
allow_patient_self_access {
  input.user.roles[_] == "patient"
  input.user.id == input.resource.patientId
}

# Investigadores solo pueden ver datos anonimizados
allow_researcher_access {
  input.user.roles[_] == "researcher"
  input.resource.dataType == "anonymized"
}
```

**Guard de Autorización Médica:**

```typescript
// src/shared/auth/guards/medical-authorization.guard.ts
@Injectable()
export class MedicalAuthorizationGuard implements CanActivate {
  constructor(
    private readonly opaClient: OPAClient,
    private readonly auditService: AuditService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const resource = this.extractResourceInfo(request);

    // Consultar políticas OPA
    const decision = await this.opaClient.evaluate({
      input: {
        user: {
          id: user.id,
          roles: user.medicalRoles,
          institutionId: user.institutionId
        },
        resource: {
          type: resource.type,
          patientId: resource.patientId,
          institutionId: resource.institutionId,
          dataClassification: resource.dataClassification
        }
      }
    });

    // Auditoría obligatoria para datos médicos
    await this.auditService.logAccess({
      userId: user.id,
      resource: resource.id,
      action: request.method,
      allowed: decision.allow,
      timestamp: new Date(),
      ipAddress: request.ip,
      userAgent: request.headers['user-agent']
    });

    return decision.allow;
  }
}
```

#### 🏥 **2. Módulo Patients con Seguridad Médica**

**Entidad Patient con clasificación de datos:**

```typescript
// src/modules/patients/domain/entities/patient.entity.ts
@Entity()
export class Patient {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Encrypted() // Custom decorator para cifrado
  @DataClassification(DataClassification.PHI)
  fullName: string;

  @Column()
  @Encrypted()
  @DataClassification(DataClassification.PHI)
  dateOfBirth: Date;

  @Column()
  @Hashed() // Para identificadores
  @DataClassification(DataClassification.PII)
  nationalId: string;

  @Column({ type: 'jsonb' })
  @DataClassification(DataClassification.PHI)
  medicalHistory: MedicalHistory;

  @Column({ type: 'jsonb', default: {} })
  privacySettings: PrivacySettings;

  @Column()
  institutionId: string;

  // Auditoría obligatoria
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column()
  createdBy: string;

  @Column()
  lastModifiedBy: string;

  @VersionColumn() // Para optimistic locking
  version: number;
}
```

**Decorator de Cifrado Transparente:**

```typescript
// src/shared/encryption/encrypted.decorator.ts
export function Encrypted(): PropertyDecorator {
  return Column({
    type: 'varchar',
    transformer: {
      to: (value: string) => {
        if (!value) return value;
        return EncryptionService.encrypt(value);
      },
      from: (value: string) => {
        if (!value) return value;
        return EncryptionService.decrypt(value);
      }
    }
  });
}

@Injectable()
export class EncryptionService {
  private static readonly algorithm = 'aes-256-gcm';
  private static readonly key = process.env.ENCRYPTION_KEY;

  static encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.algorithm, this.key);
    cipher.setAAD(Buffer.from('medical-data'));
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  }

  static decrypt(encryptedData: string): string {
    const parts = encryptedData.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const decipher = crypto.createDecipher(this.algorithm, this.key);
    decipher.setAAD(Buffer.from('medical-data'));
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}
```

#### 📊 **3. Observabilidad Médica desde el Inicio**

**OpenTelemetry Setup:**

```typescript
// src/shared/observability/tracing.service.ts
import { NodeTracerProvider } from '@opentelemetry/sdk-node';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

@Injectable()
export class TracingService {
  private tracer: Tracer;

  constructor() {
    const provider = new NodeTracerProvider({
      resource: new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: 'medical-intelligence-platform',
        [SemanticResourceAttributes.SERVICE_VERSION]: process.env.APP_VERSION || '1.0.0',
        'medical.compliance.level': 'hipaa',
        'medical.data.classification': 'phi'
      })
    });

    this.tracer = provider.getTracer('medical-platform');
  }

  // Tracing específico para operaciones médicas
  @Span('medical.patient.access')
  async tracePatientAccess<T>(
    patientId: string, 
    userId: string, 
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const span = this.tracer.startSpan(`medical.${operation}`, {
      attributes: {
        'medical.patient.id': patientId,
        'medical.user.id': userId,
        'medical.operation': operation,
        'medical.data.sensitive': true
      }
    });

    try {
      const result = await fn();
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.setStatus({ 
        code: SpanStatusCode.ERROR, 
        message: error.message 
      });
      throw error;
    } finally {
      span.end();
    }
  }
}
```

**Métricas Médicas Específicas:**

```typescript
// src/shared/observability/metrics.service.ts
@Injectable()
export class MedicalMetricsService {
  private readonly patientAccessCounter = new Counter({
    name: 'medical_patient_access_total',
    help: 'Total patient data access attempts',
    labelNames: ['user_role', 'access_type', 'result', 'institution_id']
  });

  private readonly dataClassificationHistogram = new Histogram({
    name: 'medical_data_access_duration_seconds',
    help: 'Time spent accessing medical data by classification',
    labelNames: ['data_classification', 'operation'],
    buckets: [0.1, 0.5, 1.0, 2.0, 5.0]
  });

  private readonly complianceViolationCounter = new Counter({
    name: 'medical_compliance_violations_total',
    help: 'Total compliance violations detected',
    labelNames: ['violation_type', 'severity', 'user_role']
  });

  recordPatientAccess(
    userRole: string, 
    accessType: string, 
    result: 'success' | 'denied' | 'error',
    institutionId: string
  ) {
    this.patientAccessCounter
      .labels(userRole, accessType, result, institutionId)
      .inc();
  }

  recordDataAccess(
    dataClassification: DataClassification,
    operation: string,
    duration: number
  ) {
    this.dataClassificationHistogram
      .labels(dataClassification, operation)
      .observe(duration);
  }

  recordComplianceViolation(
    violationType: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    userRole: string
  ) {
    this.complianceViolationCounter
      .labels(violationType, severity, userRole)
      .inc();
  }
}
```

#### 🧪 **4. Contract Testing Entre Módulos**

**Contratos API definidos:**

```typescript
// src/modules/patients/contracts/patient-api.contract.ts
export interface PatientApiContract {
  // Crear paciente (solo roles autorizados)
  createPatient(
    data: CreatePatientDto,
    userId: string
  ): Promise<{ id: string; status: 'created' | 'pending_approval' }>;

  // Obtener paciente (con control de acceso)
  getPatient(
    patientId: string,
    userId: string,
    dataLevel: 'basic' | 'detailed' | 'full'
  ): Promise<PatientResponseDto>;

  // Buscar pacientes (filtros por institución)
  searchPatients(
    filters: PatientSearchDto,
    pagination: PaginationDto,
    userId: string
  ): Promise<PaginatedResponse<PatientSummaryDto>>;
}
```

**Contract Tests con Pact:**

```typescript
// src/modules/patients/tests/patient-api.contract.spec.ts
describe('Patient API Contract', () => {
  let pact: Pact;

  beforeAll(async () => {
    pact = new Pact({
      consumer: 'medical-frontend',
      provider: 'patient-service',
      port: 3001,
      log: path.resolve(process.cwd(), 'logs', 'pact.log'),
      spec: 2
    });

    await pact.setup();
  });

  describe('GET /patients/:id', () => {
    it('should return patient data for authorized user', async () => {
      await pact
        .given('patient exists and user has access')
        .uponReceiving('a request for patient data')
        .withRequest({
          method: 'GET',
          path: '/patients/patient-123',
          headers: {
            'Authorization': 'Bearer valid-token',
            'X-User-Role': 'doctor'
          }
        })
        .willRespondWith({
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: {
            id: 'patient-123',
            fullName: Matchers.string('John Doe'),
            institutionId: 'institution-456',
            dataClassification: 'phi'
          }
        });

      const response = await request(app.getHttpServer())
        .get('/patients/patient-123')
        .set('Authorization', 'Bearer valid-token')
        .set('X-User-Role', 'doctor');

      expect(response.status).toBe(200);
      expect(response.body.id).toBe('patient-123');
    });
  });
});
```

---

### **Sprint 3-4: Core Medical Functionality** (Semanas 3-4)

#### 🏥 **5. Flujos Clínicos Críticos con SLOs**

**Definición de SLOs para flujos críticos:**

```typescript
// src/shared/observability/medical-slos.ts
export const MedicalSLOs = {
  PATIENT_REGISTRATION: {
    availability: 0.999,     // 99.9% uptime
    latency_p95: 500,       // < 500ms P95
    error_rate: 0.001       // < 0.1% error rate
  },
  
  MEDICAL_RECORD_ACCESS: {
    availability: 0.9995,   // 99.95% uptime (más crítico)
    latency_p99: 200,       // < 200ms P99
    error_rate: 0.0005      // < 0.05% error rate
  },
  
  EMERGENCY_ALERT: {
    availability: 0.9999,   // 99.99% uptime
    latency_p95: 100,       // < 100ms P95
    delivery_success: 0.999  // 99.9% delivery success
  }
};

@Injectable()
export class SLOMonitoringService {
  async checkPatientRegistrationSLO(): Promise<SLOStatus> {
    const metrics = await this.getMetricsForPeriod('patient_registration', '1h');
    
    return {
      name: 'patient_registration',
      availability: metrics.successRate,
      latencyP95: metrics.latencyP95,
      errorRate: metrics.errorRate,
      status: this.evaluateSLO(metrics, MedicalSLOs.PATIENT_REGISTRATION)
    };
  }
}
```

#### 🔄 **6. Event System Ligero (sin Event Sourcing)**

**Domain Events simples para auditoría:**

```typescript
// src/shared/events/domain-event.base.ts
export abstract class DomainEvent {
  public readonly occurredOn: Date;
  public readonly eventId: string;
  public readonly aggregateId: string;
  public readonly eventVersion: number;

  constructor(aggregateId: string, eventVersion: number = 1) {
    this.aggregateId = aggregateId;
    this.eventVersion = eventVersion;
    this.occurredOn = new Date();
    this.eventId = crypto.randomUUID();
  }

  abstract getEventName(): string;
  abstract getEventData(): Record<string, any>;
}

// src/modules/patients/domain/events/patient-created.event.ts
export class PatientCreatedEvent extends DomainEvent {
  constructor(
    patientId: string,
    public readonly institutionId: string,
    public readonly createdBy: string,
    public readonly dataClassification: DataClassification[]
  ) {
    super(patientId);
  }

  getEventName(): string {
    return 'patient.created';
  }

  getEventData(): Record<string, any> {
    return {
      patientId: this.aggregateId,
      institutionId: this.institutionId,
      createdBy: this.createdBy,
      dataClassification: this.dataClassification,
      timestamp: this.occurredOn.toISOString()
    };
  }
}
```

**Event Handler para Auditoría:**

```typescript
// src/shared/events/handlers/audit-event.handler.ts
@EventHandler(PatientCreatedEvent)
export class AuditEventHandler implements IEventHandler<PatientCreatedEvent> {
  constructor(
    private readonly auditService: AuditService,
    private readonly complianceService: ComplianceService
  ) {}

  async handle(event: PatientCreatedEvent): Promise<void> {
    // Auditoría obligatoria
    await this.auditService.logEvent({
      eventId: event.eventId,
      eventType: event.getEventName(),
      aggregateId: event.aggregateId,
      userId: event.createdBy,
      institutionId: event.institutionId,
      timestamp: event.occurredOn,
      dataClassifications: event.dataClassification,
      metadata: event.getEventData()
    });

    // Verificación de compliance
    await this.complianceService.validateDataCreation({
      patientId: event.aggregateId,
      institutionId: event.institutionId,
      dataTypes: event.dataClassification
    });
  }
}
```

---

### **Sprint 5-6: Production Readiness** (Semanas 5-6)

#### 🚀 **7. CI/CD con Security Gates**

**Pipeline con security scanning:**

```yaml
# .github/workflows/medical-platform.yml
name: Medical Platform CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      # Scan de secretos
      - name: Secret Scan
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: main
          head: HEAD
      
      # Scan de vulnerabilidades
      - name: Vulnerability Scan
        uses: aquasec/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'
      
      # Compliance check
      - name: HIPAA Compliance Check
        run: |
          npm run compliance:check
          npm run security:audit

  test:
    needs: security-scan
    runs-on: ubuntu-latest
    steps:
      # Unit tests
      - name: Unit Tests
        run: npm run test:unit:coverage
      
      # Contract tests
      - name: Contract Tests
        run: npm run test:contract
      
      # E2E critical flows
      - name: E2E Critical Flows
        run: npm run test:e2e:critical
      
      # Performance baseline
      - name: Performance Tests
        run: npm run test:performance:baseline

  deploy-staging:
    needs: [security-scan, test]
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Staging
        run: |
          terraform plan -var-file="staging.tfvars"
          terraform apply -auto-approve
          
      - name: Health Check
        run: |
          npm run health:check:staging
          npm run slo:validate:staging
```

#### 🏗️ **8. Infrastructure as Code**

**Terraform module para compliance:**

```hcl
# infrastructure/modules/medical-compliance/main.tf
resource "aws_kms_key" "medical_data" {
  description = "KMS key for medical data encryption"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid = "Enable HIPAA compliance"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action = "kms:*"
        Resource = "*"
      }
    ]
  })

  tags = {
    Purpose = "Medical data encryption"
    Compliance = "HIPAA"
    DataClassification = "PHI"
  }
}

resource "aws_s3_bucket" "medical_audit_logs" {
  bucket = "${var.project_name}-audit-logs-${var.environment}"

  versioning {
    enabled = true
  }

  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        kms_master_key_id = aws_kms_key.medical_data.arn
        sse_algorithm = "aws:kms"
      }
    }
  }

  lifecycle_configuration {
    enabled = true
    
    rule {
      id = "audit_log_retention"
      status = "Enabled"
      
      # HIPAA requires 6 years retention
      expiration {
        days = 2190
      }
    }
  }

  tags = {
    Purpose = "Medical audit logs"
    Retention = "6years"
    Compliance = "HIPAA"
  }
}
```

---

## 📊 **Checklist Prioritario (Recomendaciones del Arquitecto)**

### ✅ **MVP Funcional con Observability**
- [ ] Sistema de roles médicos con OPA
- [ ] Módulo patients con cifrado PHI
- [ ] OpenTelemetry + métricas médicas
- [ ] Contract tests entre módulos
- [ ] SLOs para 2 flujos críticos

### 🔐 **Compliance y Governance**
- [ ] Clasificación de datos PHI/PII/PUBLIC
- [ ] Cifrado en reposo y tránsito
- [ ] Auditoría inmutable de accesos
- [ ] Políticas de retención de datos
- [ ] Consentimientos explícitos

### 🧪 **Testing Strategy**
- [ ] Unit tests con TDD
- [ ] Contract tests con Pact
- [ ] E2E para flujos clínicos críticos
- [ ] Performance baselines
- [ ] Security testing automatizado

### 🚀 **DevOps & Infrastructure**
- [ ] IaC con Terraform
- [ ] CI/CD con security gates
- [ ] Secrets management
- [ ] Blue/green deployment preparado
- [ ] Monitoring y alerting

---

## 💰 **Estimación de Costos Revisada (Pragmática)**

### **Fase 1 - Medical-Grade MVP** ($300-800/mes)
```yaml
Core Infrastructure:
  - VPS (16GB RAM, 8 CPU): $120/mes
  - PostgreSQL managed (encrypted): $80/mes
  - Redis managed: $40/mes
  - Domain + SSL: $20/mes

Security & Compliance:
  - KMS for encryption: $10/mes
  - Audit logging storage: $30/mes
  - Security scanning tools: $50/mes

Monitoring:
  - Grafana Cloud: $30/mes
  - Log aggregation: $40/mes
  - Uptime monitoring: $20/mes

Total: $440/mes base + variables por uso
```

---

## 🎯 **Próximos Pasos Inmediatos**

**¿Empezamos con cuál de estos?**

1. **🔐 Security Foundation**: Implementar sistema de roles médicos + OPA
2. **🏥 Patient Module**: Crear módulo con cifrado y clasificación de datos  
3. **📊 Observability Setup**: OpenTelemetry + métricas médicas
4. **🧪 Testing Infrastructure**: Contract tests y E2E críticos

**Recomiendo empezar con el #1 (Security Foundation)** porque es la base de todo lo demás en aplicaciones médicas.

¿Te parece bien este enfoque revisado? ¿Algún aspecto específico te gustaría que profundice más?