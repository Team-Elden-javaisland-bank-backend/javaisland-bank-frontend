import { Component, signal, computed } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateDirective, TranslateService } from '@ngx-translate/core';
import { EmployeeService } from '../../core/services/employee.service';
import { AccountResponseDto } from '../../core/models/account/account-response.dto';
import { AccountLimitResponseDto } from '../../core/models/account/account-limit-response.dto';

interface LimitMeta {
  type: string;
  labelKey: string;
  descriptionKey: string;
  defaultValue: number;
  minValue: number;
  maxValue: number;
}

@Component({
  selector: 'app-employee-limits',
  imports: [CurrencyPipe, DatePipe, FormsModule, TranslatePipe, TranslateDirective],
  templateUrl: './employee-limits.html',
  styleUrl: './employee-limits.css',
})
export class EmployeeLimitsComponent {
  accounts = signal<AccountResponseDto[]>([]);
  selectedAccount = signal('');
  searchQuery = signal('');
  limits = signal<AccountLimitResponseDto[]>([]);
  loading = signal(true);
  limitsLoading = signal(false);
  message = signal('');
  messageType = signal<'success' | 'error'>('success');

  filteredAccounts = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const list = this.accounts();
    if (!q) return list;
    return list.filter(a =>
      a.accountNumber.toLowerCase().includes(q) ||
      a.profileFirstName.toLowerCase().includes(q) ||
      a.profileLastName.toLowerCase().includes(q)
    );
  });

  getFullName(a: AccountResponseDto): string {
    return `${a.profileFirstName} ${a.profileLastName}`;
  }

  getInitials(a: AccountResponseDto): string {
    return (a.profileFirstName?.charAt(0) ?? '') + (a.profileLastName?.charAt(0) ?? '');
  }

  getSelectedAccountData(): AccountResponseDto | undefined {
    return this.accounts().find(a => a.accountNumber === this.selectedAccount());
  }

  editingType = signal('');
  editingError = signal('');
  editAmount = 0;

  allLimitTypes: LimitMeta[] = [
    { type: 'DAILY_TRANSFER', labelKey: 'LIMIT_TYPE.DAILY_TRANSFER.label', descriptionKey: 'LIMIT_TYPE.DAILY_TRANSFER.description', defaultValue: 15000, minValue: 1, maxValue: 15000 },
    { type: 'SINGLE_TRANSFER', labelKey: 'LIMIT_TYPE.SINGLE_TRANSFER.label', descriptionKey: 'LIMIT_TYPE.SINGLE_TRANSFER.description', defaultValue: 10000, minValue: 1, maxValue: 10000 },
    { type: 'INSTANT_TRANSFER_SINGLE', labelKey: 'LIMIT_TYPE.INSTANT_TRANSFER_SINGLE.label', descriptionKey: 'LIMIT_TYPE.INSTANT_TRANSFER_SINGLE.description', defaultValue: 5000, minValue: 1, maxValue: 5000 },
    { type: 'MONTHLY_TRANSFER', labelKey: 'LIMIT_TYPE.MONTHLY_TRANSFER.label', descriptionKey: 'LIMIT_TYPE.MONTHLY_TRANSFER.description', defaultValue: 50000, minValue: 1, maxValue: 50000 },
    { type: 'ATM_WITHDRAWAL', labelKey: 'LIMIT_TYPE.ATM_WITHDRAWAL.label', descriptionKey: 'LIMIT_TYPE.ATM_WITHDRAWAL.description', defaultValue: 300, minValue: 10, maxValue: 300 },
    { type: 'POS_SPENDING', labelKey: 'LIMIT_TYPE.POS_SPENDING.label', descriptionKey: 'LIMIT_TYPE.POS_SPENDING.description', defaultValue: 2500, minValue: 0.10, maxValue: 2500 },
  ];

  constructor(private employeeService: EmployeeService, private translate: TranslateService) {
    this.employeeService.getAccounts().subscribe({
      next: (data) => {
        this.accounts.set(data.filter(a => a.statusId === 2));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onAccountChange(accountNumber: string): void {
    this.selectedAccount.set(accountNumber);
    this.message.set('');
    this.editingType.set('');
    if (!accountNumber) {
      this.limits.set([]);
      return;
    }
    this.limitsLoading.set(true);
    this.employeeService.getAccountLimits(accountNumber).subscribe({
      next: (data) => { this.limits.set(data); this.limitsLoading.set(false); },
      error: () => this.limitsLoading.set(false),
    });
  }

  getLimitForType(type: string): AccountLimitResponseDto | undefined {
    return this.limits().find(l => l.limitType === type);
  }

  startEdit(type: string, currentAmount: number): void {
    const meta = this.allLimitTypes.find(m => m.type === type);
    this.editingType.set(type);
    this.editingError.set('');
    this.editAmount = currentAmount || meta?.defaultValue || 0;
  }

  cancelEdit(): void {
    this.editingType.set('');
    this.editingError.set('');
  }

  getLimitIcon(type: string): string {
    const icons: Record<string, string> = {
      'ATM_WITHDRAWAL': 'bi bi-cash-stack',
      'POS_SPENDING': 'bi bi-credit-card-2-front',
      'DAILY_TRANSFER': 'bi bi-arrow-left-right',
      'SINGLE_TRANSFER': 'bi bi-send',
      'INSTANT_TRANSFER_SINGLE': 'bi bi-lightning',
      'MONTHLY_TRANSFER': 'bi bi-calendar-month',
    };
    return icons[type] || 'bi bi-speedometer';
  }

  saveLimit(type: string): void {
    const meta = this.allLimitTypes.find(m => m.type === type);
    if (this.editAmount < (meta?.minValue ?? 0)) {
      this.editingError.set(this.translate.instant('EMPLOYEE.limits.error_min', { min: meta?.minValue ?? 0 }));
      return;
    }

    if (meta && this.editAmount > meta.maxValue) {
      this.editingError.set(this.translate.instant('EMPLOYEE.limits.error_max', { max: meta.maxValue.toLocaleString('it-IT') }));
      return;
    }

    this.editingError.set('');
    this.employeeService.setAccountLimit(this.selectedAccount(), type, {
      maxAmount: this.editAmount,
    }).subscribe({
      next: () => {
        this.message.set(this.translate.instant('EMPLOYEE.limits.success_updated'));
        this.messageType.set('success');
        this.editingType.set('');
        this.onAccountChange(this.selectedAccount());
      },
      error: (err) => {
        this.message.set(err.message);
        this.messageType.set('error');
      },
    });
  }
}
