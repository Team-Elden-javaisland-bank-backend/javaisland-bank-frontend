import { Component, ChangeDetectionStrategy, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { AccountResponseDto } from '../../core/models/account/account-response.dto';
import { CustomerService } from '../../core/services/customer.service';
import { ToastService } from '../../core/services/toast.service';
import { AccountLimitsFormComponent } from '../account-limits-form/account-limits-form.component';

@Component({
  selector: 'app-account-limits-modal',
  imports: [TranslatePipe, AccountLimitsFormComponent],
  templateUrl: './account-limits-modal.component.html',
  styleUrl: './account-limits-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountLimitsModalComponent implements OnInit, OnDestroy {
  @Input() account!: AccountResponseDto;
  @Output() completed = new EventEmitter<void>();

  submitting = false;

  constructor(
    private customerService: CustomerService,
    private toastService: ToastService,
  ) {}

  ngOnInit(): void {
    document.body.style.overflow = 'hidden';
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
  }

  onConfirmed(): void {
    if (this.submitting) return;
    this.submitting = true;
    this.customerService.completeAccountLimitsConfig(this.account.accountNumber).subscribe({
      next: () => {
        this.submitting = false;
        this.toastService.i18nSuccess('ACCOUNT_LIMITS_MODAL.success');
        this.completed.emit();
      },
      error: (err) => {
        this.submitting = false;
        this.toastService.error(err?.error?.message || err?.message || err);
      },
    });
  }
}
