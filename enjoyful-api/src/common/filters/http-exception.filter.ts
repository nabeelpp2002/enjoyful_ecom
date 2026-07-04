import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'INTERNAL_ERROR';
    let extra: Record<string, unknown> = {};

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resp = exceptionResponse as Record<string, unknown>;
        message = (resp.message as string) || message;
        if (Array.isArray(resp.message)) {
          message = (resp.message as string[]).join(', ');
        }
        // Forward any extra payload fields (e.g. `existingReviewId` so the
        // frontend can recover from a duplicate-review conflict by switching
        // to edit mode). Strip known fields we already handled.
        const { message: _m, statusCode: _s, error: _e, code: payloadCode, ...rest } = resp;
        void _m; void _s; void _e;
        if (typeof payloadCode === 'string') code = payloadCode;
        extra = rest;
      }
      if (code === 'INTERNAL_ERROR') code = this.statusToCode(status);
    } else if (exception instanceof Error) {
      // Mongoose / MongoDB duplicate key. The driver returns `code: 11000`
      // as a NUMBER, not the string '11000', so the old check never matched
      // and the dup-key error fell through as a generic 500.
      const errCode = (exception as { code?: number | string }).code;
      if (errCode === 11000 || errCode === '11000') {
        status = HttpStatus.CONFLICT;
        message = 'A record with this value already exists';
        code = 'DUPLICATE_KEY';
      } else {
        this.logger.error(exception.message, exception.stack);
      }
    }

    response.status(status).json({
      success: false,
      error: { code, message, statusCode: status, ...extra },
    });
  }

  private statusToCode(status: number): string {
    const map: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE',
      429: 'TOO_MANY_REQUESTS',
      500: 'INTERNAL_ERROR',
    };
    return map[status] ?? 'ERROR';
  }
}
