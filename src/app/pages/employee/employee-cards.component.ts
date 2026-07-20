import { Component, signal } from '@angular/core';
import { EmployeeService } from '../../core/services/employee.service';
import { CardResponseDto } from '../../core/models/card/card-response.dto';

@Component({
  selector: 'app-employee-cards',
  imports: [],
  templateUrl: './employee-cards.html',
  styleUrl: './employee-cards.css',
})
export class EmployeeCardsComponent {
  cards = signal<CardResponseDto[]>([]);
  loading = signal(true);
  message = signal('');
  messageType = signal<'success' | 'error'>('success');

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
}
