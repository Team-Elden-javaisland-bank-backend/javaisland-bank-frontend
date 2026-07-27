import { Component, signal, computed } from '@angular/core';
import { TranslatePipe, TranslateDirective } from '@ngx-translate/core';
import { EmployeeService } from '../../core/services/employee.service';
import { CardResponseDto } from '../../core/models/card/card-response.dto';

@Component({
  selector: 'app-employee-cards',
  imports: [TranslatePipe, TranslateDirective],
  templateUrl: './employee-cards.html',
  styleUrl: './employee-cards.css',
})
export class EmployeeCardsComponent {
  cards = signal<CardResponseDto[]>([]);
  loading = signal(true);
  message = signal('');
  messageType = signal<'success' | 'error'>('success');
  searchQuery = signal('');

  filteredCards = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const list = this.cards();
    if (!q) return list;
    return list.filter(c =>
      c.holderName?.toLowerCase().includes(q) ||
      c.maskedCardNumber?.includes(q)
    );
  });

  constructor(private employeeService: EmployeeService) {
    this.loadCards();
  }

  loadCards(): void {
    this.employeeService.getCards().subscribe({
      next: (data) => {
        this.cards.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
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
