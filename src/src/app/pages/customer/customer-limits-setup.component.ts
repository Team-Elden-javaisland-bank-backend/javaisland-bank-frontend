import { Component, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CustomerService } from '../../core/services/customer.service';
import { AuthService } from '../../core/services/auth.service';
import { AccountResponseDto } from '../../core/models/account/account-response.dto';
import { AccountLimitResponseDto } from '../../core/models/account/account-limit-response.dto';

interface LimitMeta {
  type: string;
  label: string;
  description: string;
  policy: 'USER_FULL' | 'USER_LOWER_ONLY' | 'BANK_ONLY';
  policyLabel: string;
  policyColor: string;
  defaultValue: number;
  minValue: number;
  maxValue: number;
}

@Component({
  selector: 'app-customer-limits-setup',
  imports: [CurrencyPipe, FormsModule],
  templateUrl: './customer-limits-setup.html',
  styleUrl: './customer-limits-setup.css',
})
export class CustomerLimitsSetupComponent {
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
    { type: 'ATM_WITHDRAWAL', label: 'Prelievo ATM', description: 'Massimo prelievo per transazione ATM al bancomat', policy: 'USER_FULL', policyLabel: 'Modificabile', policyColor: '#065f46', defaultValue: 300, minValue: 10, maxValue: 300 },
    { type: 'POS_SPENDING', label: 'Spesa POS', description: 'Massima spesa per transazione POS con carta', policy: 'USER_FULL', policyLabel: 'Modificabile', policyColor: '#065f46', defaultValue: 2500, minValue: 0.10, maxValue: 2500 },
    { type: 'DAILY_TRANSFER', label: 'Bonifico Giornaliero', description: 'Massimo trasferimento cumulativo al giorno', policy: 'USER_LOWER_ONLY', policyLabel: 'Solo abbassamento', policyColor: '#92400e', defaultValue: 15000, minValue: 1, maxValue: 15000 },
    { type: 'SINGLE_TRANSFER', label: 'Bonifico Singolo', description: 'Massimo importo per singolo bonifico', policy: 'USER_LOWER_ONLY', policyLabel: 'Solo abbassamento', policyColor: '#92400e', defaultValue: 10000, minValue: 1, maxValue: 10000 },
    { type: 'INSTANT_TRANSFER_SINGLE', label: 'Bonifico Istantaneo', description: 'Massimo importo per bonifico istantaneo', policy: 'BANK_ONLY', policyLabel: 'Solo banca', policyColor: '#991b1b', defaultValue: 5000, minValue: 1, maxValue: 5000 },
    { type: 'MONTHLY_TRANSFER', label: 'Movimenti Mensili', description: 'Massimo totale movimentato nell\'arco di un mese', policy: 'BANK_ONLY', policyLabel: 'Solo banca', policyColor: '#991b1b', defaultValue: 50000, minValue: 1, maxValue: 50000 },
  ];

  constructor(
    private customerService: CustomerService,
    private authService: AuthService,
    private router: Router,
  ) {
    this.customerService.getAccounts().subscribe({
      next: (data) => {
        this.accounts.set(data.filter(a => a.statusId === 2));
        this.loading.set(false);
        if (this.accounts().length > 0) {
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
    return true;
  }

  canIncrease(type: string): boolean {
    const meta = this.allLimitTypes.find(m => m.type === type);
    return meta?.policy === 'USER_FULL';
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

    this.editingError.set('');
    this.customerService.setAccountLimit(this.selectedAccount(), type, {
      maxAmount: this.editAmount,
    }).subscribe({
      next: () => {
        this.message.set('Limite salvato!');
        this.messageType.set('success');
        this.editingType.set('');
        this.onAccountChange(this.selectedAccount());
      },
      error: (err) => { this.message.set(err.message); this.messageType.set('error'); },
    });
  }

  completeSetup(): void {
    this.customerService.completeLimitsSetup().subscribe({
      next: () => {
        const user = this.authService.getUser();
        if (user) {
          user.limitsSetupComplete = true;
          localStorage.setItem('auth_user', JSON.stringify(user));
        }
        this.router.navigate(['/customer/dashboard']);
      },
      error: (err) => { this.message.set(err.message); this.messageType.set('error'); },
    });
  }
}
