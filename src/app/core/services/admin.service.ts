import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { handleHttpError } from '../interceptors/error.interceptor';
import { environment } from '../../../environments/environment';
import { PageResponseDto } from '../models/common/page-response.dto';

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
  profilePictureUrl?: string;
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
  profilePictureUrl?: string;
  createdAt: string;
}

export interface AdminCustomerListItemDto {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  status: string;
  profilePictureUrl?: string;
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
  profilePictureUrl?: string;
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
  profilePictureUrl?: string;
  createdAt: string;
  closedAt: string | null;
}

export interface AdminTransactionListItemDto {
  id: number;
  amount: number;
  typeId: number;
  statusId: number;
  typeName: string;
  statusName: string;
  description: string;
  sourceAccountNumber: string;
  destinationAccountNumber: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly API_BASE = `${environment.apiUrl}/api/v1/admin`;

  constructor(private http: HttpClient) {}

  getDashboard(): Observable<AdminDashboardDto> {
    return this.http
      .get<AdminDashboardDto>(`${this.API_BASE}/dashboard`)
      .pipe(catchError(handleHttpError));
  }

  getEmployees(page?: number, size: number = 1000): Observable<PageResponseDto<EmployeeListItemDto>> {
    const params: Record<string, string> = {};
    if (page !== undefined) params['page'] = page.toString();
    if (size !== undefined) params['size'] = size.toString();
    return this.http
      .get<PageResponseDto<EmployeeListItemDto>>(`${this.API_BASE}/employees`, { params })
      .pipe(catchError(handleHttpError));
  }

  createEmployee(data: CreateEmployeeRequestDto): Observable<EmployeeListItemDto> {
    return this.http
      .post<EmployeeListItemDto>(`${this.API_BASE}/employees`, data)
      .pipe(catchError(handleHttpError));
  }

  suspendEmployee(userId: number): Observable<void> {
    return this.http
      .put<void>(`${this.API_BASE}/employees/${userId}/suspend`, null)
      .pipe(catchError(handleHttpError));
  }

  activateEmployee(userId: number): Observable<void> {
    return this.http
      .put<void>(`${this.API_BASE}/employees/${userId}/activate`, null)
      .pipe(catchError(handleHttpError));
  }

  getAuditLogs(params?: { action?: string; recentDays?: number }): Observable<PageResponseDto<AuditLogDto>> {
    const queryParams: Record<string, string> = { size: '1000' };
    if (params?.action) queryParams['action'] = params.action;
    if (params?.recentDays) queryParams['recentDays'] = params.recentDays.toString();

    return this.http
      .get<PageResponseDto<AuditLogDto>>(`${this.API_BASE}/audit-logs`, { params: queryParams })
      .pipe(catchError(handleHttpError));
  }

  getEmployeeDetail(userId: number): Observable<EmployeeDetailDto> {
    return this.http
      .get<EmployeeDetailDto>(`${this.API_BASE}/employees/${userId}`)
      .pipe(catchError(handleHttpError));
  }

  getCustomers(page?: number, size?: number): Observable<PageResponseDto<AdminCustomerListItemDto>> {
    const params: Record<string, string> = {};
    if (page !== undefined) params['page'] = page.toString();
    if (size !== undefined) params['size'] = size.toString();
    return this.http
      .get<PageResponseDto<AdminCustomerListItemDto>>(`${this.API_BASE}/customers`, { params })
      .pipe(catchError(handleHttpError));
  }

  getCustomerDetail(userId: number): Observable<AdminCustomerDetailDto> {
    return this.http
      .get<AdminCustomerDetailDto>(`${this.API_BASE}/customers/${userId}`)
      .pipe(catchError(handleHttpError));
  }

  getAdminAccounts(statusId?: number): Observable<PageResponseDto<AdminAccountListItemDto>> {
    const params: Record<string, string> = { size: '1000' };
    if (statusId != null) params['statusId'] = statusId.toString();
    return this.http
      .get<PageResponseDto<AdminAccountListItemDto>>(`${this.API_BASE}/accounts`, { params })
      .pipe(catchError(handleHttpError));
  }

  getAdminTransactions(recentDays?: number, typeId?: number): Observable<AdminTransactionListItemDto[]> {
    const params: Record<string, string> = {};
    if (recentDays) params['recentDays'] = recentDays.toString();
    if (typeId != null) params['typeId'] = typeId.toString();
    return this.http
      .get<AdminTransactionListItemDto[]>(`${this.API_BASE}/transactions`, { params })
      .pipe(catchError(handleHttpError));
  }
}
