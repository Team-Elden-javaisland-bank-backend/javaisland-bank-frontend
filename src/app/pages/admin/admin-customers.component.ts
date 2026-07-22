import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateDirective, TranslateService } from '@ngx-translate/core';
import { AdminService, AdminCustomerListItemDto, AdminCustomerDetailDto } from '../../core/services/admin.service';

@Component({
  selector: 'app-admin-customers',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, TranslateDirective],
  templateUrl: './admin-customers.html',
  styleUrls: ['./admin-customers.css']
})
export class AdminCustomersComponent implements OnInit {
  customers = signal<AdminCustomerListItemDto[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  message = signal<string | null>(null);
  searchQuery = signal('');

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
    this.adminService.getCustomers().subscribe({
      next: (data) => { this.customers.set(data); this.loading.set(false); },
      error: () => { this.loading.set(false); this.error.set(this.translate.instant('ADMIN.customers.error_load')); }
    });
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
