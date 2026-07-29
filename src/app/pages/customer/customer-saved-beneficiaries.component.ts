import { Component, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateDirective, TranslateService } from '@ngx-translate/core';
import { CustomerService } from '../../core/services/customer.service';
import { SavedBeneficiaryResponseDto } from '../../core/models/saved-beneficiary/saved-beneficiary-response.dto';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-customer-saved-beneficiaries',
  imports: [FormsModule, TranslatePipe, TranslateDirective],
  templateUrl: './customer-saved-beneficiaries.html',
  styleUrl: './customer-saved-beneficiaries.css',
})
export class CustomerSavedBeneficiariesComponent implements OnInit {
  savedBeneficiaries = signal<SavedBeneficiaryResponseDto[]>([]);
  loading = signal(true);
  showForm = signal(false);

  beneficiaryName = '';
  accountNumber = '';

  constructor(
    private customerService: CustomerService,
    private toastService: ToastService,
    private translate: TranslateService,
  ) {}

  ngOnInit(): void {
    this.loadSavedBeneficiaries();
  }

  loadSavedBeneficiaries(): void {
    this.customerService.getSavedBeneficiaries().subscribe({
      next: (data) => {
        this.savedBeneficiaries.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  addSavedBeneficiary(): void {
    if (!this.beneficiaryName || !this.accountNumber) {
      this.toastService.error(this.translate.instant('SAVED_BENEFICIARIES.toast.fill_fields'));
      return;
    }

    this.customerService.saveSavedBeneficiary({
      beneficiaryName: this.beneficiaryName,
      accountNumber: this.accountNumber,
    }).subscribe({
      next: () => {
        this.toastService.success(this.translate.instant('SAVED_BENEFICIARIES.toast.added'));
        this.showForm.set(false);
        this.beneficiaryName = '';
        this.accountNumber = '';
        this.loadSavedBeneficiaries();
      },
      error: (err) => this.toastService.error(err?.error?.message || err?.message),
    });
  }

  deleteSavedBeneficiary(id: number): void {
    if (!confirm(this.translate.instant('SAVED_BENEFICIARIES.toast.confirm_delete'))) return;

    this.customerService.deleteSavedBeneficiary(id).subscribe({
      next: () => {
        this.toastService.success(this.translate.instant('SAVED_BENEFICIARIES.toast.removed'));
        this.loadSavedBeneficiaries();
      },
      error: (err) => this.toastService.error(err?.error?.message || err?.message),
    });
  }
}
