import { Component, signal, OnInit } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateDirective, TranslateService } from '@ngx-translate/core';
import { CustomerService } from '../../core/services/customer.service';
import { TransactionResponseDto } from '../../core/models/transaction/transaction-response.dto';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-customer-transactions',
  imports: [CurrencyPipe, DatePipe, FormsModule, TranslatePipe, TranslateDirective],
  templateUrl: './customer-transactions.html',
  styleUrl: './customer-transactions.css',
})
export class CustomerTransactionsComponent implements OnInit {
  allTransactions = signal<TransactionResponseDto[]>([]);
  loading = signal(true);
  accountNumbers = signal<Set<string>>(new Set());

  startDate = '';
  endDate = '';
  currentPage = signal(0);
  totalPages = 0;

  constructor(
    private customerService: CustomerService,
    private translate: TranslateService,
    private toastService: ToastService
  ) {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    this.startDate = oneMonthAgo.toISOString().split('T')[0];
    this.endDate = new Date().toISOString().split('T')[0];
  }

  ngOnInit(): void {
    this.loading.set(false);
    this.loadAccounts();
    this.loadHistory();
  }

  private loadAccounts(): void {
    this.customerService.getAccounts().subscribe({
      next: (accounts) => this.accountNumbers.set(new Set(accounts.map(a => a.accountNumber))),
    });
  }

  getTxDirection(tx: TransactionResponseDto): 'in' | 'out' | 'self' {
    const accs = this.accountNumbers();
    const isSource = tx.sourceAccountNumber ? accs.has(tx.sourceAccountNumber) : false;
    const isDest = tx.destinationAccountNumber ? accs.has(tx.destinationAccountNumber) : false;
    if (isSource && !isDest) return 'out';
    if (isDest && !isSource) return 'in';
    return 'self';
  }

  private extractError(err: any): string {
    return err?.error?.message || err?.message || 'An error occurred. Please try again later.';
  }

  loadHistory(): void {
    if (!this.startDate || !this.endDate) {
      this.toastService.error(this.translate.instant('TRANSACTIONS.select_dates'));
      return;
    }

    this.customerService.getAllTransactions(this.startDate, this.endDate, this.currentPage()).subscribe({
      next: (data) => {
        this.allTransactions.set(data.content);
        this.totalPages = data.totalPages;
      },
      error: (err) => this.toastService.error(this.extractError(err)),
    });
  }

  getTxIcon(typeId: number): string {
    const icons: Record<number, string> = {
      1: 'bi bi-plus-circle-fill',
      2: 'bi bi-dash-circle-fill',
      3: 'bi bi-send-fill',
      4: 'bi bi-gift-fill',
      5: 'bi bi-lightning-fill',
    };
    return icons[typeId] ?? 'bi bi-arrow-left-right';
  }

  getTypeNameLabel(typeName: string | undefined): string {
    const map: Record<string, string> = {
      'DEPOSIT': 'TX_TYPE.DEPOSIT', 'Deposito': 'TX_TYPE.DEPOSIT',
      'WITHDRAWAL': 'TX_TYPE.WITHDRAWAL', 'Prelievo': 'TX_TYPE.WITHDRAWAL',
      'TRANSFER': 'TX_TYPE.TRANSFER', 'Bonifico': 'TX_TYPE.TRANSFER',
      'Bonifico Normale': 'TX_TYPE.TRANSFER',
      'INSTANT_TRANSFER': 'TX_TYPE.INSTANT_TRANSFER',
      'Bonifico Istantaneo': 'TX_TYPE.INSTANT_TRANSFER',
      'INITIAL_TRANSFER': 'TX_TYPE.INITIAL_TRANSFER',
      'Bonifico Iniziale': 'TX_TYPE.INITIAL_TRANSFER',
    };
    return typeName ? this.translate.instant(map[typeName] ?? typeName) : this.translate.instant('TX_TYPE.UNKNOWN');
  }

  getStatusLabel(statusName: string | undefined): string {
    const map: Record<string, string> = {
      'PENDING': 'TX_STATUS.PENDING', 'COMPLETED': 'TX_STATUS.COMPLETED',
      'FAILED': 'TX_STATUS.FAILED', 'REJECTED': 'TX_STATUS.REJECTED',
    };
    return statusName ? this.translate.instant(map[statusName] ?? statusName) : this.translate.instant('TX_STATUS.UNKNOWN');
  }

  getStatusClass(statusName: string | undefined): string {
    const map: Record<string, string> = {
      'COMPLETED': 'status-completed', 'PENDING': 'status-pending',
      'FAILED': 'status-failed', 'REJECTED': 'status-rejected',
    };
    return map[statusName ?? ''] ?? 'status-pending';
  }

  maskAccount(account: string | null): string {
    if (!account) return '—';
    if (account.length <= 8) return account;
    return '****' + account.slice(-4);
  }

  prevPage(): void {
    this.currentPage.set(this.currentPage() - 1);
    this.loadHistory();
  }

  nextPage(): void {
    this.currentPage.set(this.currentPage() + 1);
    this.loadHistory();
  }
}
