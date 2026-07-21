import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../core/services/admin.service';

interface DashboardStats {
  totalCustomers: number;
  totalEmployees: number;
  totalAccounts: number;
  activeAccounts: number;
  frozenAccounts: number;
  pendingRegistrations: number;
  totalTransactions: number;
  totalBalance: number;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.css']
})
export class AdminDashboardComponent implements OnInit {
  stats = signal<DashboardStats | null>(null);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading.set(true);
    this.error.set(null);

    this.adminService.getDashboard().subscribe({
      next: (data) => {
        this.stats.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Errore nel caricamento della dashboard');
        this.loading.set(false);
        console.error('Dashboard error:', err);
      }
    });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  }

  formatNumber(value: number): string {
    return new Intl.NumberFormat('it-IT').format(value);
  }
}
