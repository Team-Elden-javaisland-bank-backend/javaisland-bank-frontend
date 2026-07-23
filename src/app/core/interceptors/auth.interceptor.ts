import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.includes('/assets/i18n/')) {
    return next(req);
  }

  const authService = inject(AuthService);
  const router = inject(Router);
  const toastService = inject(ToastService);
  const token = authService.getToken();
  const lang = localStorage.getItem('lang') || 'it';
  const acceptLanguage = lang === 'en' ? 'en' : 'it';

  const headers: Record<string, string> = {
    'Accept-Language': acceptLanguage,
  };

  if (token) {
    if (authService.isTokenExpired(token)) {
      authService.logout();
      router.navigate(['/login']);
      return throwError(() => new Error('Token expired'));
    }

    headers['Authorization'] = `Bearer ${token}`;
  }

  const cloned = req.clone({ setHeaders: headers });
  return next(cloned).pipe(
    catchError((error) => {
      if (error.status === 401) {
        let message = lang === 'it' ? 'Sessione scaduta. Effettua nuovamente il login.' : 'Session expired. Please log in again.';
        try {
          const body = typeof error.error === 'string' ? JSON.parse(error.error) : error.error;
          if (body?.message) message = body.message;
        } catch {}
        toastService.error(message);
        authService.logout();
        router.navigate(['/login']);
      }
      return throwError(() => error);
    }),
  );
};
