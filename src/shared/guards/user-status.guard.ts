import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

/**
 * Guard para verificar el estado del usuario
 * Aplica: Business Rules Validation
 * Solo permite acceso a usuarios con estado 'active'
 */
@Injectable()
export class UserStatusGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return true; // Si no hay usuario, dejar que otro guard se encargue
    }

    if (user.status !== 'active') {
      throw new ForbiddenException({
        message: 'Account access denied',
        details: `Account status is '${user.status}'. Only active accounts can access this resource.`,
      });
    }

    return true;
  }
}
