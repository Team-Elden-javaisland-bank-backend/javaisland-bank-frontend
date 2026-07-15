import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { AccountResponseDto } from '../models/account/account-response.dto';
import { AccountLimitResponseDto } from '../models/account/account-limit-response.dto';
import { OpenAccountRequestDto } from '../models/account/open-account-request.dto';
import { CloseAccountRequestDto } from '../models/account/close-account-request.dto';
import { TransactionResponseDto } from '../models/transaction/transaction-response.dto';
import { TransactionRequestDto } from '../models/transaction/transaction-request.dto';
import { TransferRequestDto } from '../models/transaction/transfer-request.dto';
import { CardResponseDto } from '../models/card/card-response.dto';
import { CardSensitiveDto } from '../models/card/card-sensitive.dto';
import { BeneficiaryRequestDto } from '../models/beneficiary/beneficiary-request.dto';
import { BeneficiaryResponseDto } from '../models/beneficiary/beneficiary-response.dto';
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

  // ── Transazioni ──────────────────────────────────────────────────

  deposit(data: TransactionRequestDto): Observable<string> {
    return this.http
      .post(`${this.API_BASE}/transactions/deposit`, data, {
        responseType: 'text',
      })
      .pipe(catchError(this.handleError));
  }

  withdraw(data: TransactionRequestDto): Observable<string> {
    return this.http
      .post(`${this.API_BASE}/transactions/withdraw`, data, {
        responseType: 'text',
      })
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
