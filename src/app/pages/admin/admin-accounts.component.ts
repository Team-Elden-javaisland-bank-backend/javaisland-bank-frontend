import { Component, ChangeDetectionStrategy, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ApiUrlPipe } from '../../shared/pipes/api-url.pipe';
import { AdminService, AdminAccountListItemDto } from '../../core/services/admin.service';

@Component({
  selector: 'app-admin-accounts',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, ApiUrlPipe],
  templateUrl: './admin-accounts.html',
  styleUrls: ['./admin-accounts.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminAccountsComponent implements OnInit {
  accounts = signal<AdminAccountListItemDto[]>([]);
  loading = signal(true);
  errorKey = signal<string | null>(null);
  searchQuery = signal('');
  filterStatus = signal<number | null>(null);

  filteredAccounts = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const list = this.accounts();
    if (!q) return list;
    return list.filter(a =>
      a.accountNumber.toLowerCase().includes(q) ||
      a.userFullName.toLowerCase().includes(q) ||
      a.userEmail.toLowerCase().includes(q)
    );
  });

  constructor(private adminService: AdminService, private translate: TranslateService) {}

  ngOnInit(): void {
    this.loadAccounts();
  }

  loadAccounts(): void {
    this.loading.set(true);
    const statusId = this.filterStatus();
    this.adminService.getAdminAccounts(statusId ?? undefined).subscribe({
      next: (data) => { this.accounts.set(data.content); this.loading.set(false); },
      error: () => { this.loading.set(false); this.errorKey.set('ADMIN.accounts.error_load'); }
    });
  }

  applyFilter(statusId: number | null): void {
    this.filterStatus.set(statusId);
    this.loadAccounts();
  }

  getStatusLabel(statusId: number): string {
    const labels: Record<number, string> = { 1: 'ADMIN.accounts.status_inactive', 2: 'ADMIN.accounts.status_active', 3: 'ADMIN.accounts.status_frozen', 4: 'ADMIN.accounts.status_closed' };
    return this.translate.instant(labels[statusId] || 'ADMIN.accounts.status_unknown');
  }

  getStatusClass(statusId: number): string {
    const classes: Record<number, string> = { 1: 'bg-secondary', 2: 'bg-success', 3: 'bg-info', 4: 'bg-danger' };
    return classes[statusId] || 'bg-secondary';
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '-';
    const locale = this.translate.currentLang() === 'it' ? 'it-IT' : 'en-GB';
    return new Date(dateStr).toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  formatCurrency(value: number): string {
    const locale = this.translate.currentLang() === 'it' ? 'it-IT' : 'en-GB';
    return new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(value);
  }
}
