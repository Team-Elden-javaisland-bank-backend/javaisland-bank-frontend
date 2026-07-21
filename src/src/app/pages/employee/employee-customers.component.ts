import { Component, signal, computed } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { EmployeeService } from '../../core/services/employee.service';
import { CustomerListItemDto } from '../../core/models/user/customer-list-item.dto';
import { AccountResponseDto } from '../../core/models/account/account-response.dto';
import { EmployeeUserDetailDto } from '../../core/models/user/employee-user-detail.dto';

@Component({
  selector: 'app-employee-customers',
  imports: [DatePipe, CurrencyPipe],
  templateUrl: './employee-customers.html',
  styleUrls: ['./employee-customers.css'],
})
export class EmployeeCustomersComponent {
  customers = signal<CustomerListItemDto[]>([]);
  loading = signal(true);
  searchQuery = signal('');

  expandedCustomerId = signal<number | null>(null);
  customerAccounts = signal<Map<number, AccountResponseDto[]>>(new Map());
  loadingAccounts = signal(false);

  showModal = signal(false);
  modalDetail = signal<EmployeeUserDetailDto | null>(null);
  loadingModal = signal(false);

  message = signal('');
  messageType = signal<'success' | 'error'>('success');

  filteredCustomers = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return this.customers();
    return this.customers().filter(
      (c) =>
        c.firstName.toLowerCase().includes(query) ||
        c.lastName.toLowerCase().includes(query) ||
        c.email.toLowerCase().includes(query)
    );
  });

  constructor(private employeeService: EmployeeService) {
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.loading.set(true);
    this.employeeService.getCustomers().subscribe({
      next: (data) => {
        this.customers.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
  }

  toggleExpand(customerId: number): void {
    const current = this.expandedCustomerId();
    if (current === customerId) {
      this.expandedCustomerId.set(null);
      return;
    }

    this.expandedCustomerId.set(customerId);

    if (!this.customerAccounts().has(customerId)) {
      this.loadingAccounts.set(true);
      this.employeeService.getAccountsByUser(customerId).subscribe({
        next: (accounts) => {
          const map = new Map(this.customerAccounts());
          map.set(customerId, accounts);
          this.customerAccounts.set(map);
          this.loadingAccounts.set(false);
        },
        error: () => this.loadingAccounts.set(false),
      });
    }
  }

  openUserDetail(accountNumber: string): void {
    this.showModal.set(true);
    this.loadingModal.set(true);
    this.modalDetail.set(null);

    this.employeeService.getUserDetailByAccount(accountNumber).subscribe({
      next: (detail) => {
        this.modalDetail.set(detail);
        this.loadingModal.set(false);
      },
      error: () => this.loadingModal.set(false),
    });
  }

  closeModal(): void {
    this.showModal.set(false);
    this.modalDetail.set(null);
  }

  getAccountsForCustomer(customerId: number): AccountResponseDto[] {
    return this.customerAccounts().get(customerId) || [];
  }

  getStatusLabel(statusId: number): string {
    const labels: Record<number, string> = {
      1: 'Attivo',
      2: 'Sospeso',
      3: 'Chiuso',
    };
    return labels[statusId] || 'Sconosciuto';
  }

  getStatusClass(statusId: number): string {
    const classes: Record<number, string> = {
      1: 'badge-active',
      2: 'badge-frozen',
      3: 'badge-closed',
    };
    return classes[statusId] || 'badge-pending';
  }

  getAccountStatusLabel(statusId: number): string {
    const labels: Record<number, string> = {
      1: 'Inattivo',
      2: 'Attivo',
      3: 'Congelato',
      4: 'Chiuso',
    };
    return labels[statusId] || 'Sconosciuto';
  }

  getAccountStatusClass(statusId: number): string {
    const classes: Record<number, string> = {
      1: 'badge-pending',
      2: 'badge-active',
      3: 'badge-frozen',
      4: 'badge-closed',
    };
    return classes[statusId] || 'badge-pending';
  }

  getDetailAccountStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      ACTIVE: 'Attivo',
      FROZEN: 'Sospeso',
      CLOSED: 'Chiuso',
      PENDING: 'In attesa',
      REJECTED: 'Rifiutato',
    };
    return labels[status] || status;
  }

  getDetailAccountStatusClass(status: string): string {
    const classes: Record<string, string> = {
      ACTIVE: 'badge-active',
      FROZEN: 'badge-frozen',
      CLOSED: 'badge-closed',
      PENDING: 'badge-pending',
      REJECTED: 'badge-rejected',
    };
    return classes[status] || 'badge-pending';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  }

  getUserStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      ACTIVE: 'Attivo',
      INACTIVE: 'Inattivo',
      PENDING: 'In attesa',
    };
    return labels[status] || status;
  }

  getUserStatusClass(status: string): string {
    const classes: Record<string, string> = {
      ACTIVE: 'badge-active',
      INACTIVE: 'badge-closed',
      PENDING: 'badge-pending',
    };
    return classes[status] || 'badge-pending';
  }

  getCardStatusClass(status: string): string {
    const classes: Record<string, string> = {
      ACTIVE: 'badge-active',
      INACTIVE: 'badge-pending',
      BLOCKED: 'badge-closed',
    };
    return classes[status] || 'badge-pending';
  }

  getCardStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      ACTIVE: 'Attiva',
      INACTIVE: 'Inattiva',
      BLOCKED: 'Bloccata',
    };
    return labels[status] || status;
  }

  trackByUserId(_index: number, customer: CustomerListItemDto): number {
    return customer.userId;
  }

  trackByAccountNumber(_index: number, account: AccountResponseDto): string {
    return account.accountNumber;
  }
}
