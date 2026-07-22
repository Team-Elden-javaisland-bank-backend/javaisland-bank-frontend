import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AdminService, AdminTransactionListItemDto } from '../../core/services/admin.service';

@Component({
  selector: 'app-admin-transactions',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './admin-transactions.html',
  styleUrls: ['./admin-transactions.css']
})
export class AdminTransactionsComponent implements OnInit {
  transactions = signal<AdminTransactionListItemDto[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
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
      error: () => { this.loading.set(false); this.error.set(this.translate.instant('ADMIN.transactions.error_load')); }
    });
  }

  applyFilter(days: number): void {
    this.filterDays.set(days);
    this.loadTransactions();
  }

  getTypeLabel(typeId: number): string {
    const labels: Record<number, string> = { 1: 'ADMIN.transactions.type_transfer', 2: 'ADMIN.transactions.type_payment', 3: 'ADMIN.transactions.type_withdrawal' };
    return this.translate.instant(labels[typeId] || 'ADMIN.transactions.type_unknown');
  }

  getStatusLabel(statusId: number): string {
    const labels: Record<number, string> = { 1: 'ADMIN.transactions.status_pending', 2: 'ADMIN.transactions.status_completed', 3: 'ADMIN.transactions.status_failed' };
    return this.translate.instant(labels[statusId] || 'ADMIN.transactions.status_unknown');
  }

  getStatusClass(statusId: number): string {
    const classes: Record<number, string> = { 1: 'bg-warning text-dark', 2: 'bg-success', 3: 'bg-danger' };
    return classes[statusId] || 'bg-secondary';
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
