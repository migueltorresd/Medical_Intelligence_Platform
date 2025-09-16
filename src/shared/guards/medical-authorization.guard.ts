import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { AuditService } from '../audit/audit.service';
import { MedicalRole, DataClassification } from '../../modules/user/domain/entities/user.entity';

// Interface para el usuario en el request
interface MedicalUser {
  id: string;
  email: string;
  medicalRoles: MedicalRole[];
  institutionId?: string;
  status: string;
}

// Metadata keys para decorators
export const MEDICAL_ROLES_KEY = 'medical_roles';
export const DATA_CLASSIFICATION_KEY = 'data_classification';
export const INSTITUTION_REQUIRED_KEY = 'institution_required';

// Decoradores para usar en controllers
export const RequireMedicalRoles = (...roles: MedicalRole[]) => 
  Reflect.metadata(MEDICAL_ROLES_KEY, roles);

export const RequireDataClassification = (classification: DataClassification) => 
  Reflect.metadata(DATA_CLASSIFICATION_KEY, classification);

export const RequireInstitution = () => 
  Reflect.metadata(INSTITUTION_REQUIRED_KEY, true);

@Injectable()
export class MedicalAuthorizationGuard implements CanActivate {
  private readonly logger = new Logger(MedicalAuthorizationGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly auditService: AuditService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as MedicalUser;
    
    if (!user) {
      this.logger.warn('No user found in request');
      return false;
    }

    const handler = context.getHandler();
    const controller = context.getClass();
    
    // Extraer metadata de autorizaciones requeridas
    const requiredRoles = this.reflector.getAllAndOverride<MedicalRole[]>(
      MEDICAL_ROLES_KEY,
      [handler, controller]
    );
    
    const requiredDataClassification = this.reflector.getAllAndOverride<DataClassification>(
      DATA_CLASSIFICATION_KEY,
      [handler, controller]
    );
    
    const institutionRequired = this.reflector.getAllAndOverride<boolean>(
      INSTITUTION_REQUIRED_KEY,
      [handler, controller]
    );

    // Extraer información del recurso del request
    const resourceInfo = this.extractResourceInfo(request);
    
    // Evaluar políticas médicas
    const authDecision = await this.evaluateMedicalPolicies({
      user,
      requiredRoles,
      requiredDataClassification,
      institutionRequired,
      resourceInfo,
      request
    });

    // Auditoría obligatoria para todos los accesos médicos
    await this.auditAccess({
      user,
      request,
      resourceInfo,
      authDecision,
      requiredDataClassification
    });

    return authDecision.allowed;
  }

  private async evaluateMedicalPolicies(context: {
    user: MedicalUser;
    requiredRoles?: MedicalRole[];
    requiredDataClassification?: DataClassification;
    institutionRequired?: boolean;
    resourceInfo: any;
    request: Request;
  }): Promise<{ allowed: boolean; reason?: string; riskLevel: string }> {
    const { user, requiredRoles, requiredDataClassification, institutionRequired, resourceInfo } = context;

    // Regla 1: Usuario debe estar activo
    if (user.status !== 'active') {
      return {
        allowed: false,
        reason: 'User is not active',
        riskLevel: 'high'
      };
    }

    // Regla 2: Verificar roles requeridos
    if (requiredRoles && requiredRoles.length > 0) {
      const hasRequiredRole = requiredRoles.some(role => user.medicalRoles.includes(role));
      if (!hasRequiredRole) {
        return {
          allowed: false,
          reason: `User lacks required medical roles: ${requiredRoles.join(', ')}`,
          riskLevel: 'medium'
        };
      }
    }

    // Regla 3: Verificar institución requerida
    if (institutionRequired && !user.institutionId) {
      return {
        allowed: false,
        reason: 'User must be associated with a medical institution',
        riskLevel: 'high'
      };
    }

    // Regla 4: Multi-tenancy - acceso solo dentro de la propia institución
    if (resourceInfo.institutionId && user.institutionId !== resourceInfo.institutionId) {
      // Excepción: usuarios con rol de administrador pueden acceder a otras instituciones
      if (!user.medicalRoles.includes(MedicalRole.ADMIN)) {
        return {
          allowed: false,
          reason: 'Cross-institution access denied',
          riskLevel: 'critical'
        };
      }
    }

    // Regla 5: Acceso a datos PHI - solo profesionales médicos autorizados
    if (requiredDataClassification === DataClassification.PHI) {
      const canAccessPHI = this.canUserAccessPHI(user, resourceInfo);
      if (!canAccessPHI.allowed) {
        return {
          allowed: false,
          reason: canAccessPHI.reason,
          riskLevel: 'critical'
        };
      }
    }

    // Regla 6: Horarios de acceso para roles específicos
    const timeCheck = this.checkAccessTime(user, context.request);
    if (!timeCheck.allowed) {
      return {
        allowed: false,
        reason: timeCheck.reason,
        riskLevel: 'medium'
      };
    }

    // Regla 7: Acceso a datos del propio paciente
    if (resourceInfo.patientId && user.medicalRoles.includes(MedicalRole.PATIENT)) {
      // Los pacientes solo pueden acceder a sus propios datos
      if (user.id !== resourceInfo.patientId) {
        return {
          allowed: false,
          reason: 'Patients can only access their own medical data',
          riskLevel: 'critical'
        };
      }
    }

    return {
      allowed: true,
      riskLevel: 'low'
    };
  }

  private canUserAccessPHI(user: MedicalUser, resourceInfo: any): { allowed: boolean; reason?: string } {
    const medicalProfessionalRoles = [
      MedicalRole.DOCTOR,
      MedicalRole.NURSE,
      MedicalRole.SPECIALIST,
      MedicalRole.ONCOLOGIST,
      MedicalRole.INSTITUTION_ADMIN
    ];

    const hasMedicalRole = user.medicalRoles.some(role => medicalProfessionalRoles.includes(role));
    
    if (!hasMedicalRole) {
      return {
        allowed: false,
        reason: 'User role not authorized for PHI access'
      };
    }

    // Los profesionales médicos deben estar en la misma institución que el recurso
    if (resourceInfo.institutionId && user.institutionId !== resourceInfo.institutionId) {
      return {
        allowed: false,
        reason: 'PHI access requires same institution association'
      };
    }

    return { allowed: true };
  }

  private checkAccessTime(user: MedicalUser, request: Request): { allowed: boolean; reason?: string } {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay(); // 0 = Sunday, 6 = Saturday
    
    // Reglas de horario más estrictas para ciertos roles
    if (user.medicalRoles.includes(MedicalRole.RESEARCHER)) {
      // Investigadores solo en horario laboral
      if (day === 0 || day === 6 || hour < 8 || hour > 18) {
        return {
          allowed: false,
          reason: 'Researcher access limited to business hours'
        };
      }
    }

    // Acceso fuera de horario para roles no críticos requiere justificación adicional
    if ((hour < 6 || hour > 22) && !this.isCriticalRole(user)) {
      // En una implementación completa, podríamos requerir justificación adicional
      this.logger.warn('After-hours access detected', {
        userId: user.id,
        time: now.toISOString(),
        roles: user.medicalRoles
      });
    }

    return { allowed: true };
  }

  private isCriticalRole(user: MedicalUser): boolean {
    const criticalRoles = [
      MedicalRole.DOCTOR,
      MedicalRole.NURSE,
      MedicalRole.ONCOLOGIST,
      MedicalRole.ADMIN
    ];
    
    return user.medicalRoles.some(role => criticalRoles.includes(role));
  }

  private extractResourceInfo(request: Request): {
    patientId?: string;
    institutionId?: string;
    resourceType?: string;
    resourceId?: string;
  } {
    const params = request.params;
    const body = request.body;
    const query = request.query;

    return {
      patientId: params.patientId || body.patientId || query.patientId as string,
      institutionId: params.institutionId || body.institutionId || query.institutionId as string,
      resourceType: this.extractResourceTypeFromPath(request.path),
      resourceId: params.id || params.userId || params.recordId
    };
  }

  private extractResourceTypeFromPath(path: string): string {
    const segments = path.split('/').filter(s => s.length > 0);
    return segments[0] || 'unknown';
  }

  private async auditAccess(context: {
    user: MedicalUser;
    request: Request;
    resourceInfo: any;
    authDecision: { allowed: boolean; reason?: string; riskLevel: string };
    requiredDataClassification?: DataClassification;
  }): Promise<void> {
    const { user, request, resourceInfo, authDecision, requiredDataClassification } = context;

    const dataClassifications: string[] = [];
    if (requiredDataClassification) {
      dataClassifications.push(requiredDataClassification);
    }

    await this.auditService.logAccess({
      userId: user.id,
      resource: resourceInfo.resourceType || 'unknown',
      resourceId: resourceInfo.resourceId,
      action: request.method,
      allowed: authDecision.allowed,
      institutionId: user.institutionId,
      dataClassifications,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
      metadata: {
        path: request.path,
        userRoles: user.medicalRoles,
        authReason: authDecision.reason,
        riskLevel: authDecision.riskLevel,
        resourceInfo
      }
    });
  }
}
