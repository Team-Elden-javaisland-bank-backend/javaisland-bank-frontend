import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ErrorResponseDto } from '../models/common/error-response.dto';

export interface AdminDashboardDto {
  totalCustomers: number;
  totalEmployees: number;
  totalAccounts: number;
  activeAccounts: number;
  frozenAccounts: number;
  pendingRegistrations: number;
  totalTransactions: number;
  totalBalance: number;
}

export interface EmployeeListItemDto {
  userId: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
  createdAt: string;
}

export interface CreateEmployeeRequestDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface AuditLogDto {
  id: number;
  entityType: string;
  entityId: number;
  action: string;
  performedBy: string;
  performedByUserId: number | null;
  details: string;
  performedAt: string;
}

export interface EmployeeDetailDto {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  birthDate: string;
  status: string;
  createdAt: string;
}

export interface AdminCustomerListItemDto {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  status: string;
  accountCount: number;
  totalBalance: number;
  createdAt: string;
}

export interface AdminCustomerDetailDto {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  birthDate: string;
  gender: string;
  fiscalCode: string;
  phone: string;
  residence: string;
  birthPlace: string;
  birthProvince: string;
  profession: string;
  status: string;
  createdAt: string;
  accounts: any[];
}

export interface AdminAccountListItemDto {
  accountNumber: string;
  balance: number;
  statusId: number;
  userId: number;
  userFullName: string;
  userEmail: string;
  createdAt: string;
  closedAt: string | null;
}

export interface AdminTransactionListItemDto {
  id: number;
  amount: number;
  typeId: number;
  statusId: number;
  description: string;
  sourceAccountNumber: string;
  destinationAccountNumber: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly API_BASE = 'http://localhost:8081/api/v1/admin';

  constructor(private http: HttpClient) {}

  getDashboard(): Observable<AdminDashboardDto> {
    return this.http
      .get<AdminDashboardDto>(`${this.API_BASE}/dashboard`)
      .pipe(catchError(this.handleError));
  }

  getEmployees(): Observable<EmployeeListItemDto[]> {
    return this.http
      .get<EmployeeListItemDto[]>(`${this.API_BASE}/employees?t=${Date.now()}`)
      .pipe(catchError(this.handleError));
  }

  createEmployee(data: CreateEmployeeRequestDto): Observable<EmployeeListItemDto> {
    return this.http
      .post<EmployeeListItemDto>(`${this.API_BASE}/employees`, data)
      .pipe(catchError(this.handleError));
  }

  suspendEmployee(userId: number): Observable<string> {
    return this.http
      .put(`${this.API_BASE}/employees/${userId}/suspend`, null, { responseType: 'text' })
      .pipe(catchError(this.handleError));
  }

  activateEmployee(userId: number): Observable<string> {
    return this.http
      .put(`${this.API_BASE}/employees/${userId}/activate`, null, { responseType: 'text' })
      .pipe(catchError(this.handleError));
  }

  getAuditLogs(params?: { action?: string; recentDays?: number }): Observable<AuditLogDto[]> {
    const queryParams: Record<string, string> = {};
    if (params?.action) queryParams['action'] = params.action;
    if (params?.recentDays) queryParams['recentDays'] = params.recentDays.toString();

    return this.http
      .get<AuditLogDto[]>(`${this.API_BASE}/audit-logs`, { params: queryParams })
      .pipe(catchError(this.handleError));
  }

  getEmployeeDetail(userId: number): Observable<EmployeeDetailDto> {
    return this.http
      .get<EmployeeDetailDto>(`${this.API_BASE}/employees/${userId}`)
      .pipe(catchError(this.handleError));
  }

  getCustomers(): Observable<AdminCustomerListItemDto[]> {
    return this.http
      .get<AdminCustomerListItemDto[]>(`${this.API_BASE}/customers`)
      .pipe(catchError(this.handleError));
  }

  getCustomerDetail(userId: number): Observable<AdminCustomerDetailDto> {
    return this.http
      .get<AdminCustomerDetailDto>(`${this.API_BASE}/customers/${userId}`)
      .pipe(catchError(this.handleError));
  }

  getAdminAccounts(statusId?: number): Observable<AdminAccountListItemDto[]> {
    const params: Record<string, string> = {};
    if (statusId != null) params['statusId'] = statusId.toString();
    return this.http
      .get<AdminAccountListItemDto[]>(`${this.API_BASE}/accounts`, { params })
      .pipe(catchError(this.handleError));
  }

  getAdminTransactions(recentDays?: number, typeId?: number): Observable<AdminTransactionListItemDto[]> {
    const params: Record<string, string> = {};
    if (recentDays) params['recentDays'] = recentDays.toString();
    if (typeId != null) params['typeId'] = typeId.toString();
    return this.http
      .get<AdminTransactionListItemDto[]>(`${this.API_BASE}/transactions`, { params })
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Unknown error. Please try again later.';
    let body = error.error;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { /* not JSON */ }
    }
    if (body && typeof body === 'object' && (body as ErrorResponseDto).message) {
      errorMessage = (body as ErrorResponseDto).message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    return throwError(() => new Error(errorMessage));
  }
}
