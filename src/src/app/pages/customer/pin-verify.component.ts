import { Component, signal, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-pin-verify',
  standalone: true,
  imports: [],
  templateUrl: './pin-verify.html',
  styleUrl: './pin-verify.css',
})
export class PinVerifyComponent {
  digits = signal<string[]>(['', '', '', '']);
  loading = signal(false);
  message = signal('');
  messageType = signal<'success' | 'error'>('success');
  @ViewChildren('pinInput') pinInputs!: QueryList<ElementRef>;

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

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
        this.authService.setPinVerified(true);
        this.router.navigate(['/customer/dashboard']);
      },
      error: (err) => {
        this.message.set(err.message);
        this.messageType.set('error');
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

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
