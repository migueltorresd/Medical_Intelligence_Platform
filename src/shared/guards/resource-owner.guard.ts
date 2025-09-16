import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

/**
 * Guard para verificar acceso a recursos propios
 * Aplica: Resource-Based Access Control
 * Permite que usuarios accedan solo a sus propios recursos
 * o que administradores accedan a cualquier recurso
 */
@Injectable()
export class ResourceOwnerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const resourceId = request.params.id;

    if (!user) {
      throw new ForbiddenException({
        message: 'Authentication required',
        details: 'User not found in request',
      });
    }

    // Los administradores pueden acceder a cualquier recurso
    if (user.role === 'admin') {
      return true;
    }

    // Los usuarios solo pueden acceder a sus propios recursos
    if (user.id !== resourceId) {
      throw new ForbiddenException({
        message: 'Access denied to resource',
        details: 'You can only access your own resources',
      });
    }

    return true;
  }
}
