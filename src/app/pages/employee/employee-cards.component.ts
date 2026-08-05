import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { TranslatePipe, TranslateDirective, TranslateService } from '@ngx-translate/core';
import { EmployeeService } from '../../core/services/employee.service';
import { ToastService } from '../../core/services/toast.service';
import { CardResponseDto } from '../../core/models/card/card-response.dto';

@Component({
  selector: 'app-employee-cards',
  imports: [TranslatePipe, TranslateDirective],
  templateUrl: './employee-cards.html',
  styleUrl: './employee-cards.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeCardsComponent {
  cards = signal<CardResponseDto[]>([]);
  loading = signal(true);
  searchQuery = signal('');
  busy = signal<Set<number>>(new Set());

  filteredCards = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const list = this.cards();
    if (!q) return list;
    return list.filter(c =>
      c.holderName?.toLowerCase().includes(q) ||
      c.maskedCardNumber?.includes(q)
    );
  });

  isAccountBlocked = (card: CardResponseDto): boolean =>
    card.accountStatus === 'FROZEN' || card.accountStatus === 'CLOSED';

  isProcessing = (cardId: number): boolean => this.busy().has(cardId);

  constructor(
    private employeeService: EmployeeService,
    private translate: TranslateService,
    private toastService: ToastService,
  ) {
    this.loadCards();
  }

  loadCards(): void {
    this.loading.set(true);
    this.employeeService.getCards().subscribe({
      next: (data) => {
        this.cards.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  blockCard(card: CardResponseDto): void {
    if (!confirm(this.translate.instant('EMPLOYEE.cards.confirm_block', { card: card.maskedCardNumber }))) return;
    this.setBusy(card.id, true);
    this.employeeService.blockCard(card.id).subscribe({
      next: () => {
        this.toastService.i18nSuccess('EMPLOYEE.cards.block_success');
        this.setBusy(card.id, false);
        this.loadCards();
      },
      error: (err) => {
        this.setBusy(card.id, false);
        this.toastService.error(err?.message);
      },
    });
  }

  unblockCard(card: CardResponseDto): void {
    if (this.isAccountBlocked(card)) {
      this.toastService.i18nError('EMPLOYEE.cards.unblock_error_account_blocked');
      return;
    }
    if (!confirm(this.translate.instant('EMPLOYEE.cards.confirm_unblock', { card: card.maskedCardNumber }))) return;
    this.setBusy(card.id, true);
    this.employeeService.unblockCard(card.id).subscribe({
      next: () => {
        this.toastService.i18nSuccess('EMPLOYEE.cards.unblock_success');
        this.setBusy(card.id, false);
        this.loadCards();
      },
      error: (err) => {
        this.setBusy(card.id, false);
        if (err?.errorCode === 'CARD_UNBLOCK_ACCOUNT_BLOCKED') {
          this.toastService.i18nError('EMPLOYEE.cards.unblock_error_account_blocked');
        } else {
          this.toastService.error(err?.message);
        }
      },
    });
  }

  private setBusy(cardId: number, busy: boolean): void {
    this.busy.update(s => {
      const next = new Set(s);
      if (busy) next.add(cardId); else next.delete(cardId);
      return next;
    });
  }

  getStatusClass(status: string): string {
    return status.toLowerCase();
  }

  getActiveCount(): number {
    return this.cards().filter(c => c.status === 'ACTIVE').length;
  }

  onSearchInput(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }
}
