import { Component, signal } from '@angular/core';
import { TranslatePipe, TranslateDirective } from '@ngx-translate/core';
import { CustomerService } from '../../core/services/customer.service';
import { CardResponseDto } from '../../core/models/card/card-response.dto';
import { CardSensitiveDto } from '../../core/models/card/card-sensitive.dto';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-customer-cards',
  imports: [TranslatePipe, TranslateDirective],
  templateUrl: './customer-cards.html',
  styleUrl: './customer-cards.css',
})
export class CustomerCardsComponent {
  cards = signal<CardResponseDto[]>([]);
  loading = signal(true);
  revealedCard = signal<CardSensitiveDto | null>(null);
  revealedId = signal<number | null>(null);
  showClosedCards = signal(false);

  constructor(
    private customerService: CustomerService,
    private toastService: ToastService,
  ) {
    this.loadCards();
  }

  get activeCards(): CardResponseDto[] {
    return this.cards().filter(c => c.status !== 'CLOSED');
  }

  get closedCards(): CardResponseDto[] {
    return this.cards().filter(c => c.status === 'CLOSED');
  }

  loadCards(): void {
    this.customerService.getCards().subscribe({
      next: (data) => {
        this.cards.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  toggleSensitive(cardId: number): void {
    if (this.revealedId() === cardId) {
      this.revealedCard.set(null);
      this.revealedId.set(null);
      return;
    }

    this.customerService.getCardSensitive(cardId).subscribe({
      next: (data) => {
        this.revealedCard.set(data);
        this.revealedId.set(cardId);
      },
      error: (err) => this.toastService.error(err?.error?.message || err?.message),
    });
  }

  formatCardNumber(num: string): string {
    return num.replace(/(.{4})/g, '$1 ').trim();
  }

  getCardGradient(type: string): string {
    if (type === 'DEBIT') return 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)';
    return '#1e293b';
  }

  getActiveCardsCount(): number {
    return this.cards().filter(c => c.status === 'ACTIVE').length;
  }

  getBlockedCardsCount(): number {
    return this.cards().filter(c => c.status === 'BLOCKED').length;
  }

  getClosedCardsCount(): number {
    return this.cards().filter(c => c.status === 'CLOSED').length;
  }
}
