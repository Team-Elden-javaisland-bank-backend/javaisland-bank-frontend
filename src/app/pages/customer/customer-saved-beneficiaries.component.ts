import { Component, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CustomerService } from '../../core/services/customer.service';
import { SavedBeneficiaryResponseDto } from '../../core/models/saved-beneficiary/saved-beneficiary-response.dto';

@Component({
  selector: 'app-customer-saved-beneficiaries',
  imports: [FormsModule],
  templateUrl: './customer-saved-beneficiaries.html',
  styleUrl: './customer-saved-beneficiaries.css',
})
export class CustomerSavedBeneficiariesComponent implements OnInit {
  savedBeneficiaries = signal<SavedBeneficiaryResponseDto[]>([]);
  loading = signal(true);
  showForm = signal(false);
  message = signal('');
  messageType = signal<'success' | 'error'>('success');

  beneficiaryName = '';
  accountNumber = '';

  constructor(private customerService: CustomerService) {}

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
    this.message.set('');
    if (!this.beneficiaryName || !this.accountNumber) {
      this.message.set('Compila tutti i campi');
      this.messageType.set('error');
      return;
    }

    this.customerService.saveSavedBeneficiary({
      beneficiaryName: this.beneficiaryName,
      accountNumber: this.accountNumber,
    }).subscribe({
      next: () => {
        this.message.set('Beneficiario salvato!');
        this.messageType.set('success');
        this.showForm.set(false);
        this.beneficiaryName = '';
        this.accountNumber = '';
        this.loadSavedBeneficiaries();
      },
      error: (err) => { this.message.set(err.message); this.messageType.set('error'); },
    });
  }

  deleteSavedBeneficiary(id: number): void {
    if (!confirm('Vuoi eliminare questo beneficiario?')) return;

    this.customerService.deleteSavedBeneficiary(id).subscribe({
      next: () => {
        this.message.set('Beneficiario eliminato');
        this.messageType.set('success');
        this.loadSavedBeneficiaries();
      },
      error: (err) => { this.message.set(err.message); this.messageType.set('error'); },
    });
  }
}
