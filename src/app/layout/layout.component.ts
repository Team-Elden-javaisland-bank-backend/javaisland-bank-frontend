import { Component, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { Router } from '@angular/router';
import { ToastComponent } from '../core/components/toast/toast.component';
import { routeAnimation } from '../core/animations/route.animations';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ToastComponent],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
  animations: [routeAnimation],
})
export class LayoutComponent {
  mobileMenuOpen = signal(false);
  showUploadModal = signal(false);
  uploading = signal(false);
  uploadError = signal<string | null>(null);

  private fileInput: HTMLInputElement | null = null;

  constructor(public authService: AuthService, private router: Router) {}

  get isCustomer(): boolean {
    return this.authService.getUser()?.role === 'C';
  }

  get isEmployee(): boolean {
    return this.authService.getUser()?.role === 'D';
  }

  get userName(): string {
    const user = this.authService.getUser();
    return user ? `${user.firstName} ${user.lastName}` : '';
  }

  get profilePictureUrl(): string | null {
    return this.authService.getProfilePictureUrl();
  }

  get initials(): string {
    return this.authService.getInitials();
  }

  get baseUrl(): string {
    return 'http://localhost:8081';
  }

  getRouteAnimationData(outlet: RouterOutlet): string {
    return outlet?.activatedRouteData?.['animation'] ?? '';
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.set(!this.mobileMenuOpen());
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  openUploadDialog(): void {
    this.uploadError.set(null);
    this.showUploadModal.set(true);
  }

  closeUploadModal(): void {
    this.showUploadModal.set(false);
    this.uploadError.set(null);
  }

  triggerFileInput(): void {
    if (!this.fileInput) {
      this.fileInput = document.createElement('input');
      this.fileInput.type = 'file';
      this.fileInput.accept = 'image/jpeg,image/png,image/gif,image/webp';
      this.fileInput.addEventListener('change', (e) => this.onFileSelected(e));
    }
    this.fileInput.value = '';
    this.fileInput.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    this.uploading.set(true);
    this.uploadError.set(null);

    this.authService.uploadProfilePicture(file).subscribe({
      next: () => {
        this.uploading.set(false);
        this.closeUploadModal();
      },
      error: (err: Error) => {
        this.uploading.set(false);
        this.uploadError.set(err.message);
      },
    });
  }

  removePicture(): void {
    this.authService.deleteProfilePicture().subscribe({
      next: () => this.closeUploadModal(),
      error: (err: Error) => this.uploadError.set(err.message),
    });
  }
}
