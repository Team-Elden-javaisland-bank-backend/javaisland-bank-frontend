import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomerService } from '../../core/services/customer.service';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface CustomerProfile {
  id: number;
  name: string;
  email: string;
  phone: string;
  fiscalCode: string;
  birthDate: string;
  residence: string;
  registrationDate: string;
  status: string;
}

interface AccountSummary {
  id: number;
  iban: string;
  type: string;
  balance: number;
  currency: string;
  status: string;
  creationDate: string;
}

interface CardSummary {
  id: number;
  cardNumber: string;
  cardType: string;
  expiryDate: string;
  status: string;
  linkedAccountIban: string;
}

interface Transaction {
  id: number;
  date: string;
  description: string;
  amount: number;
  type: string;
  status: string;
}

interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

@Component({
  selector: 'app-customer-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './customer-profile.html',
  styleUrls: ['./customer-profile.css']
})
export class CustomerProfileComponent implements OnInit {
  profile = signal<CustomerProfile | null>(null);
  accounts = signal<AccountSummary[]>([]);
  cards = signal<CardSummary[]>([]);
  transactions = signal<Transaction[]>([]);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string | null>(null);

  passwordRequest = signal<PasswordChangeRequest>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  passwordStrength = computed(() => {
    const pwd = this.passwordRequest().newPassword;
    if (!pwd) return { level: 'none', score: 0, label: '' };

    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 2) return { level: 'weak', score: 33, label: 'Debole' };
    if (score <= 4) return { level: 'medium', score: 66, label: 'Media' };
    return { level: 'strong', score: 100, label: 'Forte' };
  });

  isPasswordValid = computed(() => {
    const req = this.passwordRequest();
    return (
      req.currentPassword.length > 0 &&
      req.newPassword.length >= 8 &&
      req.newPassword === req.confirmPassword
    );
  });

  isGeneratingPdf = signal<boolean>(false);
  isSubmittingPassword = signal<boolean>(false);
  selectedAccountForPdf = signal<number | null>(null);

  showPasswordModal = signal<boolean>(false);
  showPdfModal = signal<boolean>(false);

  constructor(private customerService: CustomerService) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.customerService.getProfile().subscribe({
      next: (data: any) => {
        this.profile.set(data);
        this.loadAccounts();
      },
      error: (err: any) => {
        this.errorMessage.set('Errore nel caricamento del profilo');
        this.isLoading.set(false);
      }
    });
  }

  loadAccounts(): void {
    this.customerService.getAccounts().subscribe({
      next: (data: any) => {
        this.accounts.set(Array.isArray(data) ? data : data.content || []);
        this.loadCards();
      },
      error: () => {
        this.accounts.set([]);
        this.loadCards();
      }
    });
  }

  loadCards(): void {
    this.customerService.getCards().subscribe({
      next: (data: any) => {
        this.cards.set(Array.isArray(data) ? data : data.content || []);
        this.isLoading.set(false);
      },
      error: () => {
        this.cards.set([]);
        this.isLoading.set(false);
      }
    });
  }

  getInitials(): string {
    const p = this.profile();
    if (!p) return '??';
    const parts = p.name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return p.name.substring(0, 2).toUpperCase();
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  maskIban(iban: string): string {
    if (!iban) return '-';
    if (iban.length <= 8) return iban;
    return iban.substring(0, 4) + '****' + iban.substring(iban.length - 4);
  }

  maskCardNumber(num: string): string {
    if (!num) return '-';
    const clean = num.replace(/\s/g, '');
    return '**** **** **** ' + clean.substring(clean.length - 4);
  }

  getStatusBadgeClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'active': return 'badge-active';
      case 'inactive': return 'badge-inactive';
      case 'blocked': return 'badge-blocked';
      case 'pending': return 'badge-pending';
      default: return 'badge-secondary';
    }
  }

  getStatusLabel(status: string): string {
    switch (status?.toLowerCase()) {
      case 'active': return 'Attivo';
      case 'inactive': return 'Inattivo';
      case 'blocked': return 'Bloccato';
      case 'pending': return 'In attesa';
      default: return status;
    }
  }

  getCardGradient(type: string): string {
    switch (type?.toLowerCase()) {
      case 'credit': return 'card-gradient-credit';
      case 'debit': return 'card-gradient-debit';
      case 'prepaid': return 'card-gradient-prepaid';
      default: return 'card-gradient-default';
    }
  }

  getCardTypeLabel(type: string): string {
    switch (type?.toLowerCase()) {
      case 'credit': return 'Carta di Credito';
      case 'debit': return 'Carta di Debito';
      case 'prepaid': return 'Carta Prepagata';
      default: return type;
    }
  }

  openPasswordModal(): void {
    this.passwordRequest.set({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    this.showPasswordModal.set(true);
  }

  closePasswordModal(): void {
    this.showPasswordModal.set(false);
  }

  updatePasswordField(field: keyof PasswordChangeRequest, value: string): void {
    this.passwordRequest.update(req => ({ ...req, [field]: value }));
  }

  submitPasswordChange(): void {
    if (!this.isPasswordValid()) return;

    this.isSubmittingPassword.set(true);
    const req = this.passwordRequest();

    this.customerService.requestPasswordChange(req.currentPassword, req.newPassword).subscribe({
      next: () => {
        this.isSubmittingPassword.set(false);
        this.closePasswordModal();
        this.errorMessage.set(null);
      },
      error: (err: any) => {
        this.isSubmittingPassword.set(false);
        this.errorMessage.set(
          err.error?.message || 'Errore nella richiesta di cambio password'
        );
      }
    });
  }

  openPdfModal(): void {
    this.selectedAccountForPdf.set(null);
    this.showPdfModal.set(true);
    this.loadTransactions();
  }

  closePdfModal(): void {
    this.showPdfModal.set(false);
  }

  loadTransactions(): void {
    this.customerService.getAllTransactions(
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      new Date().toISOString().slice(0, 10)
    ).subscribe({
      next: (data: any) => {
        this.transactions.set(Array.isArray(data) ? data : data.content || []);
      },
      error: () => {
        this.transactions.set([]);
      }
    });
  }

  selectAccountForPdf(accountId: number | null): void {
    this.selectedAccountForPdf.set(accountId);
  }

  generatePdf(): void {
    this.isGeneratingPdf.set(true);

    const doc = new jsPDF();
    const p = this.profile();
    const accountId = this.selectedAccountForPdf();

    const filteredTx = accountId
      ? this.transactions().filter((t: any) => t.accountId === accountId)
      : this.transactions();

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(10, 25, 47);
    doc.text('Banca Italia Island', 14, 22);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Estratto Conto', 14, 30);
    doc.text(`Data generazione: ${new Date().toLocaleDateString('it-IT')}`, 14, 36);

    if (p) {
      doc.setFontSize(12);
      doc.setTextColor(10, 25, 47);
      doc.text(`Intestatario: ${p.name}`, 14, 46);
      doc.text(`Codice Fiscale: ${p.fiscalCode}`, 14, 52);
      doc.text(`Email: ${p.email}`, 14, 58);
    }

    const rows = filteredTx.map((tx: Transaction) => [
      this.formatDate(tx.date),
      tx.description || '-',
      tx.type === 'CREDIT' ? '+' + this.formatCurrency(tx.amount) : '-' + this.formatCurrency(tx.amount),
      tx.status
    ]);

    autoTable(doc, {
      startY: p ? 66 : 40,
      head: [['Data', 'Descrizione', 'Importo', 'Stato']],
      body: rows,
      theme: 'grid',
      headStyles: {
        fillColor: [10, 25, 47],
        textColor: [229, 169, 60],
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250]
      },
      styles: {
        fontSize: 9,
        cellPadding: 4
      },
      margin: { top: 10 }
    });

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Pagina ${i} di ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    doc.save(`estratto_conto_${new Date().toISOString().slice(0, 10)}.pdf`);
    this.isGeneratingPdf.set(false);
    this.closePdfModal();
  }
}
