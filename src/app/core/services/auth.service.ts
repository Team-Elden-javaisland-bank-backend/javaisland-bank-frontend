import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

import { RegisterRequestDto } from '../models/auth/register-request.dto';
import { LoginRequestDto } from '../models/auth/login-request.dto';
import { LoginResponseDto } from '../models/auth/login-response.dto';
import { ErrorResponseDto } from '../models/common/error-response.dto';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API_BASE = 'http://localhost:8081/api/v1/auth';
  private readonly PROFILE_PICTURE_API = 'http://localhost:8081/api/v1/profile-picture';

  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'auth_user';

  constructor(private http: HttpClient) {}

  register(data: RegisterRequestDto): Observable<unknown> {
    return this.http
      .post(`${this.API_BASE}/register`, data)
      .pipe(catchError(this.handleError));
  }

  login(data: LoginRequestDto): Observable<LoginResponseDto> {
    return this.http
      .post<LoginResponseDto>(`${this.API_BASE}/keycloak-login`, data)
      .pipe(
        catchError(this.handleError),
      );
  }

  uploadProfilePicture(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http
      .post(this.PROFILE_PICTURE_API, formData, { responseType: 'text' })
      .pipe(
        tap((url) => {
          const user = this.getUser();
          if (user) {
            user.profilePictureUrl = url;
            localStorage.setItem(this.USER_KEY, JSON.stringify(user));
          }
        }),
        catchError(this.handleError),
      );
  }

  deleteProfilePicture(): Observable<void> {
    return this.http
      .delete<void>(this.PROFILE_PICTURE_API)
      .pipe(
        tap(() => {
          const user = this.getUser();
          if (user) {
            user.profilePictureUrl = undefined;
            localStorage.setItem(this.USER_KEY, JSON.stringify(user));
          }
        }),
        catchError(this.handleError),
      );
  }

  saveSession(response: LoginResponseDto): void {
    localStorage.setItem(this.TOKEN_KEY, response.token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(response));
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getUser(): LoginResponseDto | null {
    const raw = localStorage.getItem(this.USER_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  getProfilePictureUrl(): string | null {
    const user = this.getUser();
    return user?.profilePictureUrl ?? null;
  }

  getInitials(): string {
    const user = this.getUser();
    if (!user) return '?';
    return (user.firstName?.[0] ?? '') + (user.lastName?.[0] ?? '');
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    return !!token && !this.isTokenExpired(token);
  }

  isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
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
