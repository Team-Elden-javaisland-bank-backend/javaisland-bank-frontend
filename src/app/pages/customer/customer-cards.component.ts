import { Component, signal } from '@angular/core';
import { CustomerService } from '../../core/services/customer.service';
import { CardResponseDto } from '../../core/models/card/card-response.dto';
import { CardSensitiveDto } from '../../core/models/card/card-sensitive.dto';

@Component({
  selector: 'app-customer-cards',
  imports: [],
  templateUrl: './customer-cards.html',
  styleUrl: './customer-cards.css',
})
export class CustomerCardsComponent {
  cards = signal<CardResponseDto[]>([]);
  loading = signal(true);
  revealedCard = signal<CardSensitiveDto | null>(null);
  revealedId = signal<number | null>(null);
  message = signal('');
  messageType = signal<'success' | 'error'>('success');

  constructor(private customerService: CustomerService) {
    this.loadCards();
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
      error: (err) => {
        this.message.set(err.message);
        this.messageType.set('error');
      },
    });
  }

  formatCardNumber(num: string): string {
    return num.replace(/(.{4})/g, '$1 ').trim();
  }

  getCardGradient(type: string): string {
    if (type === 'DEBIT') return 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)';
    if (type === 'CREDIT') return 'linear-gradient(135deg, #b45309 0%, #d97706 100%)';
    return '#1e293b';
  }
}
