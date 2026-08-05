import { Component, ChangeDetectionStrategy, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AdminService, AdminTransactionListItemDto } from '../../core/services/admin.service';

@Component({
  selector: 'app-admin-transactions',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './admin-transactions.html',
  styleUrls: ['./admin-transactions.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminTransactionsComponent implements OnInit {
  transactions = signal<AdminTransactionListItemDto[]>([]);
  loading = signal(true);
  errorKey = signal<string | null>(null);
  searchQuery = signal('');
  filterDays = signal<number>(30);

  filteredTransactions = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const list = this.transactions();
    if (!q) return list;
    return list.filter(t =>
      t.description?.toLowerCase().includes(q) ||
      t.sourceAccountNumber?.toLowerCase().includes(q) ||
      t.destinationAccountNumber?.toLowerCase().includes(q)
    );
  });

  constructor(private adminService: AdminService, private translate: TranslateService) {}

  ngOnInit(): void {
    this.loadTransactions();
  }

  loadTransactions(): void {
    this.loading.set(true);
    this.adminService.getAdminTransactions(this.filterDays()).subscribe({
      next: (data) => { this.transactions.set(data); this.loading.set(false); },
      error: () => { this.loading.set(false); this.errorKey.set('ADMIN.transactions.error_load'); }
    });
  }

  applyFilter(days: number): void {
    this.filterDays.set(days);
    this.loadTransactions();
  }

  getTypeLabel(t: AdminTransactionListItemDto): string {
    const labels: Record<string, string> = {
      'DEPOSIT': 'ADMIN.transactions.type_deposit',
      'WITHDRAWAL': 'ADMIN.transactions.type_withdrawal',
      'TRANSFER': 'ADMIN.transactions.type_transfer',
      'INITIAL_TRANSFER': 'ADMIN.transactions.type_initial_transfer',
      'INSTANT_TRANSFER': 'ADMIN.transactions.type_instant_transfer',
    };
    return this.translate.instant(labels[t.typeName] || 'ADMIN.transactions.type_unknown');
  }

  getStatusLabel(t: AdminTransactionListItemDto): string {
    const labels: Record<string, string> = {
      'PENDING': 'ADMIN.transactions.status_pending',
      'COMPLETED': 'ADMIN.transactions.status_completed',
      'FAILED': 'ADMIN.transactions.status_failed',
      'REJECTED': 'ADMIN.transactions.status_rejected',
      'CANCELLED': 'ADMIN.transactions.status_cancelled',
    };
    return this.translate.instant(labels[t.statusName] || 'ADMIN.transactions.status_unknown');
  }

  getStatusClass(statusName: string): string {
    const classes: Record<string, string> = {
      'PENDING': 'bg-warning text-dark',
      'COMPLETED': 'bg-success',
      'FAILED': 'bg-danger',
      'REJECTED': 'bg-secondary',
      'CANCELLED': 'bg-dark',
    };
    return classes[statusName] || 'bg-secondary';
  }

  getDescription(t: AdminTransactionListItemDto): string {
    if (!t.description) return '-';
    const desc = t.description;
    if (desc === 'Internal transfer') {
      return this.translate.instant('ADMIN.transactions.desc_internal_transfer');
    }
    return desc;
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '-';
    const locale = this.translate.currentLang() === 'it' ? 'it-IT' : 'en-GB';
    return new Date(dateStr).toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  formatCurrency(value: number): string {
    const locale = this.translate.currentLang() === 'it' ? 'it-IT' : 'en-GB';
    return new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(value);
  }
}
