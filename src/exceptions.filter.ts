import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';

@Catch(HttpException)
export class CustomExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const status = exception.getStatus() || HttpStatus.INTERNAL_SERVER_ERROR;

    // Derive the message code from the status code
    const messageCode = HttpStatus[status] || 'DEFAULT';

    // Check if the exception response is an object or string
    const exceptionResponse = exception.getResponse();
    const message =
      typeof exceptionResponse === 'object' && 'message' in exceptionResponse
        ? exceptionResponse['message']
        : exceptionResponse;

    response.status(status).json({
      error: true,
      message: message,
      statusCode: status,
      messageCode: messageCode,
      errorMessage: message,
    });
  }
}
