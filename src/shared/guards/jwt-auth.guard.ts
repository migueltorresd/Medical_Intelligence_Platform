import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard de autenticación JWT
 * Aplica: Guard Pattern y Authentication
 * Protege rutas que requieren autenticación
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw err || new UnauthorizedException({
        message: 'Invalid or expired token',
        details: info?.message || 'Authentication failed',
      });
    }
    return user;
  }
}
