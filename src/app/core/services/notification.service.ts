import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import { handleHttpError } from '../interceptors/error.interceptor';
import { environment } from '../../../environments/environment';

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
  private readonly API_BASE = `${environment.apiUrl}/api/v1/customer/notifications`;

  constructor(private http: HttpClient) {}

  getNotifications(): Observable<NotificationDto[]> {
    return this.http
      .get<NotificationDto[]>(this.API_BASE)
      .pipe(catchError(handleHttpError));
  }

  getUnreadCount(): Observable<{ count: number }> {
    return this.http
      .get<{ count: number }>(`${this.API_BASE}/unread-count`)
      .pipe(catchError(handleHttpError));
  }

  markAsRead(id: number): Observable<void> {
    return this.http
      .put<void>(`${this.API_BASE}/${id}/read`, null)
      .pipe(catchError(handleHttpError));
  }

  markAllAsRead(): Observable<void> {
    return this.http
      .put<void>(`${this.API_BASE}/read-all`, null)
      .pipe(catchError(handleHttpError));
  }
}
