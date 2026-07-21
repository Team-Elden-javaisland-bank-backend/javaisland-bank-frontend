import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe, TranslateDirective } from '@ngx-translate/core';
import { CustomerService } from '../../core/services/customer.service';
import { CustomerRequestDto } from '../../core/models/customer/customer-request.dto';

@Component({
  selector: 'app-customer-requests',
  imports: [CommonModule, TranslatePipe, TranslateDirective],
  templateUrl: './customer-requests.html',
  styleUrl: './customer-requests.css',
})
export class CustomerRequestsComponent {
  allRequests = signal<CustomerRequestDto[]>([]);
  loading = signal(true);
  activeTab = signal<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  error = signal('');

  readonly tabs: { key: 'PENDING' | 'APPROVED' | 'REJECTED'; labelKey: string; icon: string }[] = [
    { key: 'PENDING', labelKey: 'REQUESTS.tab_pending', icon: 'bi-hourglass-split' },
    { key: 'APPROVED', labelKey: 'REQUESTS.tab_approved', icon: 'bi-check-circle' },
    { key: 'REJECTED', labelKey: 'REQUESTS.tab_rejected', icon: 'bi-x-circle' },
  ];

  readonly requestTypeLabels: Record<string, string> = {
    PASSWORD_CHANGE: 'Cambio Password',
    ACCOUNT_OPENING: 'Apertura Conto',
    ACCOUNT_FROZEN: 'Congelamento Conto',
    ACCOUNT_CLOSURE: 'Chiusura Conto',
    CARD_BLOCKED: 'Blocco Carta',
  };

  readonly requestTypeIcons: Record<string, string> = {
    PASSWORD_CHANGE: 'bi-key',
    ACCOUNT_OPENING: 'bi-bank',
    ACCOUNT_FROZEN: 'bi-snow',
    ACCOUNT_CLOSURE: 'bi-door-closed',
    CARD_BLOCKED: 'bi-credit-card-2-front',
  };

  readonly filteredRequests = computed(() =>
    this.allRequests().filter((r) => r.status === this.activeTab())
  );

  readonly pendingCount = computed(
    () => this.allRequests().filter((r) => r.status === 'PENDING').length
  );

  readonly approvedCount = computed(
    () => this.allRequests().filter((r) => r.status === 'APPROVED').length
  );

  readonly rejectedCount = computed(
    () => this.allRequests().filter((r) => r.status === 'REJECTED').length
  );

  getCountForTab(tab: 'PENDING' | 'APPROVED' | 'REJECTED'): number {
    switch (tab) {
      case 'PENDING': return this.pendingCount();
      case 'APPROVED': return this.approvedCount();
      case 'REJECTED': return this.rejectedCount();
    }
  }

  constructor(private customerService: CustomerService) {
    this.loadRequests();
  }

  loadRequests(): void {
    this.loading.set(true);
    this.error.set('');
    this.customerService.getMyRequests().subscribe({
      next: (data) => {
        this.allRequests.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message || 'Errore nel caricamento delle richieste');
        this.loading.set(false);
      },
    });
  }

  setTab(tab: 'PENDING' | 'APPROVED' | 'REJECTED'): void {
    this.activeTab.set(tab);
  }

  getRequestTypeLabel(type: string): string {
    return this.requestTypeLabels[type] || type;
  }

  getRequestTypeIcon(type: string): string {
    return this.requestTypeIcons[type] || 'bi-question-circle';
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'PENDING': return 'REQUESTS.status_pending';
      case 'APPROVED': return 'REQUESTS.status_approved';
      case 'REJECTED': return 'REQUESTS.status_rejected';
      default: return status;
    }
  }
}
