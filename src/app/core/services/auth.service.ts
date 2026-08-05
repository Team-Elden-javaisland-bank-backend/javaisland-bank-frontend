import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, firstValueFrom, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

import { RegisterRequestDto } from '../models/auth/register-request.dto';
import { LoginRequestDto } from '../models/auth/login-request.dto';
import { LoginResponseDto } from '../models/auth/login-response.dto';
import { handleHttpError } from '../interceptors/error.interceptor';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API_BASE = `${environment.apiUrl}/api/v1/auth`;
  private readonly PROFILE_PICTURE_API = `${environment.apiUrl}/api/v1/profile-picture`;

  private readonly USER_KEY = 'auth_user';
  private static readonly PIN_VERIFY_TTL_MS = 10 * 60 * 1000;

  constructor(private http: HttpClient) {}

  register(data: RegisterRequestDto): Observable<unknown> {
    return this.http
      .post(`${this.API_BASE}/register`, data)
      .pipe(catchError(handleHttpError));
  }

  login(data: LoginRequestDto): Observable<LoginResponseDto> {
    return this.http
      .post<LoginResponseDto>(`${this.API_BASE}/keycloak-login`, data)
      .pipe(
        catchError(handleHttpError),
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
        catchError(handleHttpError),
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
        catchError(handleHttpError),
      );
  }

  saveSession(response: LoginResponseDto): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify({ ...response, token: '' }));
  }

  restoreSession(): Promise<void> {
    return firstValueFrom(
      this.http.get<LoginResponseDto>(`${this.API_BASE}/me`).pipe(
        tap((user) => localStorage.setItem(this.USER_KEY, JSON.stringify({ ...user, token: '' }))),
        catchError(() => {
          localStorage.removeItem(this.USER_KEY);
          return of(undefined);
        }),
      ),
    ).then(() => undefined);
  }

  getToken(): string | null {
    return null;
  }

  getUser(): LoginResponseDto | null {
    const raw = localStorage.getItem(this.USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as LoginResponseDto;
    } catch {
      return null;
    }
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

  private readonly PIN_API = `${environment.apiUrl}/api/v1/user/pin`;

  setupPin(pin: string): Observable<{ pinSetupComplete: boolean }> {
    return this.http.post<{ pinSetupComplete: boolean }>(
      `${this.PIN_API}/setup`,
      { pin }
    ).pipe(catchError(handleHttpError));
  }

  verifyPin(pin: string): Observable<{ pinSetupComplete: boolean }> {
    return this.http.post<{ pinSetupComplete: boolean }>(
      `${this.PIN_API}/verify`,
      { pin }
    ).pipe(catchError(handleHttpError));
  }

  getPinStatus(): Observable<{ pinSetupComplete: boolean }> {
    return this.http.get<{ pinSetupComplete: boolean }>(
      `${this.PIN_API}/status`
    ).pipe(catchError(handleHttpError));
  }

  isPinVerified(): boolean {
    const raw = localStorage.getItem('pin_verified_at');
    if (!raw) return false;
    const at = Number(raw);
    if (Number.isNaN(at)) return false;
    return Date.now() - at < AuthService.PIN_VERIFY_TTL_MS;
  }

  setPinVerified(verified: boolean): void {
    if (verified) {
      localStorage.setItem('pin_verified_at', String(Date.now()));
    } else {
      localStorage.removeItem('pin_verified_at');
    }
  }

  clearPinVerified(): void {
    localStorage.removeItem('pin_verified_at');
  }

  logout(): void {
    this.http.post<void>(`${this.API_BASE}/logout`, null).pipe(catchError(handleHttpError)).subscribe({
      complete: () => localStorage.removeItem(this.USER_KEY),
    });
    localStorage.removeItem(this.USER_KEY);
    this.clearPinVerified();
    this.clearSessionData();
  }

  private clearSessionData(): void {
    sessionStorage.clear();
    document.cookie.split(';').forEach((cookie) => {
      const name = cookie.split('=')[0].trim();
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    });
  }

  isLoggedIn(): boolean {
    return !!this.getUser();
  }
}
