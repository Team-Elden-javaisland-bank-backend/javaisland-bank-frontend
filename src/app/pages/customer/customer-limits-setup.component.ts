import { Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgClass } from '@angular/common';
import { TranslatePipe, TranslateDirective, TranslateService } from '@ngx-translate/core';
import { CustomerService } from '../../core/services/customer.service';
import { AuthService } from '../../core/services/auth.service';
import { AccountResponseDto } from '../../core/models/account/account-response.dto';
import { AccountLimitResponseDto } from '../../core/models/account/account-limit-response.dto';
import { ToastService } from '../../core/services/toast.service';

interface LimitMeta {
  type: string;
  labelKey: string;
  descriptionKey: string;
  policy: 'USER_FULL' | 'USER_LOWER_ONLY' | 'BANK_ONLY';
  policyLabelKey: string;
  policyColor: string;
  defaultValue: number;
  minValue: number;
  maxValue: number;
}

@Component({
  selector: 'app-customer-limits-setup',
  imports: [NgClass, CurrencyPipe, FormsModule, TranslatePipe, TranslateDirective],
  templateUrl: './customer-limits-setup.html',
  styleUrl: './customer-limits-setup.css',
})
export class CustomerLimitsSetupComponent {
  private translate = inject(TranslateService);
  currentLang = localStorage.getItem('lang') || 'it';

  accounts = signal<AccountResponseDto[]>([]);
  selectedAccount = signal('');
  limits = signal<AccountLimitResponseDto[]>([]);
  loading = signal(true);
  limitsLoading = signal(false);

  editingType = signal('');
  editingError = signal('');
  editAmount = 0;

  allLimitsSet = computed(() => {
    return this.allLimitTypes.every(meta => this.limits().some(l => l.limitType === meta.type));
  });

  missingLimitsCount = computed(() => {
    return this.allLimitTypes.filter(meta => !this.limits().some(l => l.limitType === meta.type)).length;
  });

  allLimitTypes: LimitMeta[] = [
    { type: 'ATM_WITHDRAWAL', labelKey: 'LIMIT_TYPE.ATM_WITHDRAWAL.label', descriptionKey: 'LIMIT_TYPE.ATM_WITHDRAWAL.description', policy: 'USER_FULL', policyLabelKey: 'LIMITS_SETUP.editable', policyColor: '#065f46', defaultValue: 300, minValue: 10, maxValue: 300 },
    { type: 'POS_SPENDING', labelKey: 'LIMIT_TYPE.POS_SPENDING.label', descriptionKey: 'LIMIT_TYPE.POS_SPENDING.description', policy: 'USER_FULL', policyLabelKey: 'LIMITS_SETUP.editable', policyColor: '#065f46', defaultValue: 2500, minValue: 0.10, maxValue: 2500 },
    { type: 'DAILY_TRANSFER', labelKey: 'LIMIT_TYPE.DAILY_TRANSFER.label', descriptionKey: 'LIMIT_TYPE.DAILY_TRANSFER.description', policy: 'USER_LOWER_ONLY', policyLabelKey: 'LIMITS_SETUP.lower_only', policyColor: '#92400e', defaultValue: 15000, minValue: 1, maxValue: 15000 },
    { type: 'SINGLE_TRANSFER', labelKey: 'LIMIT_TYPE.SINGLE_TRANSFER.label', descriptionKey: 'LIMIT_TYPE.SINGLE_TRANSFER.description', policy: 'USER_LOWER_ONLY', policyLabelKey: 'LIMITS_SETUP.lower_only', policyColor: '#92400e', defaultValue: 10000, minValue: 1, maxValue: 10000 },
    { type: 'INSTANT_TRANSFER_SINGLE', labelKey: 'LIMIT_TYPE.INSTANT_TRANSFER_SINGLE.label', descriptionKey: 'LIMIT_TYPE.INSTANT_TRANSFER_SINGLE.description', policy: 'BANK_ONLY', policyLabelKey: 'LIMITS_SETUP.bank_only', policyColor: '#991b1b', defaultValue: 5000, minValue: 1, maxValue: 5000 },
    { type: 'MONTHLY_TRANSFER', labelKey: 'LIMIT_TYPE.MONTHLY_TRANSFER.label', descriptionKey: 'LIMIT_TYPE.MONTHLY_TRANSFER.description', policy: 'BANK_ONLY', policyLabelKey: 'LIMITS_SETUP.bank_only', policyColor: '#991b1b', defaultValue: 50000, minValue: 1, maxValue: 50000 },
  ];

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
        if (this.accounts().length > 0) {
          this.onAccountChange(this.accounts()[0].accountNumber);
        }
      },
      error: () => this.loading.set(false),
    });
  }

  switchLang(lang: string): void {
    localStorage.setItem('lang', lang);
    this.currentLang = lang;
    this.translate.use(lang);
  }

  onAccountChange(accountNumber: string): void {
    this.selectedAccount.set(accountNumber);
    this.editingType.set('');
    if (!accountNumber) { this.limits.set([]); return; }
    this.limitsLoading.set(true);
    this.customerService.getAccountLimits(accountNumber).subscribe({
      next: (data) => { this.limits.set(data); this.limitsLoading.set(false); },
      error: () => this.limitsLoading.set(false),
    });
  }

  getLimitForType(type: string): AccountLimitResponseDto | undefined {
    return this.limits().find(l => l.limitType === type);
  }

  canEdit(type: string): boolean {
    return true;
  }

  canIncrease(type: string): boolean {
    const meta = this.allLimitTypes.find(m => m.type === type);
    return meta?.policy === 'USER_FULL';
  }

  startEdit(type: string, currentAmount: number): void {
    const meta = this.allLimitTypes.find(m => m.type === type);
    this.editingType.set(type);
    this.editingError.set('');
    this.editAmount = currentAmount || meta?.defaultValue || 0;
  }

  cancelEdit(): void { this.editingType.set(''); this.editingError.set(''); }

  saveLimit(type: string): void {
    const meta = this.allLimitTypes.find(m => m.type === type);
    if (this.editAmount < (meta?.minValue ?? 0)) {
      this.editingError.set(`Minimo €${meta?.minValue ?? 0}`);
      return;
    }

    if (meta && this.editAmount > meta.maxValue) {
      this.editingError.set(`Massimo €${meta.maxValue.toLocaleString('it-IT')}`);
      return;
    }

    this.editingError.set('');
    this.customerService.setAccountLimit(this.selectedAccount(), type, {
      maxAmount: this.editAmount,
    }).subscribe({
      next: (saved) => {
        this.toastService.success(this.translate.instant('LIMITS_SETUP.toast.saved'));
        this.editingType.set('');
        this.limits.update(list => {
          const idx = list.findIndex(l => l.limitType === type);
          if (idx >= 0) {
            return list.map(l => l.limitType === type ? { ...l, maxAmount: this.editAmount } : l);
          } else {
            return [...list, { limitType: type, maxAmount: this.editAmount } as AccountLimitResponseDto];
          }
        });
      },
      error: (err) => this.toastService.error(err?.error?.message || err?.message),
    });
  }

  completeSetup(): void {
    this.customerService.completeLimitsSetup().subscribe({
      next: () => {
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
