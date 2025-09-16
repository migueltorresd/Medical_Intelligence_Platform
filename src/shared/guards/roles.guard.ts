import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../modules/user/domain/entities/user.entity';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * Guard de autorización por roles
 * Aplica: Role-Based Access Control (RBAC)
 * Verifica que el usuario tenga los roles necesarios
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true; // Si no se especifican roles, permitir acceso
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException({
        message: 'User not found in request',
        details: 'Authentication required',
      });
    }

    const hasRole = requiredRoles.some(role => user.role === role);

    if (!hasRole) {
      throw new ForbiddenException({
        message: 'Insufficient permissions',
        details: `Required roles: ${requiredRoles.join(', ')}. User role: ${user.role}`,
      });
    }

    return true;
  }
}
