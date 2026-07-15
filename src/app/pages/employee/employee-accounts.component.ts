import { Component, signal, OnInit } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmployeeService } from '../../core/services/employee.service';
import { AccountResponseDto } from '../../core/models/account/account-response.dto';
import { AccountLimitResponseDto } from '../../core/models/account/account-limit-response.dto';

@Component({
  selector: 'app-employee-accounts',
  imports: [CurrencyPipe, DatePipe, FormsModule],
  templateUrl: './employee-accounts.html',
  styleUrl: './employee-accounts.css',
})
export class EmployeeAccountsComponent implements OnInit {
  accounts = signal<AccountResponseDto[]>([]);
  loading = signal(true);
  message = signal('');
  messageType = signal<'success' | 'error'>('success');
  statusFilter = signal<number | null>(null);
  selectedAccount = signal<string>('');
  limits = signal<AccountLimitResponseDto[]>([]);
  limitsLoading = signal(false);
  showLimits = signal(false);

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

  constructor(private employeeService: EmployeeService) {}

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
      next: (res) => { this.message.set(res); this.messageType.set('success'); this.loadAccounts(); },
      error: (err) => { this.message.set(err.message); this.messageType.set('error'); },
    });
  }

  reject(accountNumber: string): void {
    if (!confirm('Rifiutare questo conto?')) return;
    this.employeeService.rejectAccount(accountNumber).subscribe({
      next: (res) => { this.message.set(res); this.messageType.set('success'); this.loadAccounts(); },
      error: (err) => { this.message.set(err.message); this.messageType.set('error'); },
    });
  }

  freeze(accountNumber: string): void {
    this.employeeService.freezeAccount(accountNumber).subscribe({
      next: (res) => { this.message.set(res); this.messageType.set('success'); this.loadAccounts(); },
      error: (err) => { this.message.set(err.message); this.messageType.set('error'); },
    });
  }

  validateClosure(accountNumber: string): void {
    this.employeeService.validateClosure(accountNumber).subscribe({
      next: (res) => { this.message.set(res); this.messageType.set('success'); this.loadAccounts(); },
      error: (err) => { this.message.set(err.message); this.messageType.set('error'); },
    });
  }

  rejectClosure(accountNumber: string): void {
    this.employeeService.rejectClosure(accountNumber).subscribe({
      next: (res) => { this.message.set(res); this.messageType.set('success'); this.loadAccounts(); },
      error: (err) => { this.message.set(err.message); this.messageType.set('error'); },
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
      this.message.set('Compila tipo e importo');
      this.messageType.set('error');
      return;
    }

    const limits = this.LIMITS[this.limitType];
    if (limits) {
      if (this.limitAmount < limits.min) {
        this.message.set(`L'importo minimo è €${limits.min}`);
        this.messageType.set('error');
        return;
      }
      if (this.limitAmount > limits.max) {
        this.message.set(`L'importo massimo è €${limits.max.toLocaleString('it-IT')}`);
        this.messageType.set('error');
        return;
      }
    }

    this.employeeService.setAccountLimit(this.selectedAccount(), this.limitType, {
      maxAmount: this.limitAmount,
    }).subscribe({
      next: () => {
        this.message.set('Limite aggiornato!');
        this.messageType.set('success');
        this.limitAmount = 0;
        this.viewLimits(this.selectedAccount());
      },
      error: (err) => { this.message.set(err.message); this.messageType.set('error'); },
    });
  }

  getStatusName(statusId: number): string {
    const names: Record<number, string> = { 1: 'Inattivo', 2: 'Attivo', 3: 'Congelato', 4: 'Chiuso' };
    return names[statusId] ?? 'Sconosciuto';
  }
}
