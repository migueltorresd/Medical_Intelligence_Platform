import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserRepositoryPort, USER_REPOSITORY_PORT } from '../../modules/user/domain/ports/user.repository.port';
import { User } from '../../modules/user/domain/entities/user.entity';

/**
 * Estrategia JWT para Passport
 * Maneja la validación de tokens JWT
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: UserRepositoryPort,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET', 'super-secret-key'),
    });
  }

  /**
   * Valida el payload del token JWT
   * @param payload - Payload decodificado del token
   * @returns Usuario validado
   */
  async validate(payload: any): Promise<User> {
    const { sub: userId } = payload;
    
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      throw new UnauthorizedException('Invalid token - user not found');
    }

    if (user.status !== 'active') {
      throw new UnauthorizedException('Account is not active');
    }

    return user;
  }
}
