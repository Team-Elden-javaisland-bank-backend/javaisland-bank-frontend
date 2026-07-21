import { Component, signal, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { CustomerService } from '../../core/services/customer.service';
import { AccountResponseDto } from '../../core/models/account/account-response.dto';
import { TransactionResponseDto } from '../../core/models/transaction/transaction-response.dto';

@Component({
  selector: 'app-customer-account-detail',
  imports: [CurrencyPipe, DatePipe, FormsModule, TranslatePipe],
  templateUrl: './customer-account-detail.html',
  styleUrl: './customer-account-detail.css',
})
export class CustomerAccountDetailComponent implements OnInit, OnDestroy {
  account = signal<AccountResponseDto | null>(null);
  transactions = signal<TransactionResponseDto[]>([]);
  loading = signal(true);
  loadingMore = signal(false);
  expandedTxId = signal<number | null>(null);
  cancellingId = signal<number | null>(null);
  txMessage = signal('');
  txMessageType = signal<'success' | 'error'>('success');

  accountNumber = '';
  startDate = '';
  endDate = '';
  currentPage = 0;
  totalPages = 1;
  hasMore = true;
  private observer?: IntersectionObserver;

  @ViewChild('sentinel') sentinel!: ElementRef<HTMLDivElement>;

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private customerService: CustomerService,
    private translate: TranslateService,
  ) {}

  ngOnInit(): void {
    this.accountNumber = this.route.snapshot.paramMap.get('accountNumber') || '';
    this.loadAccount();
    this.loadTransactions();
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  ngAfterViewInit(): void {
    this.setupInfiniteScroll();
  }

  loadAccount(): void {
    this.customerService.getAccountDetail(this.accountNumber).subscribe({
      next: (data) => this.account.set(data),
      error: () => this.router.navigate(['/customer/accounts']),
    });
  }

  loadTransactions(): void {
    if (!this.startDate || !this.endDate) {
      const today = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);
      this.startDate = thirtyDaysAgo.toISOString().split('T')[0];
      this.endDate = today.toISOString().split('T')[0];
    }

    this.loading.set(true);
    this.currentPage = 0;
    this.transactions.set([]);
    this.hasMore = true;

    this.fetchPage();
  }

  private fetchPage(): void {
    this.loadingMore.set(true);
    this.customerService.getAccountTransactions(
      this.accountNumber,
      this.startDate,
      this.endDate,
      this.currentPage,
      20,
    ).subscribe({
      next: (res) => {
        if (this.currentPage === 0) {
          this.transactions.set(res.content);
        } else {
          this.transactions.update(prev => [...prev, ...res.content]);
        }
        this.totalPages = res.totalPages;
        this.hasMore = !res.last;
        this.loading.set(false);
        this.loadingMore.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.loadingMore.set(false);
      },
    });
  }

  nextPage(): void {
    if (!this.hasMore || this.loadingMore()) return;
    this.currentPage++;
    this.fetchPage();
  }

  goToTransfer(): void {
    this.router.navigate(['/customer/transactions'], {
      queryParams: { source: this.accountNumber, tab: 'transfer' },
    });
  }

  toggleTx(id: number): void {
    this.expandedTxId.update(current => current === id ? null : id);
  }

  cancelTx(tx: TransactionResponseDto, event: Event): void {
    event.stopPropagation();
    this.txMessage.set('');
    this.cancellingId.set(tx.id);
    this.customerService.cancelTransaction(tx.id).subscribe({
      next: () => {
        this.transactions.update(list =>
          list.map(t => t.id === tx.id ? { ...t, statusId: 5, statusName: 'CANCELLED' } : t)
        );
        this.cancellingId.set(null);
        this.txMessage.set(this.translate.instant('ACCOUNT_DETAIL.messages.cancel_success'));
        this.txMessageType.set('success');
      },
      error: (err) => {
        this.cancellingId.set(null);
        this.txMessage.set(err?.message || this.translate.instant('ACCOUNT_DETAIL.messages.cancel_error'));
        this.txMessageType.set('error');
      },
    });
  }

  getTypeLabel(typeName: string | undefined): string {
    const map: Record<string, string> = {
      'DEPOSIT': 'TX_TYPE.DEPOSIT',
      'Deposito': 'TX_TYPE.DEPOSIT',
      'WITHDRAWAL': 'TX_TYPE.WITHDRAWAL',
      'Prelievo': 'TX_TYPE.WITHDRAWAL',
      'TRANSFER': 'TX_TYPE.TRANSFER',
      'Bonifico Normale': 'TX_TYPE.TRANSFER',
      'Bonifico': 'TX_TYPE.TRANSFER',
      'INSTANT_TRANSFER': 'TX_TYPE.INSTANT_TRANSFER',
      'Bonifico Istantaneo': 'TX_TYPE.INSTANT_TRANSFER',
      'INITIAL_TRANSFER': 'TX_TYPE.INITIAL_TRANSFER',
      'Bonifico Iniziale': 'TX_TYPE.INITIAL_TRANSFER',
    };
    return typeName ? this.translate.instant(map[typeName] ?? typeName) : this.translate.instant('TX_TYPE.UNKNOWN');
  }

  getTxDirection(tx: TransactionResponseDto): 'in' | 'out' | 'pending-out' | 'self' {
    if (tx.statusName === 'PENDING' && tx.sourceAccountNumber === this.accountNumber) return 'pending-out';
    if (tx.destinationAccountNumber === this.accountNumber && tx.sourceAccountNumber !== this.accountNumber) return 'in';
    if (tx.sourceAccountNumber === this.accountNumber && tx.destinationAccountNumber !== this.accountNumber) return 'out';
    return 'self';
  }

  isPending(tx: TransactionResponseDto): boolean {
    return tx.statusName === 'PENDING';
  }

  isCancelled(tx: TransactionResponseDto): boolean {
    return tx.statusName === 'CANCELLED';
  }

  private setupInfiniteScroll(): void {
    if (typeof IntersectionObserver === 'undefined') return;
    this.observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && this.hasMore && !this.loadingMore() && !this.loading()) {
          this.nextPage();
        }
      },
      { rootMargin: '200px' },
    );
    setTimeout(() => {
      if (this.sentinel?.nativeElement) {
        this.observer?.observe(this.sentinel.nativeElement);
      }
    }, 0);
  }
}