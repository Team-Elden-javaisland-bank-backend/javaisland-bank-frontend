import { Component, signal, OnInit } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { CustomerService } from '../../core/services/customer.service';
import { AuthService } from '../../core/services/auth.service';
import { AccountResponseDto } from '../../core/models/account/account-response.dto';
import { TransactionResponseDto } from '../../core/models/transaction/transaction-response.dto';

@Component({
  selector: 'app-customer-dashboard',
  imports: [CurrencyPipe, DatePipe, RouterLink, TranslatePipe],
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
    private translate: TranslateService,
  ) {}

  ngOnInit(): void {
    this.loadAccounts();
  }

  get greeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return this.translate.instant('DASHBOARD.greeting_morning');
    if (hour < 18) return this.translate.instant('DASHBOARD.greeting_afternoon');
    return this.translate.instant('DASHBOARD.greeting_evening');
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
    const types: Record<number, string> = { 1: 'TX_TYPE.DEPOSIT', 2: 'TX_TYPE.WITHDRAWAL', 3: 'TX_TYPE.TRANSFER', 4: 'TX_TYPE.INITIAL_TRANSFER' };
    return this.translate.instant(types[typeId] ?? 'TX_TYPE.UNKNOWN');
  }

  getTypeNameLabel(typeName: string | undefined): string {
    const map: Record<string, string> = {
      'DEPOSIT': 'TX_TYPE.DEPOSIT',
      'Deposito': 'TX_TYPE.DEPOSIT',
      'WITHDRAWAL': 'TX_TYPE.WITHDRAWAL',
      'Prelievo': 'TX_TYPE.WITHDRAWAL',
      'TRANSFER': 'TX_TYPE.TRANSFER',
      'Bonifico': 'TX_TYPE.TRANSFER',
      'Bonifico Normale': 'TX_TYPE.TRANSFER',
      'INITIAL_TRANSFER': 'TX_TYPE.INITIAL_TRANSFER',
      'Bonifico Iniziale': 'TX_TYPE.INITIAL_TRANSFER',
      'INSTANT_TRANSFER': 'TX_TYPE.INSTANT_TRANSFER',
      'Bonifico Istantaneo': 'TX_TYPE.INSTANT_TRANSFER',
    };
    return typeName ? this.translate.instant(map[typeName] ?? typeName) : this.translate.instant('TX_TYPE.UNKNOWN');
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
