import { Component, signal, OnInit } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TranslatePipe, TranslateDirective, TranslateService } from '@ngx-translate/core';
import { CustomerService } from '../../core/services/customer.service';
import { AccountResponseDto } from '../../core/models/account/account-response.dto';
import { AccountLimitResponseDto } from '../../core/models/account/account-limit-response.dto';
import { BeneficiaryResponseDto } from '../../core/models/beneficiary/beneficiary-response.dto';
import { PinConfirmModalComponent } from '../../shared/pin-confirm-modal/pin-confirm-modal.component';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-customer-operations',
  imports: [CurrencyPipe, FormsModule, TranslatePipe, TranslateDirective, PinConfirmModalComponent],
  templateUrl: './customer-operations.html',
  styleUrl: './customer-operations.css',
})
export class CustomerOperationsComponent implements OnInit {
  accounts = signal<AccountResponseDto[]>([]);
  beneficiaries = signal<BeneficiaryResponseDto[]>([]);
  accountLimits = signal<AccountLimitResponseDto[]>([]);
  loading = signal(true);
  activeTab = signal<'deposit' | 'withdraw' | 'transfer'>('deposit');

  dwAccount = '';
  dwAmount: number | null = null;

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

  private validateAmount(value: number | null, min: number, max: number | null): string | null {
    if (value === null || value === undefined) {
      return this.translate.instant('TRANSACTIONS.insert_amount');
    }
    if (value < min) {
      return this.translate.instant('TRANSACTIONS.min_amount_error', { value: min.toFixed(2) });
    }
    if (max !== null && value > max) {
      return this.translate.instant('TRANSACTIONS.max_amount_error', { value: max.toFixed(2) });
    }
    return null;
  }

  private extractError(err: any): string {
    return err?.error?.message || err?.message || 'An error occurred. Please try again later.';
  }

  deposit(): void {
    const err = this.validateAmount(this.dwAmount, 0.01, null);
    if (err) { this.toastService.error(err); return; }

    this.customerService.deposit({ accountNumber: this.dwAccount, amount: this.dwAmount! }).subscribe({
      next: (res) => { this.toastService.success(res.message); this.dwAmount = null; },
      error: (err) => this.toastService.error(this.extractError(err)),
    });
  }

  withdraw(): void {
    const err = this.validateAmount(this.dwAmount, 10, null);
    if (err) { this.toastService.error(err); return; }

    const atmLimit = this.getLimitValue('ATM_WITHDRAWAL');
    if (atmLimit !== null && this.dwAmount! > atmLimit) {
      this.toastService.error(this.translate.instant('TRANSACTIONS.atm_limit_exceeded', { value: atmLimit.toFixed(2) }));
      return;
    }
    this.pinAction.set('withdraw');
    this.showPinModal.set(true);
  }

  executeWithdraw(): void {
    this.customerService.withdraw({ accountNumber: this.dwAccount, amount: this.dwAmount! }).subscribe({
      next: (res) => { this.toastService.success(res.message); this.dwAmount = null; },
      error: (err) => this.toastService.error(this.extractError(err)),
    });
  }

  transfer(): void {
    const err = this.validateAmount(this.txAmount, 1, null);
    if (err) { this.toastService.error(err); return; }

    if (!this.txDestination && !this.txBeneficiaryId) {
      this.toastService.error(this.translate.instant('TRANSACTIONS.select_destination'));
      return;
    }

    if (this.txDestination) {
      const isOwnAccount = this.accounts().some(a => a.accountNumber === this.txDestination);
      if (isOwnAccount) {
        this.toastService.error(this.translate.instant('TRANSACTIONS.own_account_error'));
        return;
      }
    }

    const isInstant = this.txTransferType() === 'instant';

    if (!isInstant && !this.txScheduledDate) {
      this.toastService.error(this.translate.instant('TRANSACTIONS.select_date'));
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
        this.toastService.error(this.translate.instant('TRANSACTIONS.date_must_be_tomorrow'));
        return;
      }
      if (scheduled > maxDate) {
        this.toastService.error(this.translate.instant('TRANSACTIONS.date_max_30_days'));
        return;
      }
    }

    const limitType = isInstant ? 'INSTANT_TRANSFER_SINGLE' : 'SINGLE_TRANSFER';
    const singleLimit = this.getLimitValue(limitType);
    if (singleLimit !== null && this.txAmount! > singleLimit) {
      const label = isInstant ? this.translate.instant('TRANSACTIONS.instant_transfer') : this.translate.instant('TRANSACTIONS.normal_transfer');
      this.toastService.error(this.translate.instant('TRANSACTIONS.transfer_limit_exceeded', { label, value: singleLimit.toFixed(2) }));
      return;
    }

    this.pinAction.set('transfer');
    this.showPinModal.set(true);
  }

  executeTransfer(): void {
    const isInstant = this.txTransferType() === 'instant';
    this.customerService.transfer({
      sourceAccountNumber: this.txSource,
      destinationAccountNumber: this.txDestination || '',
      beneficiaryId: this.txBeneficiaryId,
      amount: this.txAmount!,
      description: this.txDescription,
      isInstant,
      scheduledDate: isInstant ? null : this.txScheduledDate,
    }).subscribe({
      next: () => {
        const msg = isInstant
          ? this.translate.instant('TRANSACTIONS.instant_sent')
          : this.translate.instant('TRANSACTIONS.scheduled_sent');
        this.toastService.success(msg);
        this.txAmount = null;
        this.txDescription = '';
        this.txDestination = '';
        this.txBeneficiaryId = null;
        this.txScheduledDate = '';
      },
      error: (err) => this.toastService.error(this.extractError(err)),
    });
  }

  onPinConfirmed(): void {
    this.showPinModal.set(false);
    const action = this.pinAction();
    this.pinAction.set(null);
    if (action === 'transfer') this.executeTransfer();
    if (action === 'withdraw') this.executeWithdraw();
  }

  onPinCancelled(): void {
    this.showPinModal.set(false);
    this.pinAction.set(null);
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
