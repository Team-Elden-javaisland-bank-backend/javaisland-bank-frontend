import { Component, signal, OnInit } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CustomerService } from '../../core/services/customer.service';
import { AuthService } from '../../core/services/auth.service';
import { AccountResponseDto } from '../../core/models/account/account-response.dto';
import { TransactionResponseDto } from '../../core/models/transaction/transaction-response.dto';

@Component({
  selector: 'app-customer-dashboard',
  imports: [CurrencyPipe, DatePipe, RouterLink],
  templateUrl: './customer-dashboard.html',
  styleUrl: './customer-dashboard.css',
})
export class CustomerDashboardComponent implements OnInit {
  accounts = signal<AccountResponseDto[]>([]);
  recentTransactions = signal<TransactionResponseDto[]>([]);
  loading = signal(true);
  selectedAccount = signal<string>('');
  transactionsLoading = signal(false);

  constructor(
    private customerService: CustomerService,
    public authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.loadAccounts();
  }

  loadAccounts(): void {
    this.customerService.getAccounts().subscribe({
      next: (data) => {
        this.accounts.set(data);
        if (data.length > 0) {
          this.selectAccount(data[0].accountNumber);
        } else {
          this.loading.set(false);
        }
      },
      error: () => this.loading.set(false),
    });
  }

  selectAccount(accountNumber: string): void {
    this.selectedAccount.set(accountNumber);
    this.transactionsLoading.set(true);
    this.customerService.getRecentTransactions(accountNumber).subscribe({
      next: (data) => {
        this.recentTransactions.set(data);
        this.loading.set(false);
        this.transactionsLoading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.transactionsLoading.set(false);
      },
    });
  }

  get totalBalance(): number {
    return this.accounts().reduce((sum, acc) => sum + acc.balance, 0);
  }

  get activeAccounts(): number {
    return this.accounts().filter((a) => a.statusId === 2).length;
  }

  getTransactionType(typeId: number): string {
    const types: Record<number, string> = { 1: 'Deposito', 2: 'Prelievo', 3: 'Bonifico', 4: 'Bonifico Iniziale' };
    return types[typeId] ?? 'Sconosciuto';
  }

  getStatusClass(statusId: number): string {
    const classes: Record<number, string> = { 1: 'pending', 2: 'completed', 3: 'failed', 4: 'rejected' };
    return classes[statusId] ?? '';
  }
}
