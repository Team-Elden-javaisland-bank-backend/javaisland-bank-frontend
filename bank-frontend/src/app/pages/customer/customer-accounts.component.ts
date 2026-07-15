import { Component, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomerService } from '../../core/services/customer.service';
import { AccountResponseDto } from '../../core/models/account/account-response.dto';

@Component({
  selector: 'app-customer-accounts',
  imports: [CurrencyPipe, DatePipe, FormsModule],
  templateUrl: './customer-accounts.html',
  styleUrl: './customer-accounts.css',
})
export class CustomerAccountsComponent {
  accounts = signal<AccountResponseDto[]>([]);
  loading = signal(true);
  showOpenForm = signal(false);
  showCloseForm = signal(false);
  selectedAccount = signal<string>('');
  message = signal('');
  messageType = signal<'success' | 'error'>('success');

  sourceAccountNumber = '';
  initialAmount = 0;
  closeAccountNumber = '';

  constructor(private customerService: CustomerService) {
    this.loadAccounts();
  }

  loadAccounts(): void {
    this.customerService.getAccounts().subscribe({
      next: (data) => {
        this.accounts.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  openAccount(): void {
    this.message.set('');
    if (!this.sourceAccountNumber || this.initialAmount < 0.01) {
      this.message.set('Compila tutti i campi correttamente');
      this.messageType.set('error');
      return;
    }

    this.customerService.openAccount({
      sourceAccountNumber: this.sourceAccountNumber,
      initialAmount: this.initialAmount,
    }).subscribe({
      next: () => {
        this.message.set('Conto aperto con successo!');
        this.messageType.set('success');
        this.showOpenForm.set(false);
        this.sourceAccountNumber = '';
        this.initialAmount = 0;
        this.loadAccounts();
      },
      error: (err) => {
        this.message.set(err.message);
        this.messageType.set('error');
      },
    });
  }

  requestClosure(): void {
    this.message.set('');
    if (!this.closeAccountNumber) {
      this.message.set('Seleziona un conto');
      this.messageType.set('error');
      return;
    }

    this.customerService.closureRequest({ accountNumber: this.closeAccountNumber }).subscribe({
      next: (res) => {
        this.message.set(res);
        this.messageType.set('success');
        this.showCloseForm.set(false);
        this.closeAccountNumber = '';
        this.loadAccounts();
      },
      error: (err) => {
        this.message.set(err.message);
        this.messageType.set('error');
      },
    });
  }
}
