import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { CustomerService } from '../../core/services/customer.service';
import { AuthService } from '../../core/services/auth.service';
import { AccountResponseDto } from '../../core/models/account/account-response.dto';
import { ToastService } from '../../core/services/toast.service';
import { ToastComponent } from '../../core/components/toast/toast.component';
import { AccountLimitsFormComponent } from '../../shared/account-limits-form/account-limits-form.component';

@Component({
  selector: 'app-customer-limits-setup',
  imports: [TranslatePipe, ToastComponent, AccountLimitsFormComponent],
  templateUrl: './customer-limits-setup.html',
  styleUrl: './customer-limits-setup.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerLimitsSetupComponent {
  private translate = inject(TranslateService);
  currentLang = localStorage.getItem('lang') || 'it';

  accounts = signal<AccountResponseDto[]>([]);
  loading = signal(true);

  constructor(
    private customerService: CustomerService,
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService,
  ) {
    this.customerService.getAccounts().subscribe({
      next: (data) => {
        this.accounts.set(data.filter(a => a.statusId === 2));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  switchLang(lang: string): void {
    localStorage.setItem('lang', lang);
    this.currentLang = lang;
    this.translate.use(lang);
  }

  completeSetup(): void {
    this.customerService.completeLimitsSetup().subscribe({
      next: () => {
        this.toastService.clearAll();
        const user = this.authService.getUser();
        if (user) {
          user.limitsSetupComplete = true;
          localStorage.setItem('auth_user', JSON.stringify(user));
        }
        this.router.navigate(['/customer/dashboard']);
      },
      error: (err) => this.toastService.error(err?.error?.message || err?.message),
    });
  }
}
