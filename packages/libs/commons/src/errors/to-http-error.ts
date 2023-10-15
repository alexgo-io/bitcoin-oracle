/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ApiError,
  BadRequest,
  DebugInfo,
  Help,
  LocalizedMessage,
  PreconditionFailure,
  QuotaFailure,
  RequestInfo,
  ResourceInfo,
  RetryInfo,
  StatusCode,
  TypedErrorInfo,
} from '@meta-protocols-oracle/types';
import {
  BadRequestException,
  ForbiddenException,
  HttpException,
} from '@nestjs/common';
import { ValidationError } from 'class-validator';
import safeJsonStringify from 'safe-json-stringify';

export const formatValidationErrorToString = (errors: ValidationError[]) => {
  if (errors.length === 0) {
    return '';
  }
  let errorMessage = '';
  errors.forEach(v => {
    const constraints = v.constraints;
    if (constraints != null) {
      Object.keys(constraints).forEach(key => {
        errorMessage += `${constraints[key]},`;
      });
    }
  });
  return errorMessage;
};

const StatusToHttpCodeMap: Record<StatusCode, number> = {
  OK: 200,
  INVALID_ARGUMENT: 400,
  FAILED_PRECONDITION: 400,
  OUT_OF_RANGE: 400,
  UNAUTHENTICATED: 401,
  PERMISSION_DENIED: 403,
  NOT_FOUND: 404,
  ABORTED: 409,
  ALREADY_EXISTS: 409,
  RESOURCE_EXHAUSTED: 429,
  CANCELLED: 499,
  DATA_LOSS: 500,
  UNKNOWN: 500,
  INTERNAL: 500,
  UNIMPLEMENTED: 501,
  UNAVAILABLE: 503,
  DEADLINE_EXCEEDED: 504,
  UNPROCESSABLE_ENTITY: 422,
};

const DefaultHttpMessage: Record<StatusCode, string> = {
  OK: 'OK',
  INVALID_ARGUMENT: 'Invalid argument(s)',
  FAILED_PRECONDITION: 'Precondition check failed',
  OUT_OF_RANGE: 'Out of range',
  UNAUTHENTICATED: 'Unauthenticated',
  PERMISSION_DENIED: 'Unauthorized',
  NOT_FOUND: 'Not found',
  ABORTED: 'Aborted',
  ALREADY_EXISTS: 'Already exists',
  RESOURCE_EXHAUSTED: 'Resource exhausted',
  CANCELLED: 'Cancelled',
  DATA_LOSS: 'Data loss',
  UNKNOWN: 'Unknown',
  INTERNAL: 'Internal error',
  UNIMPLEMENTED: 'Not implemented',
  UNAVAILABLE: 'Unavailable',
  DEADLINE_EXCEEDED: 'Timeout',
  UNPROCESSABLE_ENTITY: 'Unprocessable entity',
};

export class ErrorDetailsHttpException extends HttpException {
  constructor(
    public readonly apiError: ApiError,
    public readonly debugInfos: DebugInfo[],
    public override readonly cause: Error,
  ) {
    super(apiError, apiError.error.code);
  }
}

export class ErrorDetails {
  private cause?: Error;
  private debugInfos: DebugInfo[] = [];
  private constructor(private readonly data: ApiError['error']) {}
  static from(status: StatusCode, message?: string): ErrorDetails {
    return new ErrorDetails({
      status,
      message: message || DefaultHttpMessage[status] || 'Unknown',
      code: StatusToHttpCodeMap[status] || 500,
      details: [],
    });
  }
  static fromError(error: Error): ErrorDetails {
    return ErrorDetails.from(StatusCode.UNKNOWN, String(error)).error(error);
  }
  status(status: StatusCode) {
    this.data.status = status;
    this.data.code = StatusToHttpCodeMap[status] || 500;
    return this;
  }
  error(error: Error) {
    const debugInfo: DebugInfo = {
      '@type': 'type.googleapis.com/google.rpc.DebugInfo',
      detail: String(error),
      stackEntries: error.stack?.split('\n').map(s => s.trim()) || [],
    };
    this.debugInfos.push(debugInfo);
    this.cause = error;
    return this;
  }
  retryInfo(retryInfo: Omit<RetryInfo, '@type'>) {
    this.data.details.push({
      ...retryInfo,
      '@type': 'type.googleapis.com/google.rpc.RetryInfo',
    });
    return this;
  }
  quotaFailure(quotaFailure: Omit<QuotaFailure, '@type'>) {
    this.data.details.push({
      ...quotaFailure,
      '@type': 'type.googleapis.com/google.rpc.QuotaFailure',
    });
    return this;
  }
  errorInfo(errorInfo: TypedErrorInfo) {
    this.data.details.push({
      ...errorInfo,
      '@type': 'type.googleapis.com/google.rpc.ErrorInfo',
    });
    return this;
  }
  preconditionFailure(preconditionFailure: Omit<PreconditionFailure, '@type'>) {
    this.data.details.push({
      ...preconditionFailure,
      '@type': 'type.googleapis.com/google.rpc.PreconditionFailure',
    });
    return this;
  }
  badRequest(badRequest: Omit<BadRequest, '@type'>) {
    this.data.details.push({
      ...badRequest,
      '@type': 'type.googleapis.com/google.rpc.BadRequest',
    });
    return this;
  }
  requestInfo(requestInfo: Omit<RequestInfo, '@type'>) {
    this.data.details.push({
      ...requestInfo,
      '@type': 'type.googleapis.com/google.rpc.RequestInfo',
    });
    return this;
  }
  resourceInfo(resourceInfo: Omit<ResourceInfo, '@type'>) {
    this.data.details.push({
      ...resourceInfo,
      '@type': 'type.googleapis.com/google.rpc.ResourceInfo',
    });
    return this;
  }
  help(help: Omit<Help, '@type'>) {
    this.data.details.push({
      ...help,
      '@type': 'type.googleapis.com/google.rpc.Help',
    });
    return this;
  }
  localizedMessage(localizedMessage: Omit<LocalizedMessage, '@type'>) {
    this.data.details.push({
      ...localizedMessage,
      '@type': 'type.googleapis.com/google.rpc.LocalizedMessage',
    });
    return this;
  }
  toErrorDetails(): ApiError {
    return {
      error: this.data,
    };
  }
  toJson(): string {
    return JSON.stringify(this.toErrorDetails());
  }
  toHttpException(): ErrorDetailsHttpException {
    return new ErrorDetailsHttpException(
      this.toErrorDetails(),
      this.debugInfos,
      this.cause ?? new Error(this.data.message),
    );
  }
  throwHttpException(): never {
    throw this.toHttpException();
  }
}

export function toErrorDetailsHttpException(
  exception: unknown,
): ErrorDetailsHttpException {
  if (exception instanceof ErrorDetailsHttpException) return exception;
  if (exception instanceof BadRequestException) {
    if (Array.isArray(exception.getResponse())) {
      const response = exception.getResponse() as { message: string[] };
      const fieldViolations = response.message.map(v => ({
        field: v.split(' ')[0] ?? '',
        description: v,
      }));
      return ErrorDetails.from(
        StatusCode.INVALID_ARGUMENT,
        response.message.join(', '),
      )
        .badRequest({ fieldViolations })
        .error(exception)
        .toHttpException();
    }

    return ErrorDetails.from(
      StatusCode.INVALID_ARGUMENT,
      (exception.getResponse() as { message: string }).message,
    )
      .error(exception)
      .toHttpException();
  }
  if (Array.isArray(exception) && exception[0] instanceof ValidationError) {
    return ErrorDetails.from(
      StatusCode.INVALID_ARGUMENT,
      formatValidationErrorToString(exception as any),
    ).toHttpException();
  }
  if (exception instanceof ForbiddenException) {
    return ErrorDetails.from(StatusCode.PERMISSION_DENIED, exception.message)
      .error(exception)
      .toHttpException();
  }
  if (exception instanceof Error) {
    const e: any = exception;
    if (
      e.code === 10 &&
      e.message.includes('Aborted due to cross-transaction contention')
    ) {
      return ErrorDetails.from(
        StatusCode.ABORTED,
        'Server is busy, please try again',
      )
        .error(exception)
        .toHttpException();
    }
    return ErrorDetails.from(StatusCode.UNKNOWN)
      .error(exception)
      .toHttpException();
  } else {
    const msg =
      typeof exception === 'string'
        ? exception
        : safeJsonStringify(exception as any);
    return ErrorDetails.from(
      StatusCode.UNKNOWN,
      `Unknown error: ${msg}`,
    ).toHttpException();
  }
}
