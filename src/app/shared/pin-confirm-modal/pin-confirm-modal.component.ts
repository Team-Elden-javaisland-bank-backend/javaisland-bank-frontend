import { Component, EventEmitter, Output, signal, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-pin-confirm-modal',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './pin-confirm-modal.component.html',
  styleUrl: './pin-confirm-modal.component.css',
})
export class PinConfirmModalComponent {
  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  digits = signal<string[]>(['', '', '', '']);
  loading = signal(false);
  message = signal('');
  @ViewChildren('pinInput') pinInputs!: QueryList<ElementRef>;

  constructor(private authService: AuthService) {}

  onInput(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/\D/g, '').slice(-1);

    const updated = [...this.digits()];
    updated[index] = value;
    this.digits.set(updated);

    input.value = value;
    this.message.set('');

    if (value && index < 3) {
      const inputs = this.pinInputs.toArray();
      inputs[index + 1]?.nativeElement.focus();
    }

    if (this.digits().every(d => d.length === 1)) {
      this.submit();
    }
  }

  onKeydown(index: number, event: KeyboardEvent): void {
    if (event.key === 'Backspace' && !this.digits()[index] && index > 0) {
      const inputs = this.pinInputs.toArray();
      inputs[index - 1]?.nativeElement.focus();
    }
  }

  submit(): void {
    const pin = this.digits().join('');
    if (pin.length !== 4) return;

    this.loading.set(true);
    this.authService.verifyPin(pin).subscribe({
      next: () => {
        this.confirmed.emit();
      },
      error: (err) => {
        this.message.set(err.message);
        this.loading.set(false);
        this.resetInputs();
      },
    });
  }

  resetInputs(): void {
    this.digits.set(['', '', '', '']);
    setTimeout(() => {
      const inputs = this.pinInputs.toArray();
      inputs[0]?.nativeElement.focus();
    });
  }

  cancel(): void {
    this.cancelled.emit();
  }

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('pin-modal-overlay')) {
      this.cancel();
    }
  }
}
