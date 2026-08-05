import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { CustomerService } from '../../core/services/customer.service';
import { AccountResponseDto } from '../../core/models/account/account-response.dto';
import { ToastService } from '../../core/services/toast.service';
import { PinConfirmModalComponent } from '../../shared/pin-confirm-modal/pin-confirm-modal.component';

@Component({
  selector: 'app-customer-accounts',
  imports: [CurrencyPipe, DatePipe, FormsModule, RouterLink, TranslatePipe, PinConfirmModalComponent],
  templateUrl: './customer-accounts.html',
  styleUrl: './customer-accounts.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerAccountsComponent {
  accounts = signal<AccountResponseDto[]>([]);
  loading = signal(true);
  showOpenForm = signal(false);
  showCloseForm = signal(false);
  showTransferForm = signal(false);
  showClosedAccounts = signal(false);
  showCloseErrorModal = signal(false);
  showPinModal = signal(false);
  confirmedPin = signal<string | null>(null);
  currentCardIndex = signal(0);

  sourceAccountNumber = '';
  initialAmount = 0;
  closeAccountNumber = '';
  txSource = '';
  txDestination = '';
  txAmount: number | null = null;
  txDescription = '';

  get activeAccounts() {
    return this.accounts().filter(a => a.statusId !== 4);
  }

  get closedAccounts() {
    return this.accounts().filter(a => a.statusId === 4);
  }

  get onlyActiveAccounts() {
    return this.accounts().filter(a => a.statusId === 2);
  }

  constructor(
    private customerService: CustomerService,
    private toastService: ToastService,
    private translate: TranslateService,
    private route: ActivatedRoute,
  ) {
    if (this.route.snapshot.queryParamMap.get('action') === 'open') {
      this.showOpenForm.set(true);
    }
    this.loadAccounts();
  }

  loadAccounts(): void {
    this.customerService.getAccounts().subscribe({
      next: (data) => {
        const sorted = [...data].sort((a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        this.accounts.set(sorted);
        this.currentCardIndex.set(0);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  prevCard(): void {
    const idx = this.currentCardIndex();
    if (idx > 0) this.currentCardIndex.set(idx - 1);
  }

  nextCard(): void {
    const idx = this.currentCardIndex();
    if (idx < this.activeAccounts.length - 1) this.currentCardIndex.set(idx + 1);
  }

  goToCard(index: number): void {
    this.currentCardIndex.set(index);
  }

  toggleTransferForm(): void {
    this.showTransferForm.set(!this.showTransferForm());
    if (this.showTransferForm()) {
      this.showOpenForm.set(false);
      this.showCloseForm.set(false);
    }
  }

  openAccount(): void {
    if (!this.sourceAccountNumber || this.initialAmount < 0.01) {
      this.toastService.i18nError('ACCOUNTS.toast.fill_fields');
      return;
    }

    this.customerService.openAccount({
      sourceAccountNumber: this.sourceAccountNumber,
      initialAmount: this.initialAmount,
    }).subscribe({
      next: () => {
        this.toastService.i18nSuccess('ACCOUNTS.toast.account_open_requested');
        this.showOpenForm.set(false);
        this.sourceAccountNumber = '';
        this.initialAmount = 0;
        this.loadAccounts();
      },
      error: (err) => this.toastService.error(err?.error?.message || err?.message || this.translate.instant('ACCOUNTS.toast.generic_error')),
    });
  }

  requestClosure(): void {
    if (!this.closeAccountNumber) {
      this.toastService.i18nError('ACCOUNTS.toast.select_account');
      return;
    }

    if (this.onlyActiveAccounts.length <= 1) {
      this.showCloseErrorModal.set(true);
      return;
    }

    this.customerService.closureRequest({ accountNumber: this.closeAccountNumber }).subscribe({
      next: () => {
        this.toastService.i18nSuccess('ACCOUNTS.CLOSE_REQUEST_SUCCESS');
        this.showCloseForm.set(false);
        this.closeAccountNumber = '';
        this.loadAccounts();
      },
      error: (err) => this.toastService.error(err?.error?.message || err?.message || this.translate.instant('ACCOUNTS.toast.generic_error')),
    });
  }

  transfer(): void {
    if (!this.txSource || !this.txDestination) {
      this.toastService.i18nError('ACCOUNTS.toast.transfer_select_accounts');
      return;
    }
    if (this.txSource === this.txDestination) {
      this.toastService.i18nError('ACCOUNTS.toast.transfer_same_account');
      return;
    }
    if (!this.txAmount || this.txAmount <= 0) {
      this.toastService.i18nError('TRANSACTIONS.insert_amount');
      return;
    }

    this.showPinModal.set(true);
  }

  executeTransfer(): void {
    this.customerService.transfer({
      sourceAccountNumber: this.txSource,
      destinationAccountNumber: this.txDestination,
      beneficiaryId: null,
      amount: this.txAmount!,
      pin: this.confirmedPin()!,
      description: this.txDescription || this.translate.instant('ACCOUNTS.internal_transfer'),
      isInstant: false,
      scheduledDate: null,
    }).subscribe({
      next: () => {
        this.toastService.i18nSuccess('ACCOUNTS.toast.transfer_success');
        this.showTransferForm.set(false);
        this.txSource = '';
        this.txDestination = '';
        this.txAmount = null;
        this.txDescription = '';
        this.confirmedPin.set(null);
        this.loadAccounts();
      },
      error: (err) => {
        this.confirmedPin.set(null);
        this.toastService.error(err?.error?.message || err?.message || this.translate.instant('ACCOUNTS.toast.generic_error'));
      },
    });
  }

  onPinConfirmed(pin: string): void {
    this.showPinModal.set(false);
    this.confirmedPin.set(pin);
    this.executeTransfer();
  }

  onPinCancelled(): void {
    this.showPinModal.set(false);
    this.confirmedPin.set(null);
  }

  getTotalBalance(): number {
    return this.accounts().reduce((sum, acc) => sum + acc.balance, 0);
  }
}
