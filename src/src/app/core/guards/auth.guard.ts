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

  if (user?.role === 'C' && user?.limitsSetupComplete === true && user?.pinSetupComplete === false) {
    router.navigate(['/customer/pin-setup']);
    return false;
  }

  if (user?.role === 'C' && user?.limitsSetupComplete === true && user?.pinSetupComplete === true && !authService.isPinVerified()) {
    router.navigate(['/customer/pin-verify']);
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

export const pinSetupPageGuard: CanActivateFn = () => {
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

  if (user?.limitsSetupComplete === false) {
    router.navigate(['/customer/limits-setup']);
    return false;
  }

  if (user?.pinSetupComplete === true) {
    router.navigate(['/customer/pin-verify']);
    return false;
  }

  return true;
};

export const pinVerifyPageGuard: CanActivateFn = () => {
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

  if (user?.limitsSetupComplete === false) {
    router.navigate(['/customer/limits-setup']);
    return false;
  }

  if (user?.pinSetupComplete === false) {
    router.navigate(['/customer/pin-setup']);
    return false;
  }

  if (authService.isPinVerified()) {
    router.navigate(['/customer/dashboard']);
    return false;
  }

  return true;
};

export const loginRedirectGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    return true;
  }

  const user = authService.getUser();
  if (user?.role === 'C') {
    if (user?.limitsSetupComplete === false) {
      router.navigate(['/customer/limits-setup']);
    } else if (user?.pinSetupComplete === false) {
      router.navigate(['/customer/pin-setup']);
    } else if (!authService.isPinVerified()) {
      router.navigate(['/customer/pin-verify']);
    } else {
      router.navigate(['/customer/dashboard']);
    }
  } else if (user?.role === 'D') {
    router.navigate(['/employee/dashboard']);
  } else if (user?.role === 'A') {
    router.navigate(['/admin/dashboard']);
  } else {
    router.navigate(['/login']);
  }

  return false;
};
