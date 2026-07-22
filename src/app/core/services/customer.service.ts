import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { AccountResponseDto } from '../models/account/account-response.dto';
import { AccountLimitResponseDto } from '../models/account/account-limit-response.dto';
import { SetLimitRequestDto } from '../models/account/set-limit-request.dto';
import { OpenAccountRequestDto } from '../models/account/open-account-request.dto';
import { CloseAccountRequestDto } from '../models/account/close-account-request.dto';
import { TransactionResponseDto } from '../models/transaction/transaction-response.dto';
import { TransactionRequestDto } from '../models/transaction/transaction-request.dto';
import { TransferRequestDto } from '../models/transaction/transfer-request.dto';
import { CardResponseDto } from '../models/card/card-response.dto';
import { CardSensitiveDto } from '../models/card/card-sensitive.dto';
import { BeneficiaryRequestDto } from '../models/beneficiary/beneficiary-request.dto';
import { BeneficiaryResponseDto } from '../models/beneficiary/beneficiary-response.dto';
import { SavedBeneficiaryRequestDto } from '../models/saved-beneficiary/saved-beneficiary-request.dto';
import { SavedBeneficiaryResponseDto } from '../models/saved-beneficiary/saved-beneficiary-response.dto';
import { CustomerProfileDto } from '../models/user/customer-profile.dto';
import { PageResponseDto } from '../models/common/page-response.dto';
import { ErrorResponseDto } from '../models/common/error-response.dto';

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private readonly API_BASE = 'http://localhost:8081/api/v1/customer';

  constructor(private http: HttpClient) {}

  // ── Account ──────────────────────────────────────────────────────

  getAccounts(): Observable<AccountResponseDto[]> {
    return this.http
      .get<AccountResponseDto[]>(`${this.API_BASE}/accounts`)
      .pipe(catchError(this.handleError));
  }

  getAccountDetail(accountNumber: string): Observable<AccountResponseDto> {
    return this.http
      .get<AccountResponseDto>(`${this.API_BASE}/accounts/${accountNumber}`)
      .pipe(catchError(this.handleError));
  }

  openAccount(data: OpenAccountRequestDto): Observable<AccountResponseDto> {
    return this.http
      .post<AccountResponseDto>(`${this.API_BASE}/accounts/open`, data)
      .pipe(catchError(this.handleError));
  }

  closureRequest(data: CloseAccountRequestDto): Observable<string> {
    return this.http
      .post(`${this.API_BASE}/accounts/closure-request`, data, {
        responseType: 'text',
      })
      .pipe(catchError(this.handleError));
  }

  getAccountLimits(accountNumber: string): Observable<AccountLimitResponseDto[]> {
    return this.http
      .get<AccountLimitResponseDto[]>(`${this.API_BASE}/accounts/${accountNumber}/limits`)
      .pipe(catchError(this.handleError));
  }

  setAccountLimit(accountNumber: string, limitType: string, data: SetLimitRequestDto): Observable<AccountLimitResponseDto> {
    return this.http
      .put<AccountLimitResponseDto>(`${this.API_BASE}/accounts/${accountNumber}/limits/${limitType}`, data)
      .pipe(catchError(this.handleError));
  }

  completeLimitsSetup(): Observable<string> {
    return this.http
      .put(`${this.API_BASE}/accounts/limits-setup-complete`, null, { responseType: 'text' })
      .pipe(catchError(this.handleError));
  }

  isLastActiveAccount(): Observable<boolean> {
    return this.http
      .get<boolean>(`${this.API_BASE}/accounts/last-active-check`)
      .pipe(catchError(this.handleError));
  }

  getAccountHolderInfo(accountNumber: string): Observable<{ holderName: string }> {
    return this.http
      .get<{ holderName: string }>(`${this.API_BASE}/accounts/${accountNumber}/holder-info`)
      .pipe(catchError(this.handleError));
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
      .pipe(catchError(this.handleError));
  }

  // ── Profilo ──────────────────────────────────────────────────────

  getProfile(): Observable<CustomerProfileDto> {
    return this.http
      .get<CustomerProfileDto>(`${this.API_BASE}/profile`)
      .pipe(catchError(this.handleError));
  }

  requestPasswordChange(currentPassword: string, newPassword: string): Observable<string> {
    return this.http
      .post(`${this.API_BASE}/password-change`, { currentPassword, newPassword }, { responseType: 'text' })
      .pipe(catchError(this.handleError));
  }

  requestLimitChange(accountNumber: string, limitType: string, requestedAmount: number): Observable<string> {
    return this.http
      .post(`${this.API_BASE}/limit-change`, { accountNumber, limitType, requestedAmount }, { responseType: 'text' })
      .pipe(catchError(this.handleError));
  }

  getMyRequests(): Observable<any[]> {
    return this.http
      .get<any[]>(`${this.API_BASE}/requests`)
      .pipe(catchError(this.handleError));
  }

  // ── Transazioni ──────────────────────────────────────────────────

  deposit(data: TransactionRequestDto): Observable<{message: string}> {
    return this.http
      .post<{message: string}>(`${this.API_BASE}/transactions/deposit`, data)
      .pipe(catchError(this.handleError));
  }

  withdraw(data: TransactionRequestDto): Observable<{message: string}> {
    return this.http
      .post<{message: string}>(`${this.API_BASE}/transactions/withdraw`, data)
      .pipe(catchError(this.handleError));
  }

  transfer(data: TransferRequestDto): Observable<TransactionResponseDto> {
    return this.http
      .post<TransactionResponseDto>(`${this.API_BASE}/transactions/transfer`, data)
      .pipe(catchError(this.handleError));
  }

  getRecentTransactions(accountNumber: string): Observable<TransactionResponseDto[]> {
    return this.http
      .get<TransactionResponseDto[]>(
        `${this.API_BASE}/transactions/recent/${accountNumber}`,
      )
      .pipe(catchError(this.handleError));
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
      .pipe(catchError(this.handleError));
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
      .set('page', page.toString())
      .set('size', size.toString());

    return new Observable<PageResponseDto<TransactionResponseDto>>(observer => {
      this.http
        .get<PageResponseDto<TransactionResponseDto>>(
          `${this.API_BASE}/transactions/all`,
          { params },
        )
        .pipe(catchError(this.handleError))
        .subscribe({
          next: (res) => {
            const filtered = res.content.filter(
              tx => tx.sourceAccountNumber === accountNumber || tx.destinationAccountNumber === accountNumber
            );
            observer.next({
              content: filtered,
              page: res.page,
              size: size,
              totalElements: filtered.length,
              totalPages: Math.ceil(filtered.length / size),
              last: res.last,
            });
            observer.complete();
          },
          error: (err) => observer.error(err),
        });
    });
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

  // ── Beneficiari ──────────────────────────────────────────────────

  getBeneficiaries(): Observable<BeneficiaryResponseDto[]> {
    return this.http
      .get<BeneficiaryResponseDto[]>(`${this.API_BASE}/beneficiaries`)
      .pipe(catchError(this.handleError));
  }

  saveBeneficiary(data: BeneficiaryRequestDto): Observable<BeneficiaryResponseDto> {
    return this.http
      .post<BeneficiaryResponseDto>(`${this.API_BASE}/beneficiaries`, data)
      .pipe(catchError(this.handleError));
  }

  deleteBeneficiary(id: number): Observable<string> {
    return this.http
      .delete(`${this.API_BASE}/beneficiaries/${id}`, {
        responseType: 'text',
      })
      .pipe(catchError(this.handleError));
  }

  checkBeneficiary(accountNumber: string): Observable<BeneficiaryResponseDto | null> {
    return this.http
      .get<BeneficiaryResponseDto | null>(`${this.API_BASE}/beneficiaries/check`, {
        params: { accountNumber },
      })
      .pipe(catchError(this.handleError));
  }

  renameBeneficiary(id: number, nickname: string): Observable<BeneficiaryResponseDto> {
    return this.http
      .put<BeneficiaryResponseDto>(`${this.API_BASE}/beneficiaries/${id}/rename`, { nickname })
      .pipe(catchError(this.handleError));
  }

  cancelTransaction(transactionId: number): Observable<{message: string}> {
    return this.http
      .delete<{message: string}>(`${this.API_BASE}/transactions/${transactionId}/cancel`)
      .pipe(catchError(this.handleError));
  }

  // ── Saved Beneficiari ──────────────────────────────────────────

  getSavedBeneficiaries(): Observable<SavedBeneficiaryResponseDto[]> {
    return this.http
      .get<SavedBeneficiaryResponseDto[]>(`${this.API_BASE}/saved-beneficiaries`)
      .pipe(catchError(this.handleError));
  }

  saveSavedBeneficiary(data: SavedBeneficiaryRequestDto): Observable<SavedBeneficiaryResponseDto> {
    return this.http
      .post<SavedBeneficiaryResponseDto>(`${this.API_BASE}/saved-beneficiaries`, data)
      .pipe(catchError(this.handleError));
  }

  deleteSavedBeneficiary(id: number): Observable<string> {
    return this.http
      .delete(`${this.API_BASE}/saved-beneficiaries/${id}`, { responseType: 'text' })
      .pipe(catchError(this.handleError));
  }

  // ── Error handler ────────────────────────────────────────────────

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred. Please try again later.';

    let body = error.error;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { /* not JSON */ }
    }

    if (body && typeof body === 'object' && body.message) {
      errorMessage = body.message;
    } else if (body && typeof body === 'object' && body.errorCode) {
      errorMessage = `[${body.errorCode}] An error occurred.`;
    }

    return throwError(() => new Error(errorMessage));
  }
}
