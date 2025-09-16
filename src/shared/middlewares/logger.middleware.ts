import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Middleware para logging de requests
 * Aplica: Middleware Pattern
 * Registra información de cada request HTTP
 */
@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger(LoggerMiddleware.name);

  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl, ip } = req;
    const userAgent = req.get('User-Agent') || '';
    const startTime = Date.now();

    // Log del request entrante
    this.logger.log(`${method} ${originalUrl} - ${ip} - ${userAgent}`);

    // Interceptar la respuesta para log del tiempo de ejecución
    res.on('finish', () => {
      const { statusCode } = res;
      const contentLength = res.get('Content-Length');
      const duration = Date.now() - startTime;

      this.logger.log(
        `${method} ${originalUrl} ${statusCode} ${contentLength} - ${duration}ms - ${ip}`,
      );
    });

    next();
  }
}
