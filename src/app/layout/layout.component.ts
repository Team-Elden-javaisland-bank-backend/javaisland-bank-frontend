import { Component, ChangeDetectionStrategy, signal, OnInit, OnDestroy, HostListener, ElementRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { NotificationService, NotificationDto } from '../core/services/notification.service';
import { CustomerService } from '../core/services/customer.service';
import { AccountResponseDto } from '../core/models/account/account-response.dto';
import { AccountLimitsModalComponent } from '../shared/account-limits-modal/account-limits-modal.component';
import { Router } from '@angular/router';
import { ToastComponent } from '../core/components/toast/toast.component';
import { ToastService } from '../core/services/toast.service';
import { routeAnimation } from '../core/animations/route.animations';
import { Subscription, interval } from 'rxjs';
import { filter } from 'rxjs/operators';
import { TranslateService, TranslatePipe, TranslateDirective } from '@ngx-translate/core';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-layout',
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, ToastComponent, TranslatePipe, TranslateDirective, AccountLimitsModalComponent],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
  animations: [routeAnimation],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutComponent implements OnInit, OnDestroy {
  mobileMenuOpen = signal(false);
  showUploadModal = signal(false);
  uploading = signal(false);
  uploadErrorKey = signal<string | null>(null);
  unreadCount = signal(0);
  showNotifications = signal(false);
  notifications = signal<NotificationDto[]>([]);
  limitsModalAccount = signal<AccountResponseDto | null>(null);
  private pollSub: Subscription | null = null;
  private navSub: Subscription | null = null;

  private fileInput: HTMLInputElement | null = null;

  currentLang = signal(localStorage.getItem('lang') || 'it');

  constructor(
    public authService: AuthService,
    private router: Router,
    private notificationService: NotificationService,
    private customerService: CustomerService,
    public translate: TranslateService,
    private toastService: ToastService,
    private elRef: ElementRef,
  ) {}

  ngOnInit(): void {
    if (this.isCustomer) {
      this.loadUnreadCount();
      this.pollSub = interval(10000).subscribe(() => this.loadUnreadCount());
      this.navSub = this.router.events
        .pipe(filter(e => e instanceof NavigationEnd))
        .subscribe(() => this.checkLimitsSetup());
      this.checkLimitsSetup();
    }
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
    this.navSub?.unsubscribe();
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

  checkLimitsSetup(): void {
    if (!this.isCustomer || this.limitsModalAccount()) return;
    this.customerService.getAccounts().subscribe({
      next: (accounts) => {
        const pending = accounts.find(a => a.statusId === 2 && !a.isLimitsConfigured);
        if (pending) {
          this.limitsModalAccount.set(pending);
        }
      },
      error: () => {},
    });
  }

  onLimitsModalCompleted(): void {
    this.limitsModalAccount.set(null);
    this.checkLimitsSetup();
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
      error: () => {},
    });
  }

  markAllRead(): void {
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.notifications.update(list => list.map(n => ({ ...n, read: true })));
        this.loadUnreadCount();
      },
      error: () => {},
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
    return environment.apiUrl;
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
    this.uploadErrorKey.set(null);
    this.showUploadModal.set(true);
  }

  closeUploadModal(): void {
    this.showUploadModal.set(false);
    this.uploadErrorKey.set(null);
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
    this.uploadErrorKey.set(null);

    this.authService.uploadProfilePicture(file).subscribe({
      next: () => {
        this.uploading.set(false);
        this.closeUploadModal();
        this.toastService.i18nSuccess('PROFILE.picture_uploaded');
      },
      error: (err: Error) => {
        this.uploading.set(false);
        this.uploadErrorKey.set(err.message);
        this.toastService.error(err.message || '');
      },
    });
  }

  removePicture(): void {
    this.authService.deleteProfilePicture().subscribe({
      next: () => {
        this.closeUploadModal();
        this.toastService.i18nSuccess('PROFILE.picture_removed');
      },
      error: (err: Error) => {
        this.uploadErrorKey.set(err.message);
        this.toastService.error(err.message || '');
      },
    });
  }
}
