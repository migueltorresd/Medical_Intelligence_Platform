import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// Definir entidad de auditoría
export interface AuditLogEntry {
  id?: string;
  eventId: string;
  eventType: string;
  aggregateId: string;
  userId: string;
  institutionId?: string;
  timestamp: Date;
  dataClassifications: string[];
  ipAddress?: string;
  userAgent?: string;
  action: string;
  resource: string;
  resourceId?: string;
  allowed: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  complianceFlags?: string[];
  metadata?: Record<string, any>;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    // En una implementación completa, inyectaríamos el repositorio de audit logs
    // @InjectRepository(AuditLog) private readonly auditRepository: Repository<AuditLog>
  ) {}

  /**
   * Registra un evento de auditoría para compliance médico
   */
  async logEvent(entry: Omit<AuditLogEntry, 'id' | 'riskLevel' | 'complianceFlags'>): Promise<void> {
    const auditEntry: AuditLogEntry = {
      ...entry,
      riskLevel: this.calculateRiskLevel(entry),
      complianceFlags: this.identifyComplianceFlags(entry),
      timestamp: entry.timestamp || new Date()
    };

    try {
      // Por ahora, log estructurado (en producción sería base de datos inmutable)
      this.logger.log({
        message: 'Medical audit event',
        audit: auditEntry,
        compliance: true,
        severity: auditEntry.riskLevel
      });

      // Aquí haríamos: await this.auditRepository.save(auditEntry);
      
      // Si es crítico, alertar inmediatamente
      if (auditEntry.riskLevel === 'critical') {
        await this.sendCriticalAlert(auditEntry);
      }

    } catch (error) {
      this.logger.error('Failed to log audit event', error, {
        eventId: entry.eventId,
        eventType: entry.eventType
      });
      
      // Los logs de auditoría NUNCA deben fallar silenciosamente
      throw new Error('Audit logging failed - this is a compliance violation');
    }
  }

  /**
   * Registra acceso a datos médicos específico
   */
  async logAccess(access: {
    userId: string;
    resource: string;
    resourceId?: string;
    action: string;
    allowed: boolean;
    institutionId?: string;
    dataClassifications?: string[];
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    await this.logEvent({
      eventId: this.generateEventId(),
      eventType: 'data_access',
      aggregateId: access.resourceId || access.resource,
      userId: access.userId,
      institutionId: access.institutionId,
      timestamp: new Date(),
      dataClassifications: access.dataClassifications || ['unknown'],
      ipAddress: access.ipAddress,
      userAgent: access.userAgent,
      action: access.action,
      resource: access.resource,
      resourceId: access.resourceId,
      allowed: access.allowed,
      metadata: access.metadata
    });
  }

  /**
   * Registra violación de compliance
   */
  async logComplianceViolation(violation: {
    userId: string;
    violationType: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    institutionId?: string;
    affectedResource?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    await this.logEvent({
      eventId: this.generateEventId(),
      eventType: 'compliance_violation',
      aggregateId: violation.affectedResource || violation.userId,
      userId: violation.userId,
      institutionId: violation.institutionId,
      timestamp: new Date(),
      dataClassifications: ['compliance'],
      action: violation.violationType,
      resource: violation.affectedResource || 'system',
      allowed: false,
      metadata: {
        violationType: violation.violationType,
        description: violation.description,
        severity: violation.severity,
        ...violation.metadata
      }
    });
  }

  /**
   * Busca eventos de auditoría por criterios
   */
  async searchAuditLogs(criteria: {
    userId?: string;
    institutionId?: string;
    eventType?: string;
    startDate?: Date;
    endDate?: Date;
    dataClassifications?: string[];
    riskLevel?: string;
    allowed?: boolean;
  }): Promise<AuditLogEntry[]> {
    // En implementación completa, esto sería una query a la BD
    this.logger.log('Searching audit logs', criteria);
    
    // Por ahora retornamos array vacío (implementación pendiente)
    return [];
  }

  /**
   * Genera reporte de compliance para institución
   */
  async generateComplianceReport(institutionId: string, period: {
    startDate: Date;
    endDate: Date;
  }): Promise<{
    totalEvents: number;
    accessAttempts: number;
    violations: number;
    riskDistribution: Record<string, number>;
    topUsers: Array<{ userId: string; eventCount: number }>;
  }> {
    this.logger.log('Generating compliance report', { institutionId, period });
    
    // Implementación pendiente - consultaría la BD
    return {
      totalEvents: 0,
      accessAttempts: 0,
      violations: 0,
      riskDistribution: {},
      topUsers: []
    };
  }

  private calculateRiskLevel(entry: Omit<AuditLogEntry, 'riskLevel' | 'complianceFlags'>): 'low' | 'medium' | 'high' | 'critical' {
    // Lógica de cálculo de riesgo basada en contexto médico
    let riskScore = 0;

    // Factor 1: Tipo de datos accedidos
    if (entry.dataClassifications.includes('phi')) riskScore += 3;
    if (entry.dataClassifications.includes('pii')) riskScore += 2;

    // Factor 2: Acceso no autorizado
    if (!entry.allowed) riskScore += 5;

    // Factor 3: Horario (fuera de horas laborales es más riesgoso)
    const hour = entry.timestamp.getHours();
    if (hour < 6 || hour > 22) riskScore += 1;

    // Factor 4: Tipo de acción
    if (entry.action === 'DELETE') riskScore += 3;
    if (entry.action === 'UPDATE') riskScore += 1;

    // Factor 5: Usuario externo (sin institución)
    if (!entry.institutionId) riskScore += 2;

    if (riskScore >= 8) return 'critical';
    if (riskScore >= 5) return 'high';
    if (riskScore >= 2) return 'medium';
    return 'low';
  }

  private identifyComplianceFlags(entry: Omit<AuditLogEntry, 'riskLevel' | 'complianceFlags'>): string[] {
    const flags: string[] = [];

    // Flags específicos de compliance médico
    if (!entry.allowed) flags.push('unauthorized_access');
    if (entry.dataClassifications.includes('phi')) flags.push('phi_access');
    if (!entry.institutionId) flags.push('external_access');
    
    // GDPR/HIPAA específicos
    if (entry.action === 'DELETE' && entry.dataClassifications.includes('phi')) {
      flags.push('data_deletion_phi');
    }

    // Acceso fuera de horarios
    const hour = entry.timestamp.getHours();
    if (hour < 6 || hour > 22) flags.push('after_hours_access');

    return flags;
  }

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async sendCriticalAlert(entry: AuditLogEntry): Promise<void> {
    this.logger.error('CRITICAL MEDICAL COMPLIANCE EVENT', {
      eventId: entry.eventId,
      userId: entry.userId,
      action: entry.action,
      resource: entry.resource,
      riskLevel: entry.riskLevel,
      complianceFlags: entry.complianceFlags
    });

    // En producción: enviar a sistema de alertas, Slack, email, etc.
    // await this.notificationService.sendCriticalAlert(entry);
  }
}