import { Component, signal, OnInit } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomerService } from '../../core/services/customer.service';
import { AccountResponseDto } from '../../core/models/account/account-response.dto';
import { TransactionResponseDto } from '../../core/models/transaction/transaction-response.dto';
import { BeneficiaryResponseDto } from '../../core/models/beneficiary/beneficiary-response.dto';

@Component({
  selector: 'app-customer-transactions',
  imports: [CurrencyPipe, DatePipe, FormsModule],
  templateUrl: './customer-transactions.html',
  styleUrl: './customer-transactions.css',
})
export class CustomerTransactionsComponent implements OnInit {
  accounts = signal<AccountResponseDto[]>([]);
  beneficiaries = signal<BeneficiaryResponseDto[]>([]);
  allTransactions = signal<TransactionResponseDto[]>([]);
  loading = signal(true);
  activeTab = signal<'deposit' | 'withdraw' | 'transfer' | 'history'>('deposit');
  message = signal('');
  messageType = signal<'success' | 'error'>('success');

  // Deposit/Withdraw
  dwAccount = '';
  dwAmount = 0;

  // Transfer
  txSource = '';
  txDestination = '';
  txAmount = 0;
  txDescription = '';
  txBeneficiaryId: number | null = null;

  // History
  startDate = '';
  endDate = '';
  currentPage = signal(0);
  totalPages = 0;

  constructor(private customerService: CustomerService) {}

  ngOnInit(): void {
    this.customerService.getAccounts().subscribe({
      next: (data) => {
        this.accounts.set(data);
        if (data.length > 0) this.dwAccount = data[0].accountNumber;
        if (data.length > 0) this.txSource = data[0].accountNumber;
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });

    this.customerService.getBeneficiaries().subscribe({
      next: (data) => this.beneficiaries.set(data),
    });
  }

  deposit(): void {
    this.message.set('');
    if (!this.dwAccount || this.dwAmount < 0.01) {
      this.message.set('Compila tutti i campi');
      this.messageType.set('error');
      return;
    }

    this.customerService.deposit({ accountNumber: this.dwAccount, amount: this.dwAmount }).subscribe({
      next: (res) => {
        this.message.set(res);
        this.messageType.set('success');
        this.dwAmount = 0;
      },
      error: (err) => { this.message.set(err.message); this.messageType.set('error'); },
    });
  }

  withdraw(): void {
    this.message.set('');
    if (!this.dwAccount || this.dwAmount < 0.01) {
      this.message.set('Compila tutti i campi');
      this.messageType.set('error');
      return;
    }

    this.customerService.withdraw({ accountNumber: this.dwAccount, amount: this.dwAmount }).subscribe({
      next: (res) => {
        this.message.set(res);
        this.messageType.set('success');
        this.dwAmount = 0;
      },
      error: (err) => { this.message.set(err.message); this.messageType.set('error'); },
    });
  }

  transfer(): void {
    this.message.set('');
    if (!this.txSource || this.txAmount < 0.01) {
      this.message.set('Compila tutti i campi');
      this.messageType.set('error');
      return;
    }

    if (!this.txDestination && !this.txBeneficiaryId) {
      this.message.set('Seleziona una destinazione');
      this.messageType.set('error');
      return;
    }

    this.customerService.transfer({
      sourceAccountNumber: this.txSource,
      destinationAccountNumber: this.txDestination || '',
      beneficiaryId: this.txBeneficiaryId,
      amount: this.txAmount,
      description: this.txDescription,
    }).subscribe({
      next: () => {
        this.message.set('Bonifico inviato con successo!');
        this.messageType.set('success');
        this.txAmount = 0;
        this.txDescription = '';
        this.txDestination = '';
        this.txBeneficiaryId = null;
      },
      error: (err) => { this.message.set(err.message); this.messageType.set('error'); },
    });
  }

  loadHistory(): void {
    if (!this.startDate || !this.endDate) {
      this.message.set('Seleziona le date');
      this.messageType.set('error');
      return;
    }

    this.customerService.getAllTransactions(this.startDate, this.endDate, this.currentPage()).subscribe({
      next: (data) => {
        this.allTransactions.set(data.content);
        this.totalPages = data.totalPages;
      },
      error: (err) => { this.message.set(err.message); this.messageType.set('error'); },
    });
  }

  selectBeneficiary(id: number, accountNumber: string): void {
    this.txBeneficiaryId = id;
    this.txDestination = accountNumber;
  }

  getTransactionType(typeId: number): string {
    const types: Record<number, string> = { 1: 'Deposito', 2: 'Prelievo', 3: 'Bonifico', 4: 'Bonifico Iniziale' };
    return types[typeId] ?? 'Sconosciuto';
  }

  prevPage(): void {
    this.currentPage.set(this.currentPage() - 1);
    this.loadHistory();
  }

  nextPage(): void {
    this.currentPage.set(this.currentPage() + 1);
    this.loadHistory();
  }
}
