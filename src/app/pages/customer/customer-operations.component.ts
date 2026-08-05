import { ChangeDetectionStrategy, Component, signal, OnInit } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TranslatePipe, TranslateDirective, TranslateService } from '@ngx-translate/core';
import { ApiUrlPipe } from '../../shared/pipes/api-url.pipe';
import { CustomerService } from '../../core/services/customer.service';
import { AccountResponseDto } from '../../core/models/account/account-response.dto';
import { AccountLimitResponseDto } from '../../core/models/account/account-limit-response.dto';
import { BeneficiaryResponseDto } from '../../core/models/beneficiary/beneficiary-response.dto';
import { PinConfirmModalComponent } from '../../shared/pin-confirm-modal/pin-confirm-modal.component';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-customer-operations',
  imports: [CurrencyPipe, FormsModule, TranslatePipe, TranslateDirective, PinConfirmModalComponent, ApiUrlPipe],
  templateUrl: './customer-operations.html',
  styleUrl: './customer-operations.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerOperationsComponent implements OnInit {
  accounts = signal<AccountResponseDto[]>([]);
  beneficiaries = signal<BeneficiaryResponseDto[]>([]);
  accountLimits = signal<AccountLimitResponseDto[]>([]);
  loading = signal(true);
  activeTab = signal<'deposit' | 'withdraw' | 'transfer'>('deposit');

  readonly atmQuickAmounts = [10, 20, 50, 100, 150, 250];
  dwAccount = '';
  dwAmount: number | null = null;
  dwAmountError = signal<string | null>(null);
  dwAmountTouched = signal(false);

  isDwAmountValid(): boolean {
    const v = this.dwAmount;
    if (v === null || v === undefined) return false;
    return v >= 10 && v % 10 === 0;
  }

  txSource = '';
  txDestination = '';
  txAmount: number | null = null;
  txDescription = '';
  txBeneficiaryId: number | null = null;
  txTransferType = signal<'normal' | 'instant'>('normal');
  txScheduledDate = '';
  today = '';
  maxScheduleDate = '';

  showPinModal = signal(false);
  pinAction = signal<'transfer' | 'withdraw' | null>(null);
  confirmedPin = signal<string | null>(null);

  constructor(
    private customerService: CustomerService,
    private translate: TranslateService,
    private toastService: ToastService,
    private route: ActivatedRoute,
  ) {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    this.today = tomorrow.toISOString().split('T')[0];
    const maxDate = new Date(tomorrow);
    maxDate.setDate(maxDate.getDate() + 29);
    this.maxScheduleDate = maxDate.toISOString().split('T')[0];
  }

  ngOnInit(): void {
    const tabParam = this.route.snapshot.queryParamMap.get('tab');
    if (tabParam && ['deposit', 'withdraw', 'transfer'].includes(tabParam)) {
      this.activeTab.set(tabParam as 'deposit' | 'withdraw' | 'transfer');
    }

    this.customerService.getAccounts().subscribe({
      next: (data) => {
        this.accounts.set(data.filter(a => a.statusId !== 4));
        if (data.length > 0) {
          this.dwAccount = data[0].accountNumber;
          this.txSource = data[0].accountNumber;
          this.loadLimits(data[0].accountNumber);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });

    this.customerService.getBeneficiaries().subscribe({
      next: (data) => this.beneficiaries.set(data),
    });
  }

  onAccountChange(): void {
    if (this.dwAccount) this.loadLimits(this.dwAccount);
  }

  onSourceChange(): void {
    if (this.txSource) this.loadLimits(this.txSource);
  }

  private loadLimits(accountNumber: string): void {
    this.customerService.getAccountLimits(accountNumber).subscribe({
      next: (data) => this.accountLimits.set(data),
    });
  }

  getLimitValue(typeName: string): number | null {
    const limit = this.accountLimits().find(l => l.limitType === typeName);
    return limit ? Number(limit.maxAmount) : null;
  }

  private validateAmount(value: number | null, min: number, max: number | null): { key: string; params: Record<string, any> } | null {
    if (value === null || value === undefined) {
      return { key: 'TRANSACTIONS.insert_amount', params: {} };
    }
    if (value < min) {
      return { key: 'TRANSACTIONS.min_amount_error', params: { value: min.toFixed(2) } };
    }
    if (max !== null && value > max) {
      return { key: 'TRANSACTIONS.max_amount_error', params: { value: max.toFixed(2) } };
    }
    return null;
  }

  private refreshAccounts(): void {
    this.customerService.getAccounts().subscribe({
      next: (data) => {
        this.accounts.set(data.filter(a => a.statusId !== 4));
        if (this.dwAccount) this.loadLimits(this.dwAccount);
      },
    });
  }

  private extractError(err: any): string {
    return err?.error?.message || err?.message || '';
  }

  selectAtmAmount(amount: number): void {
    this.dwAmount = amount;
    this.dwAmountTouched.set(true);
    this.validateAtmAmount();
  }

  onDwAmountChange(): void {
    this.dwAmountTouched.set(true);
    this.validateAtmAmount();
  }

  private validateAtmAmount(): void {
    const v = this.dwAmount;
    if (v === null || v === undefined) {
      this.dwAmountError.set(null);
      return;
    }
    if (v < 10) {
      this.dwAmountError.set('TRANSACTIONS.atm_invalid_amount');
    } else if (v % 10 !== 0) {
      this.dwAmountError.set('TRANSACTIONS.atm_invalid_amount');
    } else {
      this.dwAmountError.set(null);
    }
  }

  deposit(): void {
    const err = this.validateAmount(this.dwAmount, 0.01, null);
    if (err) { this.toastService.i18nError(err.key, err.params); return; }

    this.customerService.deposit({ accountNumber: this.dwAccount, amount: this.dwAmount! }).subscribe({
      next: () => {
        this.toastService.i18nSuccess('TRANSACTIONS.deposit_success', { amount: Number(this.dwAmount).toFixed(2) });
        this.dwAmount = null;
        this.dwAmountError.set(null);
        this.dwAmountTouched.set(false);
        this.refreshAccounts();
      },
      error: (err) => this.toastService.error(this.extractError(err)),
    });
  }

  withdraw(): void {
    this.dwAmountTouched.set(true);
    this.validateAtmAmount();
    if (!this.isDwAmountValid()) return;

    const atmLimit = this.getLimitValue('ATM_WITHDRAWAL');
    if (atmLimit !== null && this.dwAmount! > atmLimit) {
      this.toastService.i18nError('TRANSACTIONS.atm_limit_exceeded', { value: atmLimit.toFixed(2) });
      return;
    }
    this.pinAction.set('withdraw');
    this.showPinModal.set(true);
  }

  executeWithdraw(): void {
    this.customerService.withdraw({ accountNumber: this.dwAccount, amount: this.dwAmount!, pin: this.confirmedPin()! }).subscribe({
      next: () => {
        this.toastService.i18nSuccess('TRANSACTIONS.withdraw_success', { amount: Number(this.dwAmount).toFixed(2) });
        this.dwAmount = null;
        this.dwAmountError.set(null);
        this.dwAmountTouched.set(false);
        this.confirmedPin.set(null);
        this.refreshAccounts();
      },
      error: (err) => {
        this.confirmedPin.set(null);
        this.toastService.error(this.extractError(err));
      },
    });
  }

  transfer(): void {
    const isInternal = this.isInternalTransfer();
    const err = this.validateAmount(this.txAmount, isInternal ? 0.01 : 1, null);
    if (err) { this.toastService.i18nError(err.key, err.params); return; }

    if (!this.txDestination && !this.txBeneficiaryId) {
      this.toastService.i18nError('TRANSACTIONS.select_destination');
      return;
    }

    if (this.txDestination) {
      if (this.txDestination === this.txSource) {
        this.toastService.i18nError('TRANSACTIONS.own_account_error');
        return;
      }
    }

    const isInstant = this.txTransferType() === 'instant';

    if (!isInstant && !this.txScheduledDate) {
      this.toastService.i18nError('TRANSACTIONS.select_date');
      return;
    }

    if (!isInstant) {
      const scheduled = new Date(this.txScheduledDate);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const maxDate = new Date(tomorrow);
      maxDate.setDate(maxDate.getDate() + 29);

      if (scheduled <= new Date()) {
        this.toastService.i18nError('TRANSACTIONS.date_must_be_tomorrow');
        return;
      }
      if (scheduled > maxDate) {
        this.toastService.i18nError('TRANSACTIONS.date_max_30_days');
        return;
      }
    }

    const limitType = isInstant ? 'INSTANT_TRANSFER_SINGLE' : 'SINGLE_TRANSFER';
    const singleLimit = this.getLimitValue(limitType);
    if (!isInternal && singleLimit !== null && this.txAmount! > singleLimit) {
      this.toastService.i18nError('TRANSACTIONS.transfer_limit_exceeded', { label: isInstant ? 'TRANSACTIONS.instant_transfer' : 'TRANSACTIONS.normal_transfer', value: singleLimit.toFixed(2) });
      return;
    }

    this.pinAction.set('transfer');
    this.showPinModal.set(true);
  }

  isInternalTransfer(): boolean {
    return !!this.txDestination && this.accounts().some(a => a.accountNumber === this.txDestination);
  }

  executeTransfer(): void {
    const isInstant = this.txTransferType() === 'instant';
    this.customerService.transfer({
      sourceAccountNumber: this.txSource,
      destinationAccountNumber: this.txDestination || '',
      beneficiaryId: this.txBeneficiaryId,
      amount: this.txAmount!,
      pin: this.confirmedPin()!,
      description: this.txDescription,
      isInstant,
      scheduledDate: isInstant ? null : this.txScheduledDate,
    }).subscribe({
      next: () => {
        if (isInstant) {
          this.toastService.i18nSuccess('TRANSACTIONS.instant_sent');
        } else {
          this.toastService.i18nSuccess('TRANSACTIONS.scheduled_sent');
        }
        this.txAmount = null;
        this.txDescription = '';
        this.txDestination = '';
        this.txBeneficiaryId = null;
        this.txScheduledDate = '';
        this.confirmedPin.set(null);
      },
      error: (err) => {
        this.confirmedPin.set(null);
        this.toastService.error(this.extractError(err));
      },
    });
  }

  onPinConfirmed(pin: string): void {
    this.showPinModal.set(false);
    this.confirmedPin.set(pin);
    const action = this.pinAction();
    this.pinAction.set(null);
    if (action === 'transfer') this.executeTransfer();
    if (action === 'withdraw') this.executeWithdraw();
  }

  onPinCancelled(): void {
    this.showPinModal.set(false);
    this.pinAction.set(null);
    this.confirmedPin.set(null);
  }

  toggleBeneficiary(id: number, accountNumber: string): void {
    if (this.txBeneficiaryId === id) {
      this.txBeneficiaryId = null;
      this.txDestination = '';
    } else {
      this.txBeneficiaryId = id;
      this.txDestination = accountNumber;
    }
  }
}
