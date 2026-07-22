import { Component, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { TranslatePipe, TranslateDirective } from '@ngx-translate/core';
import { EmployeeService } from '../../core/services/employee.service';
import { PendingRegistrationDto } from '../../core/models/user/pending-registration.dto';
import { EmployeeUserDetailDto } from '../../core/models/user/employee-user-detail.dto';

@Component({
  selector: 'app-employee-registrations',
  imports: [FormsModule, DatePipe, TranslatePipe, TranslateDirective],
  templateUrl: './employee-registrations.html',
  styleUrl: './employee-registrations.css',
})
export class EmployeeRegistrationsComponent implements OnInit {
  registrations = signal<PendingRegistrationDto[]>([]);
  loading = signal(true);
  message = signal('');
  messageType = signal<'success' | 'error'>('success');
  searchQuery = signal('');

  showModal = signal(false);
  userDetail = signal<EmployeeUserDetailDto | null>(null);
  loadingUserDetail = signal(false);

  filteredRegistrations = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return this.registrations();
    return this.registrations().filter(
      (r) =>
        r.firstName.toLowerCase().includes(query) ||
        r.lastName.toLowerCase().includes(query) ||
        r.email.toLowerCase().includes(query)
    );
  });

  constructor(private employeeService: EmployeeService) {}

  ngOnInit(): void {
    this.loadRegistrations();
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

  validate(userId: number): void {
    this.employeeService.validateRegistration(userId).subscribe({
      next: (res) => {
        this.message.set(res);
        this.messageType.set('success');
        this.loadRegistrations();
      },
      error: (err) => { this.message.set(err.message); this.messageType.set('error'); },
    });
  }

  reject(userId: number): void {
    if (!confirm('Vuoi rifiutare questa registrazione?')) return;

    this.employeeService.rejectRegistration(userId).subscribe({
      next: (res) => {
        this.message.set(res);
        this.messageType.set('success');
        this.loadRegistrations();
      },
      error: (err) => { this.message.set(err.message); this.messageType.set('error'); },
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
