import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { RegisterRequestDto } from '../models/auth/register-request.dto';
import { LoginRequestDto } from '../models/auth/login-request.dto';
import { LoginResponseDto } from '../models/auth/login-response.dto';
import { ErrorResponseDto } from '../models/common/error-response.dto';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API_BASE = 'http://localhost:8081/api/v1/auth';

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

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

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
