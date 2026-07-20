import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  toasts = signal<Toast[]>([]);
  private counter = 0;

  show(message: string, type: Toast['type'] = 'info', duration = 4000): void {
    const id = ++this.counter;
    const toast: Toast = { id, message, type, duration };
    this.toasts.update(t => [...t, toast]);
    if (duration > 0) {
      setTimeout(() => this.dismiss(id), duration);
    }
  }

  success(message: string, duration = 4000): void {
    this.show(message, 'success', duration);
  }

  error(message: string, duration = 5000): void {
    this.show(message, 'error', duration);
  }

  info(message: string, duration = 4000): void {
    this.show(message, 'info', duration);
  }

  warning(message: string, duration = 4500): void {
    this.show(message, 'warning', duration);
  }

  dismiss(id: number): void {
    this.toasts.update(t => t.filter(toast => toast.id !== id));
  }
}
