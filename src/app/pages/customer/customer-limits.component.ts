import { Component, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateDirective } from '@ngx-translate/core';
import { CustomerService } from '../../core/services/customer.service';
import { AccountResponseDto } from '../../core/models/account/account-response.dto';
import { AccountLimitResponseDto } from '../../core/models/account/account-limit-response.dto';

interface LimitMeta {
  type: string;
  labelKey: string;
  descriptionKey: string;
  defaultValue: number;
  minValue: number;
  maxValue: number;
}

@Component({
  selector: 'app-customer-limits',
  imports: [CurrencyPipe, DatePipe, FormsModule, TranslatePipe, TranslateDirective],
  templateUrl: './customer-limits.html',
  styleUrl: './customer-limits.css',
})
export class CustomerLimitsComponent {
  accounts = signal<AccountResponseDto[]>([]);
  selectedAccount = signal('');
  limits = signal<AccountLimitResponseDto[]>([]);
  loading = signal(true);
  limitsLoading = signal(false);
  message = signal('');
  messageType = signal<'success' | 'error'>('success');

  editingType = signal('');
  editingError = signal('');
  editAmount = 0;

  allLimitTypes: LimitMeta[] = [
    { type: 'ATM_WITHDRAWAL', labelKey: 'LIMIT_TYPE.ATM_WITHDRAWAL.label', descriptionKey: 'LIMIT_TYPE.ATM_WITHDRAWAL.description', defaultValue: 300, minValue: 10, maxValue: 300 },
    { type: 'POS_SPENDING', labelKey: 'LIMIT_TYPE.POS_SPENDING.label', descriptionKey: 'LIMIT_TYPE.POS_SPENDING.description', defaultValue: 2500, minValue: 0.10, maxValue: 2500 },
    { type: 'DAILY_TRANSFER', labelKey: 'LIMIT_TYPE.DAILY_TRANSFER.label', descriptionKey: 'LIMIT_TYPE.DAILY_TRANSFER.description', defaultValue: 15000, minValue: 1, maxValue: 15000 },
    { type: 'SINGLE_TRANSFER', labelKey: 'LIMIT_TYPE.SINGLE_TRANSFER.label', descriptionKey: 'LIMIT_TYPE.SINGLE_TRANSFER.description', defaultValue: 10000, minValue: 1, maxValue: 10000 },
    { type: 'INSTANT_TRANSFER_SINGLE', labelKey: 'LIMIT_TYPE.INSTANT_TRANSFER_SINGLE.label', descriptionKey: 'LIMIT_TYPE.INSTANT_TRANSFER_SINGLE.description', defaultValue: 5000, minValue: 1, maxValue: 5000 },
    { type: 'MONTHLY_TRANSFER', labelKey: 'LIMIT_TYPE.MONTHLY_TRANSFER.label', descriptionKey: 'LIMIT_TYPE.MONTHLY_TRANSFER.description', defaultValue: 50000, minValue: 1, maxValue: 50000 },
  ];

  constructor(private customerService: CustomerService) {
    this.customerService.getAccounts().subscribe({
      next: (data) => {
        this.accounts.set(data.filter(a => a.statusId === 2));
        this.loading.set(false);
        if (this.accounts().length === 1) {
          this.onAccountChange(this.accounts()[0].accountNumber);
        }
      },
      error: () => this.loading.set(false),
    });
  }

  onAccountChange(accountNumber: string): void {
    this.selectedAccount.set(accountNumber);
    this.message.set('');
    this.editingType.set('');
    if (!accountNumber) { this.limits.set([]); return; }
    this.limitsLoading.set(true);
    this.customerService.getAccountLimits(accountNumber).subscribe({
      next: (data) => { this.limits.set(data); this.limitsLoading.set(false); },
      error: () => this.limitsLoading.set(false),
    });
  }

  getLimitForType(type: string): AccountLimitResponseDto | undefined {
    return this.limits().find(l => l.limitType === type);
  }

  canEdit(type: string): boolean {
    const limit = this.getLimitForType(type);
    if (!limit) return true;
    return limit.changePolicy !== 'BANK_ONLY';
  }

  canIncrease(type: string): boolean {
    const limit = this.getLimitForType(type);
    if (!limit) return true;
    return limit.changePolicy === 'USER_FULL';
  }

  getLimitIcon(type: string): string {
    const icons: Record<string, string> = {
      'ATM_WITHDRAWAL': 'bi bi-cash-stack',
      'POS_SPENDING': 'bi bi-credit-card-2-front',
      'DAILY_TRANSFER': 'bi bi-arrow-left-right',
      'SINGLE_TRANSFER': 'bi bi-send',
      'INSTANT_TRANSFER_SINGLE': 'bi bi-lightning',
      'MONTHLY_TRANSFER': 'bi bi-calendar-month',
    };
    return icons[type] || 'bi bi-speedometer';
  }

  getPolicyLabel(type: string): string {
    const limit = this.getLimitForType(type);
    if (!limit) return '';
    switch (limit.changePolicy) {
      case 'USER_FULL': return 'Modificabile';
      case 'USER_LOWER_ONLY': return 'Solo abbassamento';
      case 'BANK_ONLY': return 'Solo banca';
      default: return '';
    }
  }

  startEdit(type: string, currentAmount: number): void {
    const meta = this.allLimitTypes.find(m => m.type === type);
    this.editingType.set(type);
    this.editingError.set('');
    this.editAmount = currentAmount || meta?.defaultValue || 0;
  }

  cancelEdit(): void { this.editingType.set(''); this.editingError.set(''); }

  saveLimit(type: string): void {
    const meta = this.allLimitTypes.find(m => m.type === type);
    if (this.editAmount < (meta?.minValue ?? 0)) {
      this.editingError.set(`Minimo €${meta?.minValue ?? 0}`);
      return;
    }

    if (meta && this.editAmount > meta.maxValue) {
      this.editingError.set(`Massimo €${meta.maxValue.toLocaleString('it-IT')}`);
      return;
    }

    const current = this.getLimitForType(type);
    if (current && !this.canIncrease(type) && this.editAmount > current.maxAmount) {
      this.editingError.set('Puoi solo abbassare');
      return;
    }

    this.editingError.set('');
    this.customerService.setAccountLimit(this.selectedAccount(), type, {
      maxAmount: this.editAmount,
    }).subscribe({
      next: () => {
        this.message.set('Limite aggiornato!');
        this.messageType.set('success');
        this.editingType.set('');
        this.onAccountChange(this.selectedAccount());
      },
      error: (err) => { this.message.set(err.message); this.messageType.set('error'); },
    });
  }
}
