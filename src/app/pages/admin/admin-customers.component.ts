import { Component, ChangeDetectionStrategy, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateDirective, TranslateService } from '@ngx-translate/core';
import { ApiUrlPipe } from '../../shared/pipes/api-url.pipe';
import { AdminService, AdminCustomerListItemDto, AdminCustomerDetailDto } from '../../core/services/admin.service';

@Component({
  selector: 'app-admin-customers',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, TranslateDirective, ApiUrlPipe],
  templateUrl: './admin-customers.html',
  styleUrls: ['./admin-customers.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminCustomersComponent implements OnInit {
  customers = signal<AdminCustomerListItemDto[]>([]);
  loading = signal(true);
  errorKey = signal<string | null>(null);
  searchQuery = signal('');
  page = signal(0);
  pageSize = signal(20);
  totalElements = signal(0);
  totalPages = signal(1);

  hasPrev = computed(() => this.page() > 0);
  hasNext = computed(() => this.page() + 1 < this.totalPages());

  showModal = signal(false);
  modalLoading = signal(false);
  customerDetail = signal<AdminCustomerDetailDto | null>(null);

  filteredCustomers = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const list = this.customers();
    if (!q) return list;
    return list.filter(c =>
      c.firstName.toLowerCase().includes(q) ||
      c.lastName.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q)
    );
  });

  constructor(private adminService: AdminService, private translate: TranslateService) {}

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.loading.set(true);
    this.adminService.getCustomers(this.page(), this.pageSize()).subscribe({
      next: (data) => {
        this.customers.set(data.content);
        this.totalElements.set(data.totalElements);
        this.totalPages.set(data.totalPages || 1);
        this.loading.set(false);
      },
      error: () => { this.loading.set(false); this.errorKey.set('ADMIN.customers.error_load'); }
    });
  }

  goToPage(target: number): void {
    if (target < 0 || target >= this.totalPages()) return;
    this.page.set(target);
    this.loadCustomers();
  }

  prevPage(): void {
    this.goToPage(this.page() - 1);
  }

  nextPage(): void {
    this.goToPage(this.page() + 1);
  }

  openDetail(userId: number): void {
    this.showModal.set(true);
    this.modalLoading.set(true);
    this.adminService.getCustomerDetail(userId).subscribe({
      next: (data) => { this.customerDetail.set(data); this.modalLoading.set(false); },
      error: () => { this.modalLoading.set(false); }
    });
  }

  closeModal(): void {
    this.showModal.set(false);
    this.customerDetail.set(null);
  }

  getFullName(c: { firstName: string; lastName: string }): string {
    return `${c.firstName} ${c.lastName}`;
  }

  getInitials(c: { firstName?: string; lastName?: string }): string {
    return (c.firstName?.charAt(0) ?? '') + (c.lastName?.charAt(0) ?? '');
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      ACTIVE: 'bg-success',
      SUSPENDED: 'bg-danger',
      PENDING: 'bg-warning text-dark',
      ANNULLED: 'bg-secondary',
    };
    return classes[status] || 'bg-secondary';
  }

  getAccountStatusLabel(statusId: number): string {
    const map: Record<number, string> = { 1: 'INACTIVE', 2: 'ACTIVE', 3: 'FROZEN', 4: 'CLOSED' };
    const key = 'STATUS.' + (map[statusId] || 'UNKNOWN');
    const translated = this.translate.instant(key);
    return translated === key ? String(statusId) : translated;
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
