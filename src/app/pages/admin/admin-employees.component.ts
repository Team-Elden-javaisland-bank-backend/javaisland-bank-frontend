import { Component, ChangeDetectionStrategy, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateDirective, TranslateService } from '@ngx-translate/core';
import { ApiUrlPipe } from '../../shared/pipes/api-url.pipe';
import { AdminService, EmployeeListItemDto, CreateEmployeeRequestDto, EmployeeDetailDto } from '../../core/services/admin.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-admin-employees',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, TranslateDirective, ApiUrlPipe],
  templateUrl: './admin-employees.html',
  styleUrls: ['./admin-employees.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminEmployeesComponent implements OnInit {
  employees = signal<EmployeeListItemDto[]>([]);
  loading = signal(true);
  errorKey = signal<string | null>(null);

  searchQuery = signal('');
  filterStatus = signal<string>('ALL');

  showCreateForm = signal(false);
  newEmployee = signal<CreateEmployeeRequestDto>({
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  });
  creating = signal(false);

  showDetailModal = signal(false);
  employeeDetail = signal<EmployeeDetailDto | null>(null);
  loadingDetail = signal(false);

  actingEmployeeId = signal<number | null>(null);

  filteredEmployees = computed(() => {
    let list = this.employees();
    const query = this.searchQuery().toLowerCase().trim();
    const status = this.filterStatus();

    if (query) {
      list = list.filter(
        (e) =>
          e.firstName.toLowerCase().includes(query) ||
          e.lastName.toLowerCase().includes(query) ||
          e.email.toLowerCase().includes(query) ||
          e.username.toLowerCase().includes(query)
      );
    }

    if (status !== 'ALL') {
      list = list.filter((e) => e.status === status);
    }

    return list;
  });

  statusCounts = computed(() => {
    const all = this.employees();
    return {
      ALL: all.length,
      ACTIVE: all.filter((e) => e.status === 'ACTIVE').length,
      SUSPENDED: all.filter((e) => e.status === 'SUSPENDED').length,
      PENDING: all.filter((e) => e.status === 'PENDING').length,
      ANNULLED: all.filter((e) => e.status === 'ANNULLED').length,
    };
  });

  constructor(private adminService: AdminService, private translate: TranslateService, private toastService: ToastService) {}

  ngOnInit(): void {
    this.loadEmployees();
  }

  loadEmployees(): void {
    this.loading.set(true);
    this.errorKey.set(null);

    this.adminService.getEmployees().subscribe({
      next: (data) => {
        this.employees.set(data.content);
        this.loading.set(false);
      },
      error: (err) => {
        this.errorKey.set('ADMIN.employees.error_load');
        this.loading.set(false);
        console.error('Employees error:', err);
      }
    });
  }

  onSearchInput(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  setFilterStatus(status: string): void {
    this.filterStatus.set(status);
  }

  toggleCreateForm(): void {
    this.showCreateForm.update((v) => !v);
    if (!this.showCreateForm()) {
      this.resetForm();
    }
  }

  resetForm(): void {
    this.newEmployee.set({ firstName: '', lastName: '', email: '', password: '' });
  }

  updateFormField(field: keyof CreateEmployeeRequestDto, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.newEmployee.update((emp) => ({ ...emp, [field]: value }));
  }

  createEmployee(): void {
    const emp = this.newEmployee();
    if (!emp.firstName || !emp.lastName || !emp.email || !emp.password) {
      this.toastService.i18nError('ADMIN.employees.error_required');
      return;
    }

    if (emp.password.length < 8) {
      this.toastService.i18nError('ADMIN.employees.error_password_min_length');
      return;
    }

    this.creating.set(true);
    this.adminService.createEmployee(emp).subscribe({
      next: (created) => {
        this.employees.update((list) => [...list, created]);
        this.toastService.i18nSuccess('ADMIN.employees.success_created');
        this.showCreateForm.set(false);
        this.resetForm();
        this.creating.set(false);
      },
      error: (err) => {
        const msg = err?.error?.message || err?.message || '';
        if (/password.*at least 8/i.test(msg)) {
          this.toastService.i18nError('ADMIN.employees.error_password_min_length');
        } else {
          this.toastService.error(msg || this.translate.instant('ADMIN.employees.error_create'));
        }
        this.creating.set(false);
      }
    });
  }

  suspendEmployee(userId: number): void {
    this.actingEmployeeId.set(userId);
    this.adminService.suspendEmployee(userId).subscribe({
      next: () => {
        this.employees.update((list) =>
          list.map((e) => (e.userId === userId ? { ...e, status: 'SUSPENDED' } : e))
        );
        this.toastService.i18nSuccess('ADMIN.employees.success_suspend');
        this.actingEmployeeId.set(null);
      },
      error: (err) => {
        this.toastService.error(err?.error?.message || err?.message || this.translate.instant('ADMIN.employees.error_suspend'));
        this.actingEmployeeId.set(null);
      }
    });
  }

  activateEmployee(userId: number): void {
    this.actingEmployeeId.set(userId);
    this.adminService.activateEmployee(userId).subscribe({
      next: () => {
        this.employees.update((list) =>
          list.map((e) => (e.userId === userId ? { ...e, status: 'ACTIVE' } : e))
        );
        this.toastService.i18nSuccess('ADMIN.employees.success_activate');
        this.actingEmployeeId.set(null);
      },
      error: (err) => {
        this.toastService.error(err?.error?.message || err?.message || this.translate.instant('ADMIN.employees.error_activate'));
        this.actingEmployeeId.set(null);
      }
    });
  }

  openDetail(userId: number): void {
    this.showDetailModal.set(true);
    this.loadingDetail.set(true);
    this.employeeDetail.set(null);

    this.adminService.getEmployeeDetail(userId).subscribe({
      next: (detail) => {
        this.employeeDetail.set(detail);
        this.loadingDetail.set(false);
      },
      error: () => this.loadingDetail.set(false)
    });
  }

  closeDetail(): void {
    this.showDetailModal.set(false);
    this.employeeDetail.set(null);
  }

  getStatusLabel(status: string): string {
    return this.translate.instant('STATUS.' + status);
  }

  getStatusBadgeClass(status: string): string {
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
    return new Date(dateStr).toLocaleDateString(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  trackByUserId(_index: number, employee: EmployeeListItemDto): number {
    return employee.userId;
  }
}
