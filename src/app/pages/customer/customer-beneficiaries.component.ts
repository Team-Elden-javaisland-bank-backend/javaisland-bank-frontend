import { Component, ChangeDetectionStrategy, signal, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateDirective, TranslateService } from '@ngx-translate/core';
import { ApiUrlPipe } from '../../shared/pipes/api-url.pipe';
import { CustomerService } from '../../core/services/customer.service';
import { BeneficiaryResponseDto } from '../../core/models/beneficiary/beneficiary-response.dto';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-customer-beneficiaries',
  imports: [DatePipe, FormsModule, TranslatePipe, TranslateDirective, ApiUrlPipe],
  templateUrl: './customer-beneficiaries.html',
  styleUrl: './customer-beneficiaries.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerBeneficiariesComponent implements OnInit {
  beneficiaries = signal<BeneficiaryResponseDto[]>([]);
  loading = signal(true);
  showForm = signal(false);

  nickname = '';
  destinationAccountNumber = '';

  constructor(
    private customerService: CustomerService,
    private toastService: ToastService,
    private translate: TranslateService,
  ) {}

  ngOnInit(): void {
    this.loadBeneficiaries();
  }

  loadBeneficiaries(): void {
    this.customerService.getBeneficiaries().subscribe({
      next: (data) => {
        this.beneficiaries.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  addBeneficiary(): void {
    if (!this.nickname || !this.destinationAccountNumber) {
      this.toastService.i18nError('BENEFICIARIES.toast.fill_fields');
      return;
    }

    const data: any = {
      nickname: this.nickname,
      destinationAccountNumber: this.destinationAccountNumber,
    };

    this.customerService.saveBeneficiary(data).subscribe({
      next: () => {
        this.toastService.i18nSuccess('BENEFICIARIES.toast.added');
        this.showForm.set(false);
        this.nickname = '';
        this.destinationAccountNumber = '';
        this.loadBeneficiaries();
      },
      error: (err: any) => {
        if (err?.errorCode === 'ACCOUNT_NOT_FOUND') {
          this.toastService.i18nError('BENEFICIARIES.toast.account_not_found');
        } else {
          this.toastService.error(err?.message || err?.error?.message);
        }
      },
    });
  }

  deleteBeneficiary(id: number): void {
    if (!confirm(this.translate.instant('BENEFICIARIES.toast.confirm_delete'))) return;


    this.customerService.deleteBeneficiary(id).subscribe({
      next: () => {
        this.toastService.i18nSuccess('BENEFICIARIES.toast.removed');
        this.loadBeneficiaries();
      },
      error: (err) => this.toastService.error(err?.error?.message || err?.message),
    });
  }
}
