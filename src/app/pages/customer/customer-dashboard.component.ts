import { Component, signal, OnInit } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
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
  currentCardIndex = signal(0);

  today = new Date();

  constructor(
    private customerService: CustomerService,
    public authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadAccounts();
  }

  get greeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buongiorno';
    if (hour < 18) return 'Buon pomeriggio';
    return 'Buonasera';
  }

  get userName(): string {
    const user = this.authService.getUser();
    return user?.firstName ?? '';
  }

  loadAccounts(): void {
    this.customerService.getAccounts().subscribe({
      next: (data) => {
        const sorted = [...data].sort((a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        this.accounts.set(sorted);
        this.currentCardIndex.set(0);
        if (sorted.length > 0) {
          this.selectAccount(sorted[0].accountNumber);
        } else {
          this.loading.set(false);
        }
      },
      error: () => this.loading.set(false),
    });
  }

  prevCard(): void {
    const idx = this.currentCardIndex();
    if (idx > 0) this.currentCardIndex.set(idx - 1);
  }

  nextCard(): void {
    const idx = this.currentCardIndex();
    if (idx < this.accounts().length - 1) this.currentCardIndex.set(idx + 1);
  }

  goToCard(index: number): void {
    this.currentCardIndex.set(index);
  }

  getCardOffset(account: AccountResponseDto): number {
    return this.currentCardIndex() - this.accounts().indexOf(account);
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

  getTypeNameLabel(typeName: string | undefined): string {
    const map: Record<string, string> = {
      'DEPOSIT': 'Deposito',
      'WITHDRAWAL': 'Prelievo',
      'TRANSFER': 'Bonifico',
      'INITIAL_TRANSFER': 'Bonifico Iniziale',
    };
    return typeName ? (map[typeName] ?? typeName) : 'Sconosciuto';
  }

  getStatusClass(statusId: number): string {
    const classes: Record<number, string> = { 1: 'pending', 2: 'completed', 3: 'failed', 4: 'rejected' };
    return classes[statusId] ?? '';
  }

  getStatusNameClass(statusName: string | undefined): string {
    const map: Record<string, string> = {
      'PENDING': 'pending',
      'COMPLETED': 'completed',
      'FAILED': 'failed',
      'REJECTED': 'rejected',
    };
    return statusName ? (map[statusName] ?? '') : '';
  }
}
