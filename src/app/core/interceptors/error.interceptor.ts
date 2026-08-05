import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { ErrorResponseDto } from '../models/common/error-response.dto';

const DEFAULT_ERROR_MESSAGE = 'An error occurred. Please try again later.';

export function normalizeHttpError(error: unknown): Error {
  let errorMessage = DEFAULT_ERROR_MESSAGE;
  let errorCode: string | undefined;

  if (error instanceof HttpErrorResponse) {
    let body: unknown = error.error;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { /* not JSON */ }
    }
    if (body && typeof body === 'object') {
      const dto = body as ErrorResponseDto;
      if (dto.message) errorMessage = dto.message;
      if (dto.errorCode) errorCode = dto.errorCode;
    } else if (error.message) {
      errorMessage = error.message;
    }
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  const normalized = new Error(errorMessage);
  if (errorCode) (normalized as Error & { errorCode?: string }).errorCode = errorCode;
  return normalized;
}

export function handleHttpError(error: unknown): Observable<never> {
  return throwError(() => normalizeHttpError(error));
}

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(catchError(handleHttpError));
