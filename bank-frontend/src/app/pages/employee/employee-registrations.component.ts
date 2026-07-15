import { Component, signal, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { EmployeeService } from '../../core/services/employee.service';
import { PendingRegistrationDto } from '../../core/models/user/pending-registration.dto';

@Component({
  selector: 'app-employee-registrations',
  imports: [DatePipe],
  templateUrl: './employee-registrations.html',
  styleUrl: './employee-registrations.css',
})
export class EmployeeRegistrationsComponent implements OnInit {
  registrations = signal<PendingRegistrationDto[]>([]);
  loading = signal(true);
  message = signal('');
  messageType = signal<'success' | 'error'>('success');

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
}
