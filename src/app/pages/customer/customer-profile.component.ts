import { ChangeDetectionStrategy, Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateDirective, TranslateService } from '@ngx-translate/core';
import { ApiUrlPipe } from '../../shared/pipes/api-url.pipe';
import { CustomerService } from '../../core/services/customer.service';
import { CustomerProfileDto } from '../../core/models/user/customer-profile.dto';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-customer-profile',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, FormsModule, TranslatePipe, TranslateDirective, ApiUrlPipe],
  templateUrl: './customer-profile.html',
  styleUrls: ['./customer-profile.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerProfileComponent implements OnInit {
  profile = signal<CustomerProfileDto | null>(null);
  isLoading = signal<boolean>(true);
  errorMessageKey = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  isSubmittingPassword = signal<boolean>(false);
  currentPassword = signal<string>('');
  newPassword = signal<string>('');
  pin = signal<string>('');
  passwordFormError = signal<string | null>(null);

  get hasMinLength(): boolean { return this.newPassword().length >= 8; }
  get hasUppercase(): boolean { return /[A-Z]/.test(this.newPassword()); }
  get hasLowercase(): boolean { return /[a-z]/.test(this.newPassword()); }
  get hasNumber(): boolean { return /\d/.test(this.newPassword()); }
  get hasSpecialChar(): boolean { return /[^a-zA-Z0-9]/.test(this.newPassword()); }

  isGeneratingPdf = signal<boolean>(false);
  selectedAccountForPdf = signal<string | null>(null);

  showPasswordModal = signal<boolean>(false);
  showPdfModal = signal<boolean>(false);

  transactions = signal<any[]>([]);

  accounts = computed(() => this.profile()?.accounts ?? []);
  cards = computed(() => (this.profile()?.cards ?? []).filter((card) => card.cardStatus !== 'CLOSED'));

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
        this.errorMessageKey.set('PROFILE.error_loading');
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
    this.customerService.getMyRequests().subscribe({
      next: (requests: any[]) => {
        const pending = requests.some(
          (r: any) => r.type === 'PASSWORD_CHANGE' && r.status === 'PENDING'
        );
        if (pending) {
          this.toastService.i18nError('PROFILE.error_pending_request');
          return;
        }
        this.currentPassword.set('');
        this.newPassword.set('');
        this.pin.set('');
        this.passwordFormError.set(null);
        this.showPasswordModal.set(true);
      },
      error: () => {
        this.currentPassword.set('');
        this.newPassword.set('');
        this.pin.set('');
        this.passwordFormError.set(null);
        this.showPasswordModal.set(true);
      }
    });
  }

  closePasswordModal(): void {
    this.showPasswordModal.set(false);
    this.currentPassword.set('');
    this.newPassword.set('');
    this.pin.set('');
    this.passwordFormError.set(null);
  }

  onPasswordFormInput(): void {
    this.passwordFormError.set(null);
  }

  onPinInput(): void {
    this.pin.set(this.pin().replace(/\D/g, '').slice(0, 4));
    this.passwordFormError.set(null);
  }

  submitPasswordChange(): void {
    this.passwordFormError.set(null);

    if (!this.currentPassword().trim()) {
      this.passwordFormError.set('PROFILE.error_current_password_required');
      return;
    }
    if (!this.newPassword()) {
      this.passwordFormError.set('PROFILE.error_new_password_required');
      return;
    }
    if (this.currentPassword() === this.newPassword()) {
      this.passwordFormError.set('PROFILE.error_password_same');
      return;
    }
    if (!this.hasMinLength || !this.hasUppercase || !this.hasLowercase || !this.hasNumber || !this.hasSpecialChar) {
      this.passwordFormError.set('PROFILE.error_password_criteria');
      return;
    }
    if (!/^\d{4}$/.test(this.pin())) {
      this.passwordFormError.set('PROFILE.error_invalid_pin_format');
      return;
    }

    this.isSubmittingPassword.set(true);

    this.customerService.requestPasswordChange({
      currentPassword: this.currentPassword(),
      newPassword: this.newPassword(),
      pin: this.pin(),
    }).subscribe({
      next: () => {
        this.isSubmittingPassword.set(false);
        this.closePasswordModal();
        this.toastService.i18nSuccess('PROFILE.password_change_requested');
      },
      error: (err: any) => {
        this.isSubmittingPassword.set(false);
        this.passwordFormError.set(this.mapPasswordError(err?.errorCode));
      }
    });
  }

  private mapPasswordError(code?: string): string {
    switch (code) {
      case 'CURRENT_PASSWORD_INCORRECT': return 'PROFILE.error_current_password';
      case 'NEW_PASSWORD_SAME_AS_CURRENT': return 'PROFILE.error_password_same';
      case 'INVALID_PIN': return 'PROFILE.error_invalid_pin';
      case 'PENDING_REQUEST_EXISTS': return 'PROFILE.error_pending_request';
      case 'VALIDATION_ERROR': return 'PROFILE.error_password_criteria';
      default: return 'PROFILE.error_password';
    }
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
