import { Component, inject, signal, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateDirective, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-pin-setup',
  standalone: true,
  imports: [TranslatePipe, TranslateDirective],
  templateUrl: './pin-setup.html',
  styleUrl: './pin-setup.css',
})
export class PinSetupComponent {
  private translate = inject(TranslateService);
  currentLang = localStorage.getItem('lang') || 'it';

  digits = signal<string[]>(['', '', '', '']);
  loading = signal(false);
  message = signal('');
  messageType = signal<'success' | 'error'>('success');
  @ViewChildren('pinInput') pinInputs!: QueryList<ElementRef>;

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  switchLang(lang: string): void {
    localStorage.setItem('lang', lang);
    this.currentLang = lang;
    this.translate.use(lang);
  }

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
    this.authService.setupPin(pin).subscribe({
      next: () => {
        const user = this.authService.getUser();
        if (user) {
          user.pinSetupComplete = true;
          localStorage.setItem('auth_user', JSON.stringify(user));
        }
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
}
