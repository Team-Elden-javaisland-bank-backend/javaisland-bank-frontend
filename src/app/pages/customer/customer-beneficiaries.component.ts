import { Component, signal, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateDirective } from '@ngx-translate/core';
import { CustomerService } from '../../core/services/customer.service';
import { BeneficiaryResponseDto } from '../../core/models/beneficiary/beneficiary-response.dto';

@Component({
  selector: 'app-customer-beneficiaries',
  imports: [DatePipe, FormsModule, TranslatePipe, TranslateDirective],
  templateUrl: './customer-beneficiaries.html',
  styleUrl: './customer-beneficiaries.css',
})
export class CustomerBeneficiariesComponent implements OnInit {
  beneficiaries = signal<BeneficiaryResponseDto[]>([]);
  loading = signal(true);
  showForm = signal(false);
  message = signal('');
  messageType = signal<'success' | 'error'>('success');

  nickname = '';
  destinationAccountNumber = '';

  constructor(private customerService: CustomerService) {}

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
    this.message.set('');
    if (!this.nickname || !this.destinationAccountNumber) {
      this.message.set('Compila tutti i campi');
      this.messageType.set('error');
      return;
    }

    this.customerService.saveBeneficiary({
      nickname: this.nickname,
      destinationAccountNumber: this.destinationAccountNumber,
    }).subscribe({
      next: () => {
        this.message.set('Beneficiario aggiunto!');
        this.messageType.set('success');
        this.showForm.set(false);
        this.nickname = '';
        this.destinationAccountNumber = '';
        this.loadBeneficiaries();
      },
      error: (err) => { this.message.set(err.message); this.messageType.set('error'); },
    });
  }

  deleteBeneficiary(id: number): void {
    if (!confirm('Vuoi eliminare questo beneficiario?')) return;

    this.customerService.deleteBeneficiary(id).subscribe({
      next: () => {
        this.message.set('Beneficiario eliminato');
        this.messageType.set('success');
        this.loadBeneficiaries();
      },
      error: (err) => { this.message.set(err.message); this.messageType.set('error'); },
    });
  }
}
