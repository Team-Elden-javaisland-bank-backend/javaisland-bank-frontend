import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { ErrorResponseDto } from '../models/common/error-response.dto';

export interface NotificationDto {
  id: number;
  userId: number;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly API_BASE = 'http://localhost:8081/api/v1/customer/notifications';

  constructor(private http: HttpClient) {}

  getNotifications(): Observable<NotificationDto[]> {
    return this.http
      .get<NotificationDto[]>(this.API_BASE)
      .pipe(catchError(this.handleError));
  }

  getUnreadCount(): Observable<{ count: number }> {
    return this.http
      .get<{ count: number }>(`${this.API_BASE}/unread-count`)
      .pipe(catchError(this.handleError));
  }

  markAsRead(id: number): Observable<void> {
    return this.http
      .put<void>(`${this.API_BASE}/${id}/read`, null)
      .pipe(catchError(this.handleError));
  }

  markAllAsRead(): Observable<void> {
    return this.http
      .put<void>(`${this.API_BASE}/read-all`, null)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Errore sconosciuto.';
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
