import { Component, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { TranslatePipe, TranslateDirective } from '@ngx-translate/core';
import { EmployeeService } from '../../core/services/employee.service';

@Component({
  selector: 'app-employee-dashboard',
  imports: [RouterLink, DatePipe, TranslatePipe, TranslateDirective],
  templateUrl: './employee-dashboard.html',
  styleUrl: './employee-dashboard.css',
})
export class EmployeeDashboardComponent implements OnInit {
  pendingCount = signal(0);
  totalAccounts = signal(0);
  totalCustomers = signal(0);
  loading = signal(true);

  today = new Date();

  constructor(private employeeService: EmployeeService) {}

  ngOnInit(): void {
    this.employeeService.getPendingRegistrations().subscribe({
      next: (data) => {
        this.pendingCount.set(data.length);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });

    this.employeeService.getAccounts().subscribe({
      next: (data) => this.totalAccounts.set(data.length),
    });

    this.employeeService.getCustomers().subscribe({
      next: (data) => this.totalCustomers.set(data.length),
    });
  }
}
