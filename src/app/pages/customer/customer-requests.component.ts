import { ChangeDetectionStrategy, Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe, TranslateDirective, TranslateService } from '@ngx-translate/core';
import { CustomerService } from '../../core/services/customer.service';
import { CustomerRequestDto } from '../../core/models/customer/customer-request.dto';

@Component({
  selector: 'app-customer-requests',
  imports: [CommonModule, TranslatePipe, TranslateDirective],
  templateUrl: './customer-requests.html',
  styleUrl: './customer-requests.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerRequestsComponent {
  allRequests = signal<CustomerRequestDto[]>([]);
  loading = signal(true);
  activeTab = signal<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  errorKey = signal<string | null>(null);

  readonly tabs: { key: 'PENDING' | 'APPROVED' | 'REJECTED'; labelKey: string; icon: string }[] = [
    { key: 'PENDING', labelKey: 'REQUESTS.tab_pending', icon: 'bi-hourglass-split' },
    { key: 'APPROVED', labelKey: 'REQUESTS.tab_approved', icon: 'bi-check-circle' },
    { key: 'REJECTED', labelKey: 'REQUESTS.tab_rejected', icon: 'bi-x-circle' },
  ];

  readonly requestTypeLabels: Record<string, string> = {
    PASSWORD_CHANGE: 'REQUEST_TYPE.PASSWORD_CHANGE',
    ACCOUNT_OPENING: 'REQUEST_TYPE.ACCOUNT_OPENING',
    ACCOUNT_FROZEN: 'REQUEST_TYPE.ACCOUNT_FROZEN',
    ACCOUNT_CLOSURE: 'REQUEST_TYPE.ACCOUNT_CLOSURE',
    CARD_BLOCKED: 'REQUEST_TYPE.CARD_BLOCKED',
    LIMIT_CHANGE: 'REQUEST_TYPE.LIMIT_CHANGE',
  };

  readonly requestDescKeys: Record<string, string> = {
    PASSWORD_CHANGE: 'REQUEST_TYPE.PASSWORD_CHANGE_DESC',
    ACCOUNT_OPENING: 'REQUEST_TYPE.ACCOUNT_OPENING_DESC',
    ACCOUNT_FROZEN: 'REQUEST_TYPE.ACCOUNT_FROZEN_DESC',
    ACCOUNT_CLOSURE: 'REQUEST_TYPE.ACCOUNT_CLOSURE_DESC',
    CARD_BLOCKED: 'REQUEST_TYPE.CARD_BLOCKED_DESC',
    LIMIT_CHANGE: 'REQUEST_TYPE.LIMIT_CHANGE_DESC',
  };

  readonly requestTypeIcons: Record<string, string> = {
    PASSWORD_CHANGE: 'bi-key',
    ACCOUNT_OPENING: 'bi-bank',
    ACCOUNT_FROZEN: 'bi-snow',
    ACCOUNT_CLOSURE: 'bi-door-closed',
    CARD_BLOCKED: 'bi-credit-card-2-front',
    LIMIT_CHANGE: 'bi-speedometer',
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

  constructor(private customerService: CustomerService, private translate: TranslateService) {
    this.loadRequests();
  }

  loadRequests(): void {
    this.loading.set(true);
    this.errorKey.set(null);
    this.customerService.getMyRequests().subscribe({
      next: (data) => {
        this.allRequests.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.errorKey.set(err.message || 'REQUESTS.loading');
        this.loading.set(false);
      },
    });
  }

  setTab(tab: 'PENDING' | 'APPROVED' | 'REJECTED'): void {
    this.activeTab.set(tab);
  }

  getRequestTypeLabel(type: string): string {
    const key = this.requestTypeLabels[type];
    return key ? this.translate.instant(key) : type;
  }

  getRequestDescription(type: string): string {
    const key = this.requestDescKeys[type];
    return key ? this.translate.instant(key) : type;
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
