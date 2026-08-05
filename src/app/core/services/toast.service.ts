import { Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration: number;
  key?: string;
  params?: Record<string, any>;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private translate = inject(TranslateService);
  toasts = signal<Toast[]>([]);
  private counter = 0;

  private showInternal(message: string, type: Toast['type'] = 'info', duration = 4000, key?: string, params?: Record<string, any>): void {
    const id = ++this.counter;
    const toast: Toast = { id, message, type, duration, key, params };
    this.toasts.update(t => [...t, toast]);
    if (duration > 0) {
      setTimeout(() => this.dismiss(id), duration);
    }
  }

  show(message: string, type: Toast['type'] = 'info', duration = 4000): void {
    this.showInternal(message, type, duration);
  }

  i18nShow(key: string, params?: Record<string, any>, type: Toast['type'] = 'info', duration = 4000): void {
    const message = this.translate.instant(key, params);
    this.showInternal(message, type, duration, key, params);
  }

  success(message: string, duration = 4000): void {
    this.show(message, 'success', duration);
  }

  i18nSuccess(key: string, params?: Record<string, any>, duration = 4000): void {
    this.i18nShow(key, params, 'success', duration);
  }

  error(message: string, duration = 5000): void {
    this.show(message, 'error', duration);
  }

  i18nError(key: string, params?: Record<string, any>, duration = 5000): void {
    this.i18nShow(key, params, 'error', duration);
  }

  info(message: string, duration = 4000): void {
    this.show(message, 'info', duration);
  }

  i18nInfo(key: string, params?: Record<string, any>, duration = 4000): void {
    this.i18nShow(key, params, 'info', duration);
  }

  warning(message: string, duration = 4500): void {
    this.show(message, 'warning', duration);
  }

  i18nWarning(key: string, params?: Record<string, any>, duration = 4500): void {
    this.i18nShow(key, params, 'warning', duration);
  }

  clearAll(): void {
    this.toasts.set([]);
  }

  dismiss(id: number): void {
    this.toasts.update(t => t.filter(toast => toast.id !== id));
  }

  retranslateToasts(): void {
    this.toasts.update(toasts =>
      toasts.map(t => {
        if (t.key) {
          return { ...t, message: this.translate.instant(t.key, t.params) };
        }
        return t;
      })
    );
  }
}
