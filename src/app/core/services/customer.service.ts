import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { AccountResponseDto } from '../models/account/account-response.dto';
import { AccountActionResponseDto } from '../models/account/account-action-response.dto';
import { AccountLimitResponseDto } from '../models/account/account-limit-response.dto';
import { SetLimitRequestDto } from '../models/account/set-limit-request.dto';
import { OpenAccountRequestDto } from '../models/account/open-account-request.dto';
import { CloseAccountRequestDto } from '../models/account/close-account-request.dto';
import { DashboardSummaryDto } from '../models/account/dashboard-summary.dto';
import { TransactionResponseDto } from '../models/transaction/transaction-response.dto';
import { TransactionRequestDto } from '../models/transaction/transaction-request.dto';
import { TransferRequestDto } from '../models/transaction/transfer-request.dto';
import { CardResponseDto } from '../models/card/card-response.dto';
import { CardSensitiveDto } from '../models/card/card-sensitive.dto';
import { BeneficiaryRequestDto } from '../models/beneficiary/beneficiary-request.dto';
import { BeneficiaryResponseDto } from '../models/beneficiary/beneficiary-response.dto';
import { CustomerProfileDto } from '../models/user/customer-profile.dto';
import { PageResponseDto } from '../models/common/page-response.dto';
import { handleHttpError } from '../interceptors/error.interceptor';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private readonly API_BASE = `${environment.apiUrl}/api/v1/customer`;

  constructor(private http: HttpClient) {}

  // ── Account ──────────────────────────────────────────────────────

  getAccounts(): Observable<AccountResponseDto[]> {
    return this.http
      .get<AccountResponseDto[]>(`${this.API_BASE}/accounts`)
      .pipe(catchError(handleHttpError));
  }

  getDashboardSummary(): Observable<DashboardSummaryDto> {
    return this.http
      .get<DashboardSummaryDto>(`${this.API_BASE}/accounts/dashboard-summary`)
      .pipe(catchError(handleHttpError));
  }

  getAccountDetail(accountNumber: string): Observable<AccountResponseDto> {
    return this.http
      .get<AccountResponseDto>(`${this.API_BASE}/accounts/${accountNumber}`)
      .pipe(catchError(handleHttpError));
  }

  openAccount(data: OpenAccountRequestDto): Observable<AccountResponseDto> {
    return this.http
      .post<AccountResponseDto>(`${this.API_BASE}/accounts/open`, data)
      .pipe(catchError(handleHttpError));
  }

  closureRequest(data: CloseAccountRequestDto): Observable<AccountActionResponseDto> {
    return this.http
      .post<AccountActionResponseDto>(`${this.API_BASE}/accounts/closure-request`, data)
      .pipe(catchError(handleHttpError));
  }

  getAccountLimits(accountNumber: string): Observable<AccountLimitResponseDto[]> {
    return this.http
      .get<AccountLimitResponseDto[]>(`${this.API_BASE}/accounts/${accountNumber}/limits`)
      .pipe(catchError(handleHttpError));
  }

  setAccountLimit(accountNumber: string, limitType: string, data: SetLimitRequestDto): Observable<AccountLimitResponseDto> {
    return this.http
      .put<AccountLimitResponseDto>(`${this.API_BASE}/accounts/${accountNumber}/limits/${limitType}`, data)
      .pipe(catchError(handleHttpError));
  }

  completeLimitsSetup(): Observable<string> {
    return this.http
      .put(`${this.API_BASE}/accounts/limits-setup-complete`, null, { responseType: 'text' })
      .pipe(catchError(handleHttpError));
  }

  completeAccountLimitsConfig(accountNumber: string): Observable<string> {
    return this.http
      .put(`${this.API_BASE}/accounts/${accountNumber}/limits-config-complete`, null, { responseType: 'text' })
      .pipe(catchError(handleHttpError));
  }

  isLastActiveAccount(): Observable<boolean> {
    return this.http
      .get<boolean>(`${this.API_BASE}/accounts/last-active-check`)
      .pipe(catchError(handleHttpError));
  }

  getAccountHolderInfo(accountNumber: string): Observable<{ holderName: string }> {
    return this.http
      .get<{ holderName: string }>(`${this.API_BASE}/accounts/${accountNumber}/holder-info`)
      .pipe(catchError(handleHttpError));
  }

  getMonthlySummary(accountNumber: string): Observable<{
    totalIncome: number;
    totalExpenses: number;
    transactionCount: number;
    incomeChangePercent: number;
    expenseChangePercent: number;
  }> {
    return this.http
      .get<any>(`${this.API_BASE}/accounts/${accountNumber}/monthly-summary`)
      .pipe(catchError(handleHttpError));
  }

  // ── Profilo ──────────────────────────────────────────────────────

  getProfile(): Observable<CustomerProfileDto> {
    return this.http
      .get<CustomerProfileDto>(`${this.API_BASE}/profile`)
      .pipe(catchError(handleHttpError));
  }

  requestPasswordChange(data: { currentPassword: string; newPassword: string; pin: string }): Observable<string> {
    return this.http
      .post(`${this.API_BASE}/password-change`, data, { responseType: 'text' })
      .pipe(catchError(handleHttpError));
  }

  requestLimitChange(accountNumber: string, limitType: string, requestedAmount: number): Observable<string> {
    return this.http
      .post(`${this.API_BASE}/limit-change`, { accountNumber, limitType, requestedAmount }, { responseType: 'text' })
      .pipe(catchError(handleHttpError));
  }

  getMyRequests(): Observable<any[]> {
    return this.http
      .get<any[]>(`${this.API_BASE}/requests`)
      .pipe(catchError(handleHttpError));
  }

  // ── Transazioni ──────────────────────────────────────────────────

  deposit(data: TransactionRequestDto): Observable<TransactionResponseDto> {
    return this.http
      .post<TransactionResponseDto>(`${this.API_BASE}/transactions/deposit`, data)
      .pipe(catchError(handleHttpError));
  }

  withdraw(data: TransactionRequestDto): Observable<TransactionResponseDto> {
    return this.http
      .post<TransactionResponseDto>(`${this.API_BASE}/transactions/withdraw`, data)
      .pipe(catchError(handleHttpError));
  }

  transfer(data: TransferRequestDto): Observable<TransactionResponseDto> {
    return this.http
      .post<TransactionResponseDto>(`${this.API_BASE}/transactions/transfer`, data)
      .pipe(catchError(handleHttpError));
  }

  getRecentTransactions(accountNumber: string): Observable<TransactionResponseDto[]> {
    return this.http
      .get<TransactionResponseDto[]>(
        `${this.API_BASE}/transactions/recent/${accountNumber}`,
      )
      .pipe(catchError(handleHttpError));
  }

  getScheduledTransfers(): Observable<TransactionResponseDto[]> {
    return this.http
      .get<TransactionResponseDto[]>(`${this.API_BASE}/transactions/scheduled`)
      .pipe(catchError(handleHttpError));
  }

  getAllTransactions(
    start: string,
    end: string,
    page = 0,
    size = 20,
  ): Observable<PageResponseDto<TransactionResponseDto>> {
    const params = new HttpParams()
      .set('start', start)
      .set('end', end)
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http
      .get<PageResponseDto<TransactionResponseDto>>(
        `${this.API_BASE}/transactions/all`,
        { params },
      )
      .pipe(catchError(handleHttpError));
  }

  getAccountTransactions(
    accountNumber: string,
    start: string,
    end: string,
    page = 0,
    size = 20,
  ): Observable<PageResponseDto<TransactionResponseDto>> {
    const params = new HttpParams()
      .set('start', start)
      .set('end', end)
      .set('accountNumber', accountNumber)
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http
      .get<PageResponseDto<TransactionResponseDto>>(
        `${this.API_BASE}/transactions/all`,
        { params },
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

  getCardSensitive(cardId: number): Observable<CardSensitiveDto> {
    return this.http
      .get<CardSensitiveDto>(`${this.API_BASE}/cards/${cardId}/sensitive`)
      .pipe(catchError(handleHttpError));
  }

  // ── Beneficiari ──────────────────────────────────────────────────

  getBeneficiaries(): Observable<BeneficiaryResponseDto[]> {
    return this.http
      .get<BeneficiaryResponseDto[]>(`${this.API_BASE}/beneficiaries`)
      .pipe(catchError(handleHttpError));
  }

  saveBeneficiary(data: BeneficiaryRequestDto): Observable<BeneficiaryResponseDto> {
    return this.http
      .post<BeneficiaryResponseDto>(`${this.API_BASE}/beneficiaries`, data)
      .pipe(catchError(handleHttpError));
  }

  deleteBeneficiary(id: number): Observable<string> {
    return this.http
      .delete(`${this.API_BASE}/beneficiaries/${id}`, {
        responseType: 'text',
      })
      .pipe(catchError(handleHttpError));
  }

  checkBeneficiary(accountNumber: string): Observable<BeneficiaryResponseDto | null> {
    return this.http
      .get<BeneficiaryResponseDto | null>(`${this.API_BASE}/beneficiaries/check`, {
        params: { accountNumber },
      })
      .pipe(catchError(handleHttpError));
  }

  renameBeneficiary(id: number, nickname: string): Observable<BeneficiaryResponseDto> {
    return this.http
      .put<BeneficiaryResponseDto>(`${this.API_BASE}/beneficiaries/${id}/rename`, { nickname })
      .pipe(catchError(handleHttpError));
  }

  cancelTransaction(transactionId: number): Observable<{message: string}> {
    return this.http
      .delete<{message: string}>(`${this.API_BASE}/transactions/${transactionId}/cancel`)
      .pipe(catchError(handleHttpError));
  }
}
