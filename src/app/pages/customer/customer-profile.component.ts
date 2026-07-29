import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateDirective, TranslateService } from '@ngx-translate/core';
import { CustomerService } from '../../core/services/customer.service';
import { CustomerProfileDto } from '../../core/models/user/customer-profile.dto';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PinConfirmModalComponent } from '../../shared/pin-confirm-modal/pin-confirm-modal.component';
import { ToastService } from '../../core/services/toast.service';

interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

@Component({
  selector: 'app-customer-profile',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, FormsModule, TranslatePipe, TranslateDirective, PinConfirmModalComponent],
  templateUrl: './customer-profile.html',
  styleUrls: ['./customer-profile.css']
})
export class CustomerProfileComponent implements OnInit {
  profile = signal<CustomerProfileDto | null>(null);
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

    if (score <= 2) return { level: 'weak', score: 33, label: this.translate.instant('PROFILE.strength_weak') };
    if (score <= 4) return { level: 'medium', score: 66, label: this.translate.instant('PROFILE.strength_medium') };
    return { level: 'strong', score: 100, label: this.translate.instant('PROFILE.strength_strong') };
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
  selectedAccountForPdf = signal<string | null>(null);

  showPasswordModal = signal<boolean>(false);
  showPdfModal = signal<boolean>(false);
  showPinModal = signal<boolean>(false);

  transactions = signal<any[]>([]);

  accounts = computed(() => this.profile()?.accounts ?? []);
  cards = computed(() => this.profile()?.cards ?? []);

  constructor(private customerService: CustomerService, private translate: TranslateService, private toastService: ToastService) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.customerService.getProfile().subscribe({
      next: (data) => {
        this.profile.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set(this.translate.instant('PROFILE.error_loading'));
        this.isLoading.set(false);
      }
    });
  }

  getFullName(): string {
    const p = this.profile();
    if (!p) return '';
    return `${p.firstName} ${p.lastName}`.trim();
  }

  getInitials(): string {
    const p = this.profile();
    if (!p) return '??';
    const first = p.firstName?.charAt(0) ?? '';
    const last = p.lastName?.charAt(0) ?? '';
    return (first + last).toUpperCase() || '??';
  }

  private get currentLocale(): string {
    return this.translate.currentLang() === 'en' ? 'en-GB' : 'it-IT';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat(this.currentLocale, {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString(this.currentLocale, {
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
    const map: Record<string, string> = {
      'active': 'PROFILE.status_active',
      'inactive': 'PROFILE.status_inactive',
      'blocked': 'PROFILE.status_blocked',
      'pending': 'PROFILE.status_pending',
    };
    return status ? this.translate.instant(map[status.toLowerCase()] ?? status) : status;
  }

  getCardGradient(type: string): string {
    switch (type?.toLowerCase()) {
      case 'debit': return 'card-gradient-debit';
      default: return 'card-gradient-default';
    }
  }

  getCardTypeLabel(type: string): string {
    const map: Record<string, string> = {
      'debit': 'PROFILE.card_type_debit',
    };
    return type ? this.translate.instant(map[type.toLowerCase()] ?? type) : type;
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
    this.showPinModal.set(true);
  }

  onPinConfirmed(): void {
    this.showPinModal.set(false);
    this.isSubmittingPassword.set(true);
    const req = this.passwordRequest();

    this.customerService.requestPasswordChange(req.currentPassword, req.newPassword).subscribe({
      next: () => {
        this.isSubmittingPassword.set(false);
        this.closePasswordModal();
        this.toastService.success(this.translate.instant('PROFILE.password_changed'));
      },
      error: (err: any) => {
        this.isSubmittingPassword.set(false);
        this.toastService.error(err.error?.message || this.translate.instant('PROFILE.error_password'));
      }
    });
  }

  onPinCancelled(): void {
    this.showPinModal.set(false);
  }

  private translateTxStatus(statusName: string | null): string {
    if (!statusName) return '-';
    const key = `TX_STATUS.${statusName}`;
    const translated = this.translate.instant(key);
    return translated === key ? statusName : translated;
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

  selectAccountForPdf(accountNumber: string | null): void {
    this.selectedAccountForPdf.set(accountNumber);
  }

  generatePdf(): void {
    this.isGeneratingPdf.set(true);

    const doc = new jsPDF();
    const p = this.profile();
    const accountNumber = this.selectedAccountForPdf();

    const filteredTx = accountNumber
      ? this.transactions().filter((t: any) => t.sourceAccountNumber === accountNumber || t.destinationAccountNumber === accountNumber)
      : this.transactions();

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(10, 25, 47);
    doc.text(this.translate.instant('PROFILE.pdf_bank_name'), 14, 22);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(this.translate.instant('PROFILE.pdf_title'), 14, 30);
    doc.text(`${this.translate.instant('PROFILE.pdf_generation_date')}: ${new Date().toLocaleDateString(this.currentLocale)}`, 14, 36);

    if (p) {
      doc.setFontSize(12);
      doc.setTextColor(10, 25, 47);
      doc.text(`${this.translate.instant('PROFILE.pdf_account_holder')}: ${this.getFullName()}`, 14, 46);
      doc.text(`${this.translate.instant('PROFILE.pdf_tax_code')}: ${p.fiscalCode}`, 14, 52);
      doc.text(`Email: ${p.email}`, 14, 58);
    }

    const rows = filteredTx.map((tx: any) => [
      this.formatDate(tx.createdAt),
      tx.description || '-',
      tx.typeName === 'DEPOSIT' ? '+' + this.formatCurrency(tx.amount) : '-' + this.formatCurrency(tx.amount),
      this.translateTxStatus(tx.statusName)
    ]);

    autoTable(doc, {
      startY: p ? 66 : 40,
      head: [[
        this.translate.instant('PROFILE.pdf_date'),
        this.translate.instant('PROFILE.pdf_description'),
        this.translate.instant('PROFILE.pdf_amount'),
        this.translate.instant('PROFILE.pdf_status')
      ]],
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
        `${this.translate.instant('PROFILE.pdf_page')} ${i} ${this.translate.instant('PROFILE.pdf_of')} ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    doc.save(`${this.translate.instant('PROFILE.pdf_filename')}_${new Date().toISOString().slice(0, 10)}.pdf`);
    this.isGeneratingPdf.set(false);
    this.closePdfModal();
  }
}
