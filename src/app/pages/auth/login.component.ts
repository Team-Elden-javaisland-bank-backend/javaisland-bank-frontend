import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { TranslatePipe, TranslateDirective, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink, TranslatePipe, TranslateDirective],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent {
  private translate = inject(TranslateService);
  currentLang = localStorage.getItem('lang') || 'it';
  username = '';
  password = '';
  error = signal('');
  loading = signal(false);

  constructor(private authService: AuthService, private router: Router) {}

  switchLang(lang: string): void {
    localStorage.setItem('lang', lang);
    this.currentLang = lang;
    this.translate.use(lang);
  }

  onSubmit(): void {
    if (!this.username || !this.password) {
      this.error.set(this.translate.instant('AUTH.required_credentials'));
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.authService.login({ username: this.username, password: this.password }).subscribe({
      next: (res) => {
        this.authService.saveSession(res);
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
        this.error.set(err.message);
      },
    });
  }
}
