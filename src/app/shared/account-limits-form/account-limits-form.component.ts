import { Component, ChangeDetectionStrategy, computed, EventEmitter, Input, OnInit, Output, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { AccountResponseDto } from '../../core/models/account/account-response.dto';
import { AccountLimitResponseDto } from '../../core/models/account/account-limit-response.dto';
import { CustomerService } from '../../core/services/customer.service';
import { ToastService } from '../../core/services/toast.service';

interface LimitMeta {
  type: string;
  labelKey: string;
  descriptionKey: string;
  policy: 'USER_FULL' | 'USER_LOWER_ONLY' | 'BANK_ONLY';
  policyLabelKey: string;
  policyColor: string;
  defaultValue: number;
  minValue: number;
  maxValue: number;
}

@Component({
  selector: 'app-account-limits-form',
  imports: [CurrencyPipe, FormsModule, TranslatePipe],
  templateUrl: './account-limits-form.component.html',
  styleUrl: './account-limits-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountLimitsFormComponent implements OnInit {
  @Input() account!: AccountResponseDto;
  @Input() confirmLabelKey = 'LIMITS_SETUP.confirm';
  @Input() submitting = false;
  @Input() isInitialSetup = true;
  @Output() confirmed = new EventEmitter<void>();

  limits = signal<AccountLimitResponseDto[]>([]);
  limitsLoading = signal(false);

  editingType = signal('');
  editingErrorKey = signal<string | null>(null);
  editingErrorParams = signal<Record<string, any>>({});
  editAmount = 0;

  allLimitTypes: LimitMeta[] = [
    { type: 'ATM_WITHDRAWAL', labelKey: 'LIMIT_TYPE.ATM_WITHDRAWAL.label', descriptionKey: 'LIMIT_TYPE.ATM_WITHDRAWAL.description', policy: 'USER_FULL', policyLabelKey: 'LIMITS_SETUP.editable', policyColor: '#065f46', defaultValue: 300, minValue: 10, maxValue: 300 },
    { type: 'POS_SPENDING', labelKey: 'LIMIT_TYPE.POS_SPENDING.label', descriptionKey: 'LIMIT_TYPE.POS_SPENDING.description', policy: 'USER_FULL', policyLabelKey: 'LIMITS_SETUP.editable', policyColor: '#065f46', defaultValue: 2500, minValue: 0.10, maxValue: 2500 },
    { type: 'DAILY_TRANSFER', labelKey: 'LIMIT_TYPE.DAILY_TRANSFER.label', descriptionKey: 'LIMIT_TYPE.DAILY_TRANSFER.description', policy: 'USER_LOWER_ONLY', policyLabelKey: 'LIMITS_SETUP.lower_only', policyColor: '#92400e', defaultValue: 15000, minValue: 1, maxValue: 15000 },
    { type: 'SINGLE_TRANSFER', labelKey: 'LIMIT_TYPE.SINGLE_TRANSFER.label', descriptionKey: 'LIMIT_TYPE.SINGLE_TRANSFER.description', policy: 'USER_LOWER_ONLY', policyLabelKey: 'LIMITS_SETUP.lower_only', policyColor: '#92400e', defaultValue: 10000, minValue: 1, maxValue: 10000 },
    { type: 'INSTANT_TRANSFER_SINGLE', labelKey: 'LIMIT_TYPE.INSTANT_TRANSFER_SINGLE.label', descriptionKey: 'LIMIT_TYPE.INSTANT_TRANSFER_SINGLE.description', policy: 'BANK_ONLY', policyLabelKey: 'LIMITS_SETUP.bank_only', policyColor: '#991b1b', defaultValue: 5000, minValue: 1, maxValue: 5000 },
    { type: 'MONTHLY_TRANSFER', labelKey: 'LIMIT_TYPE.MONTHLY_TRANSFER.label', descriptionKey: 'LIMIT_TYPE.MONTHLY_TRANSFER.description', policy: 'BANK_ONLY', policyLabelKey: 'LIMITS_SETUP.bank_only', policyColor: '#991b1b', defaultValue: 50000, minValue: 1, maxValue: 50000 },
  ];

  allLimitsSet = computed(() => {
    const allSet = this.allLimitTypes.every(meta => this.limits().some(l => l.limitType === meta.type));
    return allSet && this.crossLimitsValid();
  });

  crossLimitsValid = computed(() => {
    const daily = this.limits().find(l => l.limitType === 'DAILY_TRANSFER')?.maxAmount;
    const monthly = this.limits().find(l => l.limitType === 'MONTHLY_TRANSFER')?.maxAmount;
    if (daily == null || monthly == null) return true;
    return daily <= monthly;
  });

  missingLimitsCount = computed(() => {
    return this.allLimitTypes.filter(meta => !this.limits().some(l => l.limitType === meta.type)).length;
  });

  constructor(
    private customerService: CustomerService,
    private toastService: ToastService,
  ) {}

  ngOnInit(): void {
    this.loadLimits();
  }

  loadLimits(): void {
    this.limitsLoading.set(true);
    this.customerService.getAccountLimits(this.account.accountNumber).subscribe({
      next: (data) => { this.limits.set(data); this.limitsLoading.set(false); },
      error: () => this.limitsLoading.set(false),
    });
  }

  getLimitForType(type: string): AccountLimitResponseDto | undefined {
    return this.limits().find(l => l.limitType === type);
  }

  canEdit(type: string): boolean {
    if (this.isInitialSetup) return true;
    const meta = this.allLimitTypes.find(m => m.type === type);
    return meta?.policy !== 'BANK_ONLY';
  }

  startEdit(type: string, currentAmount: number): void {
    const meta = this.allLimitTypes.find(m => m.type === type);
    this.editingType.set(type);
    this.editingErrorKey.set(null);
    this.editAmount = currentAmount || meta?.defaultValue || 0;
  }

  cancelEdit(): void { this.editingType.set(''); this.editingErrorKey.set(null); this.editingErrorParams.set({}); }

  saveLimit(type: string): void {
    const meta = this.allLimitTypes.find(m => m.type === type);
    if (this.editAmount < (meta?.minValue ?? 0)) {
      this.editingErrorKey.set('LIMITS.error_min');
      this.editingErrorParams.set({ value: meta?.minValue ?? 0 });
      return;
    }

    if (meta && this.editAmount > meta.maxValue) {
      this.editingErrorKey.set('VALIDATION.LIMIT_EXCEEDS_MAXIMUM');
      this.editingErrorParams.set({ value: meta.maxValue });
      return;
    }

    this.editingErrorKey.set(null);
    this.editingErrorParams.set({});
    this.customerService.setAccountLimit(this.account.accountNumber, type, {
      maxAmount: this.editAmount,
    }).subscribe({
      next: (saved) => {
        this.toastService.i18nSuccess('LIMITS_SETUP.toast.saved');
        this.editingType.set('');
        this.limits.update(list => {
          const idx = list.findIndex(l => l.limitType === type);
          if (idx >= 0) {
            return list.map(l => l.limitType === type ? { ...l, maxAmount: this.editAmount } : l);
          } else {
            return [...list, { limitType: type, maxAmount: this.editAmount } as AccountLimitResponseDto];
          }
        });
      },
      error: (err) => this.toastService.error(err?.error?.message || err?.message),
    });
  }

  onConfirm(): void {
    if (!this.allLimitsSet() || this.submitting) return;
    this.confirmed.emit();
  }
}
