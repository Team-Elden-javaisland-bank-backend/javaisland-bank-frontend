import { Component, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { TranslatePipe, TranslateDirective } from '@ngx-translate/core';
import { EmployeeService } from '../../core/services/employee.service';
import { PendingRegistrationDto } from '../../core/models/user/pending-registration.dto';
import { EmployeeUserDetailDto } from '../../core/models/user/employee-user-detail.dto';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-employee-registrations',
  imports: [FormsModule, DatePipe, TranslatePipe, TranslateDirective],
  templateUrl: './employee-registrations.html',
  styleUrl: './employee-registrations.css',
})
export class EmployeeRegistrationsComponent implements OnInit {
  activeTab = signal<'pending' | 'refused'>('pending');

  registrations = signal<PendingRegistrationDto[]>([]);
  refusedRegistrations = signal<PendingRegistrationDto[]>([]);

  loading = signal(true);
  searchQuery = signal('');

  showModal = signal(false);
  userDetail = signal<EmployeeUserDetailDto | null>(null);
  loadingUserDetail = signal(false);

  filteredRegistrations = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const list = this.activeTab() === 'pending' ? this.registrations() : this.refusedRegistrations();
    if (!query) return list;
    return list.filter(
      (r) =>
        r.firstName.toLowerCase().includes(query) ||
        r.lastName.toLowerCase().includes(query) ||
        r.email.toLowerCase().includes(query)
    );
  });

  constructor(private employeeService: EmployeeService, private toastService: ToastService) {}

  ngOnInit(): void {
    this.loadRegistrations();
    this.loadRefusedRegistrations();
  }

  switchTab(tab: 'pending' | 'refused'): void {
    this.activeTab.set(tab);
    this.searchQuery.set('');
  }

  loadRegistrations(): void {
    this.employeeService.getPendingRegistrations().subscribe({
      next: (data) => {
        this.registrations.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  loadRefusedRegistrations(): void {
    this.employeeService.getRefusedRegistrations().subscribe({
      next: (data) => this.refusedRegistrations.set(data),
      error: () => {},
    });
  }

  validate(userId: number): void {
    this.employeeService.validateRegistration(userId).subscribe({
      next: (res) => {
        this.toastService.success(res);
        this.loadRegistrations();
      },
      error: (err) => this.toastService.error(err?.error?.message || err?.message),
    });
  }

  reject(userId: number): void {
    if (!confirm('Vuoi rifiutare questa registrazione?')) return;

    this.employeeService.rejectRegistration(userId).subscribe({
      next: (res) => {
        this.toastService.success(res);
        this.loadRegistrations();
        this.loadRefusedRegistrations();
      },
      error: (err) => this.toastService.error(err?.error?.message || err?.message),
    });
  }

  reopen(userId: number): void {
    if (!confirm('Vuoi riaprire questa registrazione?')) return;

    this.employeeService.reopenRegistration(userId).subscribe({
      next: (res) => {
        this.toastService.success(res);
        this.loadRegistrations();
        this.loadRefusedRegistrations();
      },
      error: (err) => this.toastService.error(err?.error?.message || err?.message),
    });
  }

  deleteUser(userId: number): void {
    if (!confirm('Vuoi eliminare questo utente e il conto associato? Questa azione è irreversibile.')) return;

    this.employeeService.deleteUser(userId).subscribe({
      next: (res) => {
        this.toastService.success(res);
        this.loadRefusedRegistrations();
      },
      error: (err) => this.toastService.error(err?.error?.message || err?.message),
    });
  }

  openUserDetail(userId: number): void {
    this.showModal.set(true);
    this.loadingUserDetail.set(true);
    this.userDetail.set(null);

    this.employeeService.getUserDetailByUserId(userId).subscribe({
      next: (detail) => {
        this.userDetail.set(detail);
        this.loadingUserDetail.set(false);
      },
      error: () => this.loadingUserDetail.set(false),
    });
  }

  closeModal(): void {
    this.showModal.set(false);
    this.userDetail.set(null);
  }
}
