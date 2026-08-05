import { ChangeDetectionStrategy, Component, signal, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateDirective } from '@ngx-translate/core';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ToastComponent } from '../../core/components/toast/toast.component';

@Component({
  selector: 'app-pin-verify',
  standalone: true,
  imports: [TranslatePipe, TranslateDirective, ToastComponent],
  templateUrl: './pin-verify.html',
  styleUrl: './pin-verify.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PinVerifyComponent {
  digits = signal<string[]>(['', '', '', '']);
  loading = signal(false);
  @ViewChildren('pinInput') pinInputs!: QueryList<ElementRef>;

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService,
  ) {}

  onInput(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/\D/g, '').slice(-1);

    const updated = [...this.digits()];
    updated[index] = value;
    this.digits.set(updated);

    input.value = value;

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
        this.toastService.clearAll();
        this.authService.setPinVerified(true);
        this.router.navigate(['/customer/dashboard']);
      },
      error: (err) => {
        this.toastService.error(err?.error?.message || err?.message);
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
