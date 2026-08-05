import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { TranslatePipe, TranslateDirective, TranslateService } from '@ngx-translate/core';
import { ApiUrlPipe } from '../../shared/pipes/api-url.pipe';
import { EmployeeService } from '../../core/services/employee.service';
import { CustomerListItemDto } from '../../core/models/user/customer-list-item.dto';
import { AccountResponseDto } from '../../core/models/account/account-response.dto';
import { EmployeeUserDetailDto } from '../../core/models/user/employee-user-detail.dto';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-employee-customers',
  imports: [DatePipe, CurrencyPipe, TranslatePipe, TranslateDirective, ApiUrlPipe],
  templateUrl: './employee-customers.html',
  styleUrls: ['./employee-customers.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeCustomersComponent {
  customers = signal<CustomerListItemDto[]>([]);
  loading = signal(true);
  searchQuery = signal('');
  statusFilter = signal('ACTIVE');
  page = signal(0);
  pageSize = signal(20);
  totalElements = signal(0);
  totalPages = signal(1);

  hasPrev = computed(() => this.page() > 0);
  hasNext = computed(() => this.page() + 1 < this.totalPages());

  expandedCustomerId = signal<number | null>(null);
  customerAccounts = signal<Map<number, AccountResponseDto[]>>(new Map());
  loadingAccounts = signal(false);

  showModal = signal(false);
  modalDetail = signal<EmployeeUserDetailDto | null>(null);
  loadingModal = signal(false);
  modalMode = signal<'user' | 'account'>('account');

  isGeneratingPdf = signal<boolean>(false);

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

  constructor(private employeeService: EmployeeService, private translate: TranslateService) {
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.loading.set(true);
    this.employeeService.getCustomers(this.statusFilter(), this.page(), this.pageSize()).subscribe({
      next: (data) => {
        this.customers.set(data.content);
        this.totalElements.set(data.totalElements);
        this.totalPages.set(data.totalPages || 1);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onStatusChange(event: Event): void {
    this.statusFilter.set((event.target as HTMLSelectElement).value);
    this.page.set(0);
    this.loadCustomers();
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

  openAccountDetail(accountNumber: string): void {
    this.showModal.set(true);
    this.loadingModal.set(true);
    this.modalDetail.set(null);
    this.modalMode.set('account');

    this.employeeService.getUserDetailByAccount(accountNumber).subscribe({
      next: (detail) => {
        this.modalDetail.set(detail);
        this.loadingModal.set(false);
      },
      error: () => this.loadingModal.set(false),
    });
  }

  viewUserDetail(userId: number): void {
    this.showModal.set(true);
    this.loadingModal.set(true);
    this.modalDetail.set(null);
    this.modalMode.set('user');

    this.employeeService.getUserDetailByUserId(userId).subscribe({
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
    const keys: Record<number, string> = { 1: 'STATUS.PENDING', 2: 'STATUS.ACTIVE', 3: 'STATUS.ANNULLED', 4: 'STATUS.SUSPENDED' };
    return this.translate.instant(keys[statusId] || 'STATUS.UNKNOWN');
  }

  getStatusClass(statusId: number): string {
    const classes: Record<number, string> = {
      1: 'badge-pending',
      2: 'badge-active',
      3: 'badge-closed',
      4: 'badge-frozen',
    };
    return classes[statusId] || 'badge-pending';
  }

  getAccountStatusLabel(statusId: number): string {
    const keys: Record<number, string> = { 1: 'STATUS.INACTIVE', 2: 'STATUS.ACTIVE', 3: 'STATUS.FROZEN', 4: 'STATUS.CLOSED' };
    return this.translate.instant(keys[statusId] || 'STATUS.UNKNOWN');
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
    const keys: Record<string, string> = {
      ACTIVE: 'STATUS.ACTIVE',
      FROZEN: 'STATUS.SUSPENDED',
      CLOSED: 'STATUS.CLOSED',
      PENDING: 'STATUS.PENDING',
      REJECTED: 'STATUS.REJECTED',
    };
    return this.translate.instant(keys[status] || status);
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
    const keys: Record<string, string> = {
      ACTIVE: 'STATUS.ACTIVE',
      INACTIVE: 'STATUS.INACTIVE',
      PENDING: 'STATUS.PENDING',
    };
    return this.translate.instant(keys[status] || status);
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
    const keys: Record<string, string> = {
      ACTIVE: 'STATUS.ACTIVE_F',
      INACTIVE: 'STATUS.INACTIVE_F',
      BLOCKED: 'STATUS.BLOCKED_F',
    };
    return this.translate.instant(keys[status] || status);
  }

  generatePdf(): void {
    this.isGeneratingPdf.set(true);
    const doc = new jsPDF();
    const list = this.filteredCustomers();

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(10, 25, 47);
    doc.text(this.translate.instant('EMPLOYEE.customers.pdf_bank_name'), 14, 22);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(this.translate.instant('EMPLOYEE.customers.pdf_title'), 14, 30);
    doc.text(`${this.translate.instant('EMPLOYEE.customers.pdf_date')}: ${new Date().toLocaleDateString('it-IT')}`, 14, 36);

    doc.setFontSize(10);
    doc.setTextColor(10, 25, 47);
    doc.text(`${this.translate.instant('EMPLOYEE.customers.total')}: ${list.length}`, 14, 42);

    const rows = list.map((c, i) => [
      i + 1,
      c.firstName,
      c.lastName,
      c.email,
      this.getStatusLabel(c.statusId)
    ]);

    autoTable(doc, {
      startY: 48,
      head: [[
        '#',
        this.translate.instant('EMPLOYEE.customers.pdf_col_name'),
        this.translate.instant('EMPLOYEE.customers.pdf_col_surname'),
        this.translate.instant('EMPLOYEE.customers.pdf_col_email'),
        this.translate.instant('EMPLOYEE.customers.pdf_col_status')
      ]],
      body: rows,
      theme: 'grid',
      headStyles: { fillColor: [10, 25, 47], textColor: [229, 169, 60], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      styles: { fontSize: 9, cellPadding: 4 },
    });

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `${this.translate.instant('PROFILE.pdf_page')} ${i} ${this.translate.instant('PROFILE.pdf_of')} ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    doc.save(`elenco_correntisti_${new Date().toISOString().slice(0, 10)}.pdf`);
    this.isGeneratingPdf.set(false);
  }

  trackByUserId(_index: number, customer: CustomerListItemDto): number {
    return customer.userId;
  }

  trackByAccountNumber(_index: number, account: AccountResponseDto): string {
    return account.accountNumber;
  }
}
