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

  getCardGradient(type: string): string {
    return type === 'CREDIT'
      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)';
  }
}
