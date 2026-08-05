import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

const BACKEND_ERROR_KEY_PREFIX = 'API_ERROR.';

const PUBLIC_AUTH_ROUTES = ['/api/v1/auth/'];

let sessionEpoch = 0;
let handledEpoch = -1;

export function resetSessionExpiredHandled(): void {
  sessionEpoch++;
  handledEpoch = -1;
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.includes('/assets/i18n/')) {
    return next(req);
  }

  const authService = inject(AuthService);
  const router = inject(Router);
  const toastService = inject(ToastService);
  const lang = localStorage.getItem('lang') || 'it';
  const acceptLanguage = lang === 'en' ? 'en' : 'it';

  const epochAtSend = sessionEpoch;

  const cloned = req.clone({
    setHeaders: { 'Accept-Language': acceptLanguage },
    withCredentials: true,
  });

  return next(cloned).pipe(
    catchError((error) => {
      const isPublicAuthRoute = PUBLIC_AUTH_ROUTES.some((route) => req.url.includes(route));
      if (error.status === 401 && !isPublicAuthRoute && !req.url.includes('/keycloak-login')) {
        if (epochAtSend === sessionEpoch && handledEpoch !== sessionEpoch) {
          handledEpoch = sessionEpoch;
          toastService.i18nError('AUTH.session_expired');
          authService.logout();
          router.navigate(['/login']);
        }
      }
      return throwError(() => error);
    }),
  );
};
