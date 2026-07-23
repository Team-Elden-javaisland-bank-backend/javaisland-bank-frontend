import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateDirective, TranslateService } from '@ngx-translate/core';
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
  imports: [CommonModule, RouterLink, TranslatePipe, TranslateDirective],
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.css']
})
export class AdminDashboardComponent implements OnInit {
  stats = signal<DashboardStats | null>(null);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  today = new Date();

  activeRate = computed(() => {
    const s = this.stats();
    if (!s || s.totalAccounts === 0) return '0';
    return ((s.activeAccounts / s.totalAccounts) * 100).toFixed(1);
  });

  avgBalance = computed(() => {
    const s = this.stats();
    if (!s || s.totalAccounts === 0) return this.formatCurrency(0);
    return this.formatCurrency(s.totalBalance / s.totalAccounts);
  });

  txPerAccount = computed(() => {
    const s = this.stats();
    if (!s || s.totalAccounts === 0) return '0';
    return (s.totalTransactions / s.totalAccounts).toFixed(1);
  });

  constructor(private adminService: AdminService, private translate: TranslateService) {}

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
        this.error.set(this.translate.instant('ADMIN.dashboard.error_load'));
        this.loading.set(false);
        console.error('Dashboard error:', err);
      }
    });
  }

  formatCurrency(value: number): string {
    const locale = this.translate.currentLang() === 'it' ? 'it-IT' : 'en-GB';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  }

  formatNumber(value: number): string {
    const locale = this.translate.currentLang() === 'it' ? 'it-IT' : 'en-GB';
    return new Intl.NumberFormat(locale).format(value);
  }
}
