import { Component, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class RegisterComponent {
  firstName = '';
  lastName = '';
  birthDate = '';
  email = '';
  password = '';
  confirmPassword = '';
  error = signal('');
  success = signal('');
  loading = signal(false);

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit(): void {
    this.error.set('');
    this.success.set('');

    if (!this.firstName || !this.lastName || !this.birthDate || !this.email || !this.password) {
      this.error.set('Compila tutti i campi');
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.error.set('Le password non coincidono');
      return;
    }

    if (this.password.length < 6) {
      this.error.set('La password deve avere almeno 6 caratteri');
      return;
    }

    const birthDateObj = new Date(this.birthDate);
    const age = Math.floor((Date.now() - birthDateObj.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    if (age < 18) {
      this.error.set('Devi essere maggiorenne per registrarti');
      return;
    }

    this.loading.set(true);

    this.authService.register({
      firstName: this.firstName,
      lastName: this.lastName,
      birthDate: this.birthDate,
      email: this.email,
      password: this.password,
    }).subscribe({
      next: () => {
        this.loading.set(false);
        this.success.set('Registrazione completata! Un dipendente dovrà validare il tuo account prima di poter accedere.');
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.message);
      },
    });
  }
}
