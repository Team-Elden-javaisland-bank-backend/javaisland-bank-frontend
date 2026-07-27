import { Component, signal, OnInit, OnDestroy, HostListener, ElementRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { NotificationService, NotificationDto } from '../core/services/notification.service';
import { Router } from '@angular/router';
import { ToastComponent } from '../core/components/toast/toast.component';
import { routeAnimation } from '../core/animations/route.animations';
import { Subscription, interval } from 'rxjs';
import { TranslateService, TranslatePipe, TranslateDirective } from '@ngx-translate/core';

@Component({
  selector: 'app-layout',
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, ToastComponent, TranslatePipe, TranslateDirective],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
  animations: [routeAnimation],
})
export class LayoutComponent implements OnInit, OnDestroy {
  mobileMenuOpen = signal(false);
  showUploadModal = signal(false);
  uploading = signal(false);
  uploadError = signal<string | null>(null);
  unreadCount = signal(0);
  showNotifications = signal(false);
  notifications = signal<NotificationDto[]>([]);
  private pollSub: Subscription | null = null;

  private fileInput: HTMLInputElement | null = null;

  currentLang = signal(localStorage.getItem('lang') || 'it');
  darkMode = signal(false);

  constructor(
    public authService: AuthService,
    private router: Router,
    private notificationService: NotificationService,
    public translate: TranslateService,
    private elRef: ElementRef,
  ) {}

  ngOnInit(): void {
    const stored = localStorage.getItem('darkMode');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = stored !== null ? stored === 'true' : prefersDark;
    this.darkMode.set(isDark);
    this.applyDarkMode(isDark);

    if (this.isCustomer) {
      this.loadUnreadCount();
      this.pollSub = interval(10000).subscribe(() => this.loadUnreadCount());
    }
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.showNotifications()) return;
    const target = event.target as HTMLElement;
    if (!target.closest('.notification-bell-wrapper')) {
      this.showNotifications.set(false);
    }
  }

  loadUnreadCount(): void {
    this.notificationService.getUnreadCount().subscribe({
      next: (res) => this.unreadCount.set(res.count),
    });
  }

  toggleNotifications(): void {
    if (this.showNotifications()) {
      this.showNotifications.set(false);
    } else {
      this.showNotifications.set(true);
      this.loadNotifications();
    }
  }

  loadNotifications(): void {
    this.notificationService.getNotifications().subscribe({
      next: (data) => this.notifications.set(data.slice(0, 10)),
    });
  }

  markNotificationRead(id: number): void {
    this.notificationService.markAsRead(id).subscribe({
      next: () => {
        this.notifications.update(list => list.map(n => n.id === id ? { ...n, read: true } : n));
        this.loadUnreadCount();
      },
    });
  }

  markAllRead(): void {
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.notifications.update(list => list.map(n => ({ ...n, read: true })));
        this.loadUnreadCount();
      },
    });
  }

  closeNotifications(): void {
    this.showNotifications.set(false);
  }

  switchLang(lang: string): void {
    localStorage.setItem('lang', lang);
    this.currentLang.set(lang);
    this.translate.use(lang);
    if (this.showNotifications()) {
      this.loadNotifications();
    }
  }

  toggleDarkMode(): void {
    const next = !this.darkMode();
    this.darkMode.set(next);
    localStorage.setItem('darkMode', String(next));
    this.applyDarkMode(next);
  }

  private applyDarkMode(dark: boolean): void {
    document.documentElement.classList.toggle('dark-mode', dark);
  }

  get isCustomer(): boolean {
    return this.authService.getUser()?.role === 'C';
  }

  get isEmployee(): boolean {
    return this.authService.getUser()?.role === 'D';
  }

  get isAdmin(): boolean {
    return this.authService.getUser()?.role === 'A';
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
