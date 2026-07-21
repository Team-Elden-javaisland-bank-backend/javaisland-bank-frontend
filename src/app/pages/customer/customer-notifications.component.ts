import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe, TranslateDirective, TranslateService } from '@ngx-translate/core';
import { NotificationService, NotificationDto } from '../../core/services/notification.service';

@Component({
  selector: 'app-customer-notifications',
  standalone: true,
  imports: [CommonModule, TranslatePipe, TranslateDirective],
  templateUrl: './customer-notifications.html',
  styleUrls: ['./customer-notifications.css']
})
export class CustomerNotificationsComponent implements OnInit {
  private notificationService = inject(NotificationService);
  private translate = inject(TranslateService);

  notifications = signal<NotificationDto[]>([]);
  loading = signal<boolean>(true);
  processingId = signal<number | null>(null);
  markingAll = signal<boolean>(false);

  unreadCount = computed(() =>
    this.notifications().filter(n => !n.read).length
  );

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    this.loading.set(true);
    this.notificationService.getNotifications().subscribe({
      next: (data) => {
        this.notifications.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  markAsRead(notification: NotificationDto): void {
    if (notification.read) return;
    this.processingId.set(notification.id);
    this.notificationService.markAsRead(notification.id).subscribe({
      next: () => {
        this.notifications.update(list =>
          list.map(n => n.id === notification.id ? { ...n, read: true } : n)
        );
        this.processingId.set(null);
      },
      error: () => {
        this.processingId.set(null);
      }
    });
  }

  markAllAsRead(): void {
    if (this.unreadCount() === 0) return;
    this.markingAll.set(true);
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.notifications.update(list =>
          list.map(n => ({ ...n, read: true }))
        );
        this.markingAll.set(false);
      },
      error: () => {
        this.markingAll.set(false);
      }
    });
  }

  getTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      'TRANSFER': 'bi-arrow-left-right',
      'DEPOSIT': 'bi-arrow-down-circle',
      'WITHDRAWAL': 'bi-arrow-up-circle',
      'ACCOUNT': 'bi-person-badge',
      'PASSWORD_CHANGE': 'bi-key',
      'SCHEDULED_TRANSFER': 'bi-clock-history'
    };
    return icons[type] || 'bi-bell';
  }

  getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'TRANSFER': 'NOTIFICATION_TYPE.TRANSFER',
      'DEPOSIT': 'NOTIFICATION_TYPE.DEPOSIT',
      'WITHDRAWAL': 'NOTIFICATION_TYPE.WITHDRAWAL',
      'ACCOUNT': 'NOTIFICATION_TYPE.ACCOUNT',
      'PASSWORD_CHANGE': 'NOTIFICATION_TYPE.PASSWORD_CHANGE',
      'SCHEDULED_TRANSFER': 'NOTIFICATION_TYPE.SCHEDULED_TRANSFER'
    };
    return this.translate.instant(labels[type] || type);
  }

  getTypeBadgeClass(type: string): string {
    const classes: Record<string, string> = {
      'TRANSFER': 'bg-info',
      'DEPOSIT': 'bg-success',
      'WITHDRAWAL': 'bg-warning text-dark',
      'ACCOUNT': 'bg-secondary',
      'PASSWORD_CHANGE': 'bg-danger',
      'SCHEDULED_TRANSFER': 'bg-primary'
    };
    return classes[type] || 'bg-secondary';
  }

  formatDateTime(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
