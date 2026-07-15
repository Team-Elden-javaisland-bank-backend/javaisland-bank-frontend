import { Component, signal, OnInit } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomerService } from '../../core/services/customer.service';
import { AccountResponseDto } from '../../core/models/account/account-response.dto';
import { AccountLimitResponseDto } from '../../core/models/account/account-limit-response.dto';
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
  accountLimits = signal<AccountLimitResponseDto[]>([]);
  loading = signal(true);
  activeTab = signal<'deposit' | 'withdraw' | 'transfer' | 'history'>('deposit');
  message = signal('');
  messageType = signal<'success' | 'error'>('success');

  // Deposit/Withdraw
  dwAccount = '';
  dwAmount: number | null = null;

  // Transfer
  txSource = '';
  txDestination = '';
  txAmount: number | null = null;
  txDescription = '';
  txBeneficiaryId: number | null = null;
  txTransferType = signal<'normal' | 'instant'>('normal');
  txScheduledDate = '';
  today = '';
  maxScheduleDate = '';

  // History
  startDate = '';
  endDate = '';
  currentPage = signal(0);
  totalPages = 0;

  constructor(private customerService: CustomerService) {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    this.today = tomorrow.toISOString().split('T')[0];
    const maxDate = new Date(tomorrow);
    maxDate.setDate(maxDate.getDate() + 29);
    this.maxScheduleDate = maxDate.toISOString().split('T')[0];
  }

  ngOnInit(): void {
    this.customerService.getAccounts().subscribe({
      next: (data) => {
        this.accounts.set(data);
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
    if (this.dwAccount) {
      this.loadLimits(this.dwAccount);
    }
  }

  onSourceChange(): void {
    if (this.txSource) {
      this.loadLimits(this.txSource);
    }
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

  private validateAmount(value: number | null, min: number, max: number | null, fieldName: string): string | null {
    if (value === null || value === undefined) {
      return `Inserisci l'importo`;
    }
    if (value < min) {
      return `Importo minimo: €${min.toFixed(2)}`;
    }
    if (max !== null && value > max) {
      return `Importo supera il limite di €${max.toFixed(2)}`;
    }
    return null;
  }

  private extractError(err: any): string {
    return err?.message || 'An error occurred. Please try again later.';
  }

  deposit(): void {
    this.message.set('');
    const err = this.validateAmount(this.dwAmount, 0.01, null, 'importo');
    if (err) {
      this.message.set(err);
      this.messageType.set('error');
      return;
    }

    this.customerService.deposit({ accountNumber: this.dwAccount, amount: this.dwAmount! }).subscribe({
      next: (res) => {
        this.message.set(res.message);
        this.messageType.set('success');
        this.dwAmount = null;
      },
      error: (err) => { this.message.set(this.extractError(err)); this.messageType.set('error'); },
    });
  }

  withdraw(): void {
    this.message.set('');
    const err = this.validateAmount(this.dwAmount, 10, null, 'importo');
    if (err) {
      this.message.set(err);
      this.messageType.set('error');
      return;
    }

    const atmLimit = this.getLimitValue('ATM_WITHDRAWAL');
    if (atmLimit !== null && this.dwAmount! > atmLimit) {
      this.message.set(`Importo supera il limite ATM di €${atmLimit.toFixed(2)}`);
      this.messageType.set('error');
      return;
    }

    this.customerService.withdraw({ accountNumber: this.dwAccount, amount: this.dwAmount! }).subscribe({
      next: (res) => {
        this.message.set(res.message);
        this.messageType.set('success');
        this.dwAmount = null;
      },
      error: (err) => { this.message.set(this.extractError(err)); this.messageType.set('error'); },
    });
  }

  transfer(): void {
    this.message.set('');
    const err = this.validateAmount(this.txAmount, 1, null, 'importo');
    if (err) {
      this.message.set(err);
      this.messageType.set('error');
      return;
    }

    if (!this.txDestination && !this.txBeneficiaryId) {
      this.message.set('Seleziona una destinazione');
      this.messageType.set('error');
      return;
    }

    const isInstant = this.txTransferType() === 'instant';

    if (!isInstant && !this.txScheduledDate) {
      this.message.set('Seleziona la data di esecuzione');
      this.messageType.set('error');
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
        this.message.set('La data deve essere almeno domani');
        this.messageType.set('error');
        return;
      }
      if (scheduled > maxDate) {
        this.message.set('La data non può essere oltre 30 giorni da oggi');
        this.messageType.set('error');
        return;
      }
    }

    const limitType = isInstant ? 'INSTANT_TRANSFER_SINGLE' : 'SINGLE_TRANSFER';
    const singleLimit = this.getLimitValue(limitType);
    if (singleLimit !== null && this.txAmount! > singleLimit) {
      const label = isInstant ? 'bonifico istantaneo' : 'bonifico';
      this.message.set(`Importo supera il limite ${label} di €${singleLimit.toFixed(2)}`);
      this.messageType.set('error');
      return;
    }

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
        const msg = isInstant ? 'Bonifico istantaneo inviato!' : 'Bonifico pianificato con successo!';
        this.message.set(msg);
        this.messageType.set('success');
        this.txAmount = null;
        this.txDescription = '';
        this.txDestination = '';
        this.txBeneficiaryId = null;
        this.txScheduledDate = '';
      },
      error: (err) => { this.message.set(this.extractError(err)); this.messageType.set('error'); },
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
      error: (err) => { this.message.set(this.extractError(err)); this.messageType.set('error'); },
    });
  }

  selectBeneficiary(id: number, accountNumber: string): void {
    this.txBeneficiaryId = id;
    this.txDestination = accountNumber;
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

  getTransactionType(typeId: number): string {
    const types: Record<number, string> = { 1: 'Deposito', 2: 'Prelievo', 3: 'Bonifico', 4: 'Bonifico Iniziale', 5: 'Bonifico Istantaneo' };
    return types[typeId] ?? 'Sconosciuto';
  }

  getTypeNameLabel(typeName: string | undefined): string {
    const map: Record<string, string> = {
      'DEPOSIT': 'Deposito',
      'WITHDRAWAL': 'Prelievo',
      'TRANSFER': 'Bonifico',
      'INSTANT_TRANSFER': 'Bonifico Istantaneo',
      'INITIAL_TRANSFER': 'Bonifico Iniziale',
    };
    return typeName ? (map[typeName] ?? typeName) : 'Sconosciuto';
  }

  getStatusNameLabel(statusName: string | undefined): string {
    const map: Record<string, string> = {
      'PENDING': 'In sospeso',
      'COMPLETED': 'Completato',
      'FAILED': 'Fallito',
      'REJECTED': 'Rifiutato',
    };
    return statusName ? (map[statusName] ?? statusName) : 'Sconosciuto';
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
