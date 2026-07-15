import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { PendingRegistrationDto } from '../models/user/pending-registration.dto';
import { CustomerListItemDto } from '../models/user/customer-list-item.dto';
import { AccountResponseDto } from '../models/account/account-response.dto';
import { AccountLimitResponseDto } from '../models/account/account-limit-response.dto';
import { SetLimitRequestDto } from '../models/account/set-limit-request.dto';
import { CardResponseDto } from '../models/card/card-response.dto';
import { CardSensitiveDto } from '../models/card/card-sensitive.dto';
import { ErrorResponseDto } from '../models/common/error-response.dto';

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  private readonly API_BASE = 'http://localhost:8081/api/v1/employee';

  constructor(private http: HttpClient) {}

  // ── Registrazioni ────────────────────────────────────────────────

  getPendingRegistrations(): Observable<PendingRegistrationDto[]> {
    return this.http
      .get<PendingRegistrationDto[]>(
        `${this.API_BASE}/users/registrations/pending`,
      )
      .pipe(catchError(this.handleError));
  }

  validateRegistration(userId: number): Observable<string> {
    return this.http
      .put(`${this.API_BASE}/users/registrations/${userId}/validate`, null, {
        responseType: 'text',
      })
      .pipe(catchError(this.handleError));
  }

  rejectRegistration(userId: number): Observable<string> {
    return this.http
      .put(`${this.API_BASE}/users/registrations/${userId}/reject`, null, {
        responseType: 'text',
      })
      .pipe(catchError(this.handleError));
  }

  // ── Clienti ──────────────────────────────────────────────────────

  getCustomers(): Observable<CustomerListItemDto[]> {
    return this.http
      .get<CustomerListItemDto[]>(`${this.API_BASE}/users/customers`)
      .pipe(catchError(this.handleError));
  }

  // ── Account ──────────────────────────────────────────────────────

  getAccounts(status?: number): Observable<AccountResponseDto[]> {
    const params: Record<string, string> = {};
    if (status !== undefined) {
      params['status'] = status.toString();
    }

    return this.http
      .get<AccountResponseDto[]>(`${this.API_BASE}/accounts`, { params })
      .pipe(catchError(this.handleError));
  }

  getAccountsByUser(userId: number): Observable<AccountResponseDto[]> {
    return this.http
      .get<AccountResponseDto[]>(`${this.API_BASE}/accounts/user/${userId}`)
      .pipe(catchError(this.handleError));
  }

  getAccountDetail(accountNumber: string): Observable<AccountResponseDto> {
    return this.http
      .get<AccountResponseDto>(`${this.API_BASE}/accounts/${accountNumber}`)
      .pipe(catchError(this.handleError));
  }

  activateAccount(accountNumber: string): Observable<string> {
    return this.http
      .put(`${this.API_BASE}/accounts/${accountNumber}/activate`, null, {
        responseType: 'text',
      })
      .pipe(catchError(this.handleError));
  }

  freezeAccount(accountNumber: string): Observable<string> {
    return this.http
      .put(`${this.API_BASE}/accounts/${accountNumber}/freeze`, null, {
        responseType: 'text',
      })
      .pipe(catchError(this.handleError));
  }

  validateClosure(accountNumber: string): Observable<string> {
    return this.http
      .put(`${this.API_BASE}/accounts/${accountNumber}/closure/validate`, null, {
        responseType: 'text',
      })
      .pipe(catchError(this.handleError));
  }

  rejectClosure(accountNumber: string): Observable<string> {
    return this.http
      .put(`${this.API_BASE}/accounts/${accountNumber}/closure/reject`, null, {
        responseType: 'text',
      })
      .pipe(catchError(this.handleError));
  }

  rejectAccount(accountNumber: string): Observable<string> {
    return this.http
      .put(`${this.API_BASE}/accounts/${accountNumber}/reject`, null, {
        responseType: 'text',
      })
      .pipe(catchError(this.handleError));
  }

  getAccountLimits(accountNumber: string): Observable<AccountLimitResponseDto[]> {
    return this.http
      .get<AccountLimitResponseDto[]>(`${this.API_BASE}/accounts/${accountNumber}/limits`)
      .pipe(catchError(this.handleError));
  }

  setAccountLimit(
    accountNumber: string,
    limitType: string,
    data: SetLimitRequestDto,
  ): Observable<AccountLimitResponseDto> {
    return this.http
      .put<AccountLimitResponseDto>(
        `${this.API_BASE}/accounts/${accountNumber}/limits/${limitType}`,
        data,
      )
      .pipe(catchError(this.handleError));
  }

  // ── Carte ────────────────────────────────────────────────────────

  getCards(): Observable<CardResponseDto[]> {
    return this.http
      .get<CardResponseDto[]>(`${this.API_BASE}/cards`)
      .pipe(catchError(this.handleError));
  }

  getCardDetail(cardId: number): Observable<CardResponseDto> {
    return this.http
      .get<CardResponseDto>(`${this.API_BASE}/cards/${cardId}`)
      .pipe(catchError(this.handleError));
  }

  getCardSensitive(cardId: number): Observable<CardSensitiveDto> {
    return this.http
      .get<CardSensitiveDto>(`${this.API_BASE}/cards/${cardId}/sensitive`)
      .pipe(catchError(this.handleError));
  }

  getCardsByAccount(accountNumber: string): Observable<CardResponseDto[]> {
    return this.http
      .get<CardResponseDto[]>(
        `${this.API_BASE}/accounts/${accountNumber}/cards`,
      )
      .pipe(catchError(this.handleError));
  }

  // ── Error handler ────────────────────────────────────────────────

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Errore sconosciuto. Riprova più tardi.';

    if (error.error && typeof error.error === 'object') {
      const apiError = error.error as ErrorResponseDto;
      if (apiError.message) {
        errorMessage = apiError.message;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }

    return throwError(() => new Error(errorMessage));
  }
}
