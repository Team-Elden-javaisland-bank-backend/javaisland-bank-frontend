import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { PendingRegistrationDto } from '../models/user/pending-registration.dto';
import { CustomerListItemDto } from '../models/user/customer-list-item.dto';
import { PageResponseDto } from '../models/common/page-response.dto';
import { AccountResponseDto } from '../models/account/account-response.dto';
import { AccountLimitResponseDto } from '../models/account/account-limit-response.dto';
import { SetLimitRequestDto } from '../models/account/set-limit-request.dto';
import { CardResponseDto } from '../models/card/card-response.dto';
import { EmployeeUserDetailDto } from '../models/user/employee-user-detail.dto';
import { handleHttpError } from '../interceptors/error.interceptor';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  private readonly API_BASE = `${environment.apiUrl}/api/v1/employee`;

  constructor(private http: HttpClient) {}

  // ── Registrazioni ────────────────────────────────────────────────

  getPendingRegistrations(): Observable<PendingRegistrationDto[]> {
    return this.http
      .get<PendingRegistrationDto[]>(
        `${this.API_BASE}/users/registrations/pending`,
      )
      .pipe(catchError(handleHttpError));
  }

  validateRegistration(userId: number): Observable<void> {
    return this.http
      .put<void>(`${this.API_BASE}/users/registrations/${userId}/validate`, null)
      .pipe(catchError(handleHttpError));
  }

  rejectRegistration(userId: number): Observable<void> {
    return this.http
      .put<void>(`${this.API_BASE}/users/registrations/${userId}/reject`, null)
      .pipe(catchError(handleHttpError));
  }

  getRefusedRegistrations(): Observable<PendingRegistrationDto[]> {
    return this.http
      .get<PendingRegistrationDto[]>(
        `${this.API_BASE}/users/registrations/refused`,
      )
      .pipe(catchError(handleHttpError));
  }

  reopenRegistration(userId: number): Observable<void> {
    return this.http
      .put<void>(`${this.API_BASE}/users/registrations/${userId}/reopen`, null)
      .pipe(catchError(handleHttpError));
  }

  deleteUser(userId: number): Observable<void> {
    return this.http
      .delete<void>(`${this.API_BASE}/users/${userId}`)
      .pipe(catchError(handleHttpError));
  }

  // ── Clienti ──────────────────────────────────────────────────────

  getCustomers(status?: string, page?: number, size?: number): Observable<PageResponseDto<CustomerListItemDto>> {
    const params: Record<string, string> = {};
    if (status) params['status'] = status;
    if (page !== undefined) params['page'] = page.toString();
    if (size !== undefined) params['size'] = size.toString();
    return this.http
      .get<PageResponseDto<CustomerListItemDto>>(`${this.API_BASE}/users/customers`, { params })
      .pipe(catchError(handleHttpError));
  }

  // ── Account ──────────────────────────────────────────────────────

  getAccounts(status?: number): Observable<AccountResponseDto[]> {
    const params: Record<string, string> = {};
    if (status !== undefined) {
      params['status'] = status.toString();
    }

    return this.http
      .get<AccountResponseDto[]>(`${this.API_BASE}/accounts`, { params })
      .pipe(catchError(handleHttpError));
  }

  getAccountsByUser(userId: number): Observable<AccountResponseDto[]> {
    return this.http
      .get<AccountResponseDto[]>(`${this.API_BASE}/accounts/user/${userId}`)
      .pipe(catchError(handleHttpError));
  }

  getAccountDetail(accountNumber: string): Observable<AccountResponseDto> {
    return this.http
      .get<AccountResponseDto>(`${this.API_BASE}/accounts/${accountNumber}`)
      .pipe(catchError(handleHttpError));
  }

  getUserDetailByAccount(accountNumber: string): Observable<EmployeeUserDetailDto> {
    return this.http
      .get<EmployeeUserDetailDto>(`${this.API_BASE}/accounts/${accountNumber}/user-detail`)
      .pipe(catchError(handleHttpError));
  }

  activateAccount(accountNumber: string): Observable<void> {
    return this.http
      .put<void>(`${this.API_BASE}/accounts/${accountNumber}/activate`, null)
      .pipe(catchError(handleHttpError));
  }

  freezeAccount(accountNumber: string): Observable<void> {
    return this.http
      .put<void>(`${this.API_BASE}/accounts/${accountNumber}/freeze`, null)
      .pipe(catchError(handleHttpError));
  }

  unfreezeAccount(accountNumber: string): Observable<void> {
    return this.http
      .put<void>(`${this.API_BASE}/accounts/${accountNumber}/unfreeze`, null)
      .pipe(catchError(handleHttpError));
  }

  validateClosure(accountNumber: string): Observable<void> {
    return this.http
      .put<void>(`${this.API_BASE}/accounts/${accountNumber}/closure/validate`, null)
      .pipe(catchError(handleHttpError));
  }

  rejectClosure(accountNumber: string): Observable<void> {
    return this.http
      .put<void>(`${this.API_BASE}/accounts/${accountNumber}/closure/reject`, null)
      .pipe(catchError(handleHttpError));
  }

  rejectAccount(accountNumber: string): Observable<void> {
    return this.http
      .put<void>(`${this.API_BASE}/accounts/${accountNumber}/reject`, null)
      .pipe(catchError(handleHttpError));
  }

  getAccountLimits(accountNumber: string): Observable<AccountLimitResponseDto[]> {
    return this.http
      .get<AccountLimitResponseDto[]>(`${this.API_BASE}/accounts/${accountNumber}/limits`)
      .pipe(catchError(handleHttpError));
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
      .pipe(catchError(handleHttpError));
  }

  // ── Carte ────────────────────────────────────────────────────────

  getCards(): Observable<CardResponseDto[]> {
    return this.http
      .get<CardResponseDto[]>(`${this.API_BASE}/cards`)
      .pipe(catchError(handleHttpError));
  }

  getCardDetail(cardId: number): Observable<CardResponseDto> {
    return this.http
      .get<CardResponseDto>(`${this.API_BASE}/cards/${cardId}`)
      .pipe(catchError(handleHttpError));
  }

  getCardSensitive(cardId: number): Observable<{ cardNumber: string; cvv: string }> {
    return this.http
      .get<{ cardNumber: string; cvv: string }>(`${this.API_BASE}/cards/${cardId}/sensitive`)
      .pipe(catchError(handleHttpError));
  }

  blockCard(cardId: number): Observable<void> {
    return this.http
      .put<void>(`${this.API_BASE}/cards/${cardId}/block`, null)
      .pipe(catchError(handleHttpError));
  }

  unblockCard(cardId: number): Observable<void> {
    return this.http
      .put<void>(`${this.API_BASE}/cards/${cardId}/unblock`, null)
      .pipe(catchError(handleHttpError));
  }

  getCardsByAccount(accountNumber: string): Observable<CardResponseDto[]> {
    return this.http
      .get<CardResponseDto[]>(
        `${this.API_BASE}/accounts/${accountNumber}/cards`,
      )
      .pipe(catchError(handleHttpError));
  }

  // ── Richieste cambio password ────────────────────────────────────

  getPendingPasswordRequests(): Observable<any[]> {
    return this.http
      .get<any[]>(`${this.API_BASE}/users/password-requests/pending?t=${Date.now()}`)
      .pipe(catchError(handleHttpError));
  }

  approvePasswordRequest(requestId: number): Observable<void> {
    return this.http
      .put<void>(`${this.API_BASE}/users/password-requests/${requestId}/approve`, null)
      .pipe(catchError(handleHttpError));
  }

  rejectPasswordRequest(requestId: number): Observable<void> {
    return this.http
      .put<void>(`${this.API_BASE}/users/password-requests/${requestId}/reject`, null)
      .pipe(catchError(handleHttpError));
  }

  getUserDetailByUserId(userId: number): Observable<EmployeeUserDetailDto> {
    return this.http
      .get<EmployeeUserDetailDto>(`${this.API_BASE}/users/${userId}/detail`)
      .pipe(catchError(handleHttpError));
  }

  getAllRequests(): Observable<any[]> {
    return this.http
      .get<any[]>(`${this.API_BASE}/users/all-requests?t=${Date.now()}`)
      .pipe(catchError(handleHttpError));
  }

  // ── Richieste cambio limite ──────────────────────────────────────

  approveLimitRequest(requestId: number): Observable<void> {
    return this.http
      .put<void>(`${this.API_BASE}/users/limit-requests/${requestId}/approve`, null)
      .pipe(catchError(handleHttpError));
  }

  rejectLimitRequest(requestId: number): Observable<void> {
    return this.http
      .put<void>(`${this.API_BASE}/users/limit-requests/${requestId}/reject`, null)
      .pipe(catchError(handleHttpError));
  }
}
