import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ToastComponent } from '../../core/components/toast/toast.component';
import { resetSessionExpiredHandled } from '../../core/interceptors/auth.interceptor';
import { TranslatePipe, TranslateDirective, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink, TranslatePipe, TranslateDirective, ToastComponent],
  templateUrl: './login.html',
  styleUrl: './login.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private translate = inject(TranslateService);
  private toastService = inject(ToastService);
  currentLang = localStorage.getItem('lang') || 'it';
  username = '';
  password = '';
  loading = signal(false);

  constructor(private authService: AuthService, private router: Router) {}

  switchLang(lang: string): void {
    localStorage.setItem('lang', lang);
    this.currentLang = lang;
    this.translate.use(lang);
  }

  onSubmit(): void {
    if (!this.username || !this.password) {
      this.toastService.i18nError('AUTH.required_credentials');
      return;
    }

    resetSessionExpiredHandled();
    this.loading.set(true);

    this.authService.login({ username: this.username, password: this.password }).subscribe({
      next: (res) => {
        this.authService.saveSession(res);
        resetSessionExpiredHandled();
        this.loading.set(false);
        if (res.role === 'C') {
          if (!res.limitsSetupComplete) {
            this.router.navigate(['/customer/limits-setup']);
          } else if (!res.pinSetupComplete) {
            this.router.navigate(['/customer/pin-setup']);
          } else {
            this.router.navigate(['/customer/dashboard']);
          }
        } else if (res.role === 'D') {
          this.router.navigate(['/employee/dashboard']);
        } else if (res.role === 'A') {
          this.router.navigate(['/admin/dashboard']);
        } else {
          this.router.navigate(['/login']);
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.toastService.error(err.message || '');
      },
    });
  }
}
