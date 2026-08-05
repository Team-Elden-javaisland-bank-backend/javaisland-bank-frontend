import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { LoginResponseDto } from '../models/auth/login-response.dto';
import { AuthService } from '../services/auth.service';

type CustomerSetupState = 'limits-setup' | 'pin-setup' | 'pin-verify' | 'dashboard';

function resolveCustomerState(user: LoginResponseDto | null, pinVerified: boolean): CustomerSetupState {
  if (user?.limitsSetupComplete === false) return 'limits-setup';
  if (user?.pinSetupComplete === false) return 'pin-setup';
  if (!pinVerified) return 'pin-verify';
  return 'dashboard';
}

function redirectTo(target: string | null, router: Router): boolean {
  router.navigate([target ?? '/login']);
  return false;
}

export const roleGuard = (requiredRole: string): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isLoggedIn()) {
      return redirectTo('/login', router);
    }

    if (authService.getUser()?.role !== requiredRole) {
      return redirectTo('/', router);
    }

    return true;
  };
};

export const customerSetupGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    return redirectTo('/login', router);
  }

  const user = authService.getUser();
  if (user?.role !== 'C') {
    return redirectTo('/', router);
  }

  const state = resolveCustomerState(user, authService.isPinVerified());
  if (state !== 'dashboard') {
    return redirectTo(`/customer/${state}`, router);
  }

  return true;
};

export const setupPageGuard = (page: Exclude<CustomerSetupState, 'dashboard'>): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isLoggedIn()) {
      return redirectTo('/login', router);
    }

    const user = authService.getUser();
    if (user?.role !== 'C') {
      return redirectTo('/', router);
    }

    const state = resolveCustomerState(user, authService.isPinVerified());
    if (state !== page) {
      return redirectTo(`/customer/${state}`, router);
    }

    return true;
  };
};

export const loginRedirectGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    return true;
  }

  const user = authService.getUser();
  if (user?.role === 'C') {
    const state = resolveCustomerState(user, authService.isPinVerified());
    redirectTo(`/customer/${state}`, router);
  } else if (user?.role === 'D') {
    redirectTo('/employee/dashboard', router);
  } else if (user?.role === 'A') {
    redirectTo('/admin/dashboard', router);
  } else {
    redirectTo('/login', router);
  }

  return false;
};
