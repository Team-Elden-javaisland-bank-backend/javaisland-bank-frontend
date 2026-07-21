import { Component, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent {
  username = '';
  password = '';
  error = signal('');
  loading = signal(false);

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit(): void {
    if (!this.username || !this.password) {
      this.error.set('Inserisci username e password');
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
