import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Filtro global para capturar y formatear excepciones
 * Aplica: Exception Handling Pattern
 * Estandariza las respuestas de error de la API
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number;
    let message: string;
    let details: string | object;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
        details = '';
      } else {
        message = (exceptionResponse as any).message || exception.message;
        details = (exceptionResponse as any).details || '';
      }
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';
      details = 'An unexpected error occurred';
      
      // Log para errores no controlados
      this.logger.error(`Unhandled exception: ${exception}`, (exception as Error)?.stack);
    }

    const errorResponse = {
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      details,
    };

    // Log para errores HTTP
    if (status >= 500) {
      this.logger.error(`HTTP ${status} Error`, JSON.stringify(errorResponse));
    } else {
      this.logger.warn(`HTTP ${status} Warning`, JSON.stringify(errorResponse));
    }

    response.status(status).json(errorResponse);
  }
}
