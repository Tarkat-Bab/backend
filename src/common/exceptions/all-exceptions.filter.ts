import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();

    const responseBody = {
      statusCode:
        exception instanceof HttpException
          ? exception.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR,

      message:
        exception instanceof HttpException
          ? exception.getResponse()['message']
          : undefined,
      errorCode:
        exception instanceof HttpException
          ? exception.getResponse()['errorCode']
          : undefined,
      data:
        exception instanceof HttpException
          ? exception.getResponse()['data']
          : undefined,
      status:
        exception instanceof HttpException
          ? exception.getResponse()['status']
          : undefined,
      path: httpAdapter.getRequestUrl(request),
      timestamp: new Date().toISOString(),
    };
    if (process.env.NODE_ENV === 'development') {
      responseBody['stack'] =
        exception instanceof Error ? exception.stack : undefined;
    }

    httpAdapter.reply(
      ctx.getResponse(),
      responseBody,
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
