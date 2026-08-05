import { Component, ChangeDetectionStrategy, signal, computed, OnInit } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateDirective, TranslateService } from '@ngx-translate/core';
import { ApiUrlPipe } from '../../shared/pipes/api-url.pipe';
import { EmployeeService } from '../../core/services/employee.service';
import { AccountResponseDto } from '../../core/models/account/account-response.dto';
import { AccountLimitResponseDto } from '../../core/models/account/account-limit-response.dto';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-employee-accounts',
  imports: [CurrencyPipe, DatePipe, FormsModule, TranslatePipe, TranslateDirective, ApiUrlPipe],
  templateUrl: './employee-accounts.html',
  styleUrl: './employee-accounts.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeAccountsComponent implements OnInit {
  accounts = signal<AccountResponseDto[]>([]);
  loading = signal(true);
  statusFilter = signal<number | null>(null);
  searchQuery = signal('');
  selectedAccount = signal<string>('');
  limits = signal<AccountLimitResponseDto[]>([]);
  limitsLoading = signal(false);
  showLimits = signal(false);

  filteredAccounts = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    let list = this.accounts();
    if (q) {
      list = list.filter(a =>
        a.accountNumber?.toLowerCase().includes(q) ||
        a.profileFirstName?.toLowerCase().includes(q) ||
        a.profileLastName?.toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => {
      const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return db - da;
    });
  });

  limitType = '';
  limitAmount = 0;

  private readonly LIMITS: Record<string, { min: number; max: number }> = {
    ATM_WITHDRAWAL: { min: 10, max: 300 },
    POS_SPENDING: { min: 0.10, max: 2500 },
    SINGLE_TRANSFER: { min: 1, max: 10000 },
    INSTANT_TRANSFER_SINGLE: { min: 1, max: 5000 },
    DAILY_TRANSFER: { min: 1, max: 15000 },
    MONTHLY_TRANSFER: { min: 1, max: 50000 },
  };

  constructor(private employeeService: EmployeeService, private translate: TranslateService, private toastService: ToastService) {}

  ngOnInit(): void {
    this.loadAccounts();
  }

  loadAccounts(): void {
    this.loading.set(true);
    this.employeeService.getAccounts(this.statusFilter() ?? undefined).subscribe({
      next: (data) => {
        this.accounts.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  filterByStatus(status: number | null): void {
    this.statusFilter.set(status);
    this.loadAccounts();
  }

  activate(accountNumber: string): void {
    this.employeeService.activateAccount(accountNumber).subscribe({
      next: () => { this.toastService.i18nSuccess('EMPLOYEE.accounts.toast.activated'); this.loadAccounts(); },
      error: (err) => this.toastService.error(err?.error?.message || err?.message),
    });
  }

  reject(accountNumber: string): void {
    if (!confirm('Rifiutare questo conto?')) return;
    this.employeeService.rejectAccount(accountNumber).subscribe({
      next: () => { this.toastService.i18nSuccess('EMPLOYEE.accounts.toast.rejected'); this.loadAccounts(); },
      error: (err) => this.toastService.error(err?.error?.message || err?.message),
    });
  }

  freeze(accountNumber: string): void {
    this.employeeService.freezeAccount(accountNumber).subscribe({
      next: () => { this.toastService.i18nSuccess('EMPLOYEE.accounts.toast.frozen'); this.loadAccounts(); },
      error: (err) => this.toastService.error(err?.error?.message || err?.message),
    });
  }

  unfreeze(accountNumber: string): void {
    this.employeeService.unfreezeAccount(accountNumber).subscribe({
      next: () => { this.toastService.i18nSuccess('EMPLOYEE.accounts.toast.unfrozen'); this.loadAccounts(); },
      error: (err) => this.toastService.error(err?.error?.message || err?.message),
    });
  }

  validateClosure(accountNumber: string): void {
    this.employeeService.validateClosure(accountNumber).subscribe({
      next: () => { this.toastService.i18nSuccess('EMPLOYEE.accounts.toast.closure_validated'); this.loadAccounts(); },
      error: (err) => this.toastService.error(err?.error?.message || err?.message),
    });
  }

  rejectClosure(accountNumber: string): void {
    this.employeeService.rejectClosure(accountNumber).subscribe({
      next: () => { this.toastService.i18nSuccess('EMPLOYEE.accounts.toast.closure_rejected'); this.loadAccounts(); },
      error: (err) => this.toastService.error(err?.error?.message || err?.message),
    });
  }

  viewLimits(accountNumber: string): void {
    this.selectedAccount.set(accountNumber);
    this.limitsLoading.set(true);
    this.showLimits.set(true);
    this.employeeService.getAccountLimits(accountNumber).subscribe({
      next: (data) => { this.limits.set(data); this.limitsLoading.set(false); },
      error: () => this.limitsLoading.set(false),
    });
  }

  setLimit(): void {
    if (!this.limitType || this.limitAmount < 0.01) {
      this.toastService.i18nError('EMPLOYEE.accounts.toast.fill_fields');
      return;
    }

    const limits = this.LIMITS[this.limitType];
    if (limits) {
      if (this.limitAmount < limits.min) {
        this.toastService.i18nError('EMPLOYEE.accounts.toast.min_amount', { min: limits.min });
        return;
      }
      if (this.limitAmount > limits.max) {
        this.toastService.i18nError('EMPLOYEE.accounts.toast.max_amount', { max: limits.max });
        return;
      }
    }

    this.employeeService.setAccountLimit(this.selectedAccount(), this.limitType, {
      maxAmount: this.limitAmount,
    }).subscribe({
      next: () => {
        this.toastService.i18nSuccess('EMPLOYEE.accounts.toast.limit_updated');
        this.limitAmount = 0;
        this.viewLimits(this.selectedAccount());
      },
      error: (err) => this.toastService.error(err?.error?.message || err?.message),
    });
  }

  getStatusName(statusId: number): string {
    const keys: Record<number, string> = { 1: 'STATUS.INACTIVE', 2: 'STATUS.ACTIVE', 3: 'STATUS.FROZEN', 4: 'STATUS.CLOSED' };
    return this.translate.instant(keys[statusId] || 'STATUS.UNKNOWN');
  }

  getActiveCount(): number {
    return this.accounts().filter(a => a.statusId === 2).length;
  }

  getPendingCount(): number {
    return this.accounts().filter(a => a.statusId === 1).length;
  }

  onSearchInput(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }
}
