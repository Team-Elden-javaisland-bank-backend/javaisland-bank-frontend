import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};

export const roleGuard = (requiredRole: string): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const user = authService.getUser();

    if (!authService.isLoggedIn()) {
      router.navigate(['/login']);
      return false;
    }

    if (user?.role !== requiredRole) {
      router.navigate(['/']);
      return false;
    }

    return true;
  };
};

export const limitsSetupGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const user = authService.getUser();

  if (!authService.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }

  if (user?.role === 'C' && user?.limitsSetupComplete === false) {
    router.navigate(['/customer/limits-setup']);
    return false;
  }

  return true;
};

export const limitsSetupPageGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const user = authService.getUser();

  if (!authService.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }

  if (user?.role !== 'C') {
    router.navigate(['/']);
    return false;
  }

  if (user?.limitsSetupComplete === true) {
    router.navigate(['/customer/dashboard']);
    return false;
  }

  return true;
};
