import { Component } from '@angular/core';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  template: `
    <div class="toast-container" aria-live="polite" aria-atomic="true">
      @for (toast of toastService.toasts(); track toast.id) {
        <div [class]="'toast-item toast-' + toast.type" role="alert" (click)="toastService.dismiss(toast.id)">
          <div class="toast-icon">
            @switch (toast.type) {
              @case ('success') { <i class="bi bi-check-circle-fill"></i> }
              @case ('error') { <i class="bi bi-x-circle-fill"></i> }
              @case ('warning') { <i class="bi bi-exclamation-triangle-fill"></i> }
              @case ('info') { <i class="bi bi-info-circle-fill"></i> }
            }
          </div>
          <span class="toast-message">{{ toast.message }}</span>
          <button class="toast-close" aria-label="Chiudi notifica">
            <i class="bi bi-x"></i>
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 76px;
      right: 1rem;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      max-width: 400px;
      width: calc(100% - 2rem);
      pointer-events: none;
    }

    .toast-item {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      padding: 0.75rem 1rem;
      border-radius: 10px;
      background: #fff;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
      border-left: 4px solid;
      cursor: pointer;
      pointer-events: auto;
      animation: toastSlideIn 0.3s ease;
      transition: opacity 0.2s, transform 0.2s;
    }

    .toast-item:hover { transform: translateX(-2px); }

    .toast-success { border-color: #059669; }
    .toast-success .toast-icon { color: #059669; }

    .toast-error { border-color: #dc2626; }
    .toast-error .toast-icon { color: #dc2626; }

    .toast-warning { border-color: #d97706; }
    .toast-warning .toast-icon { color: #d97706; }

    .toast-info { border-color: #2563eb; }
    .toast-info .toast-icon { color: #2563eb; }

    .toast-icon { font-size: 1.125rem; flex-shrink: 0; }

    .toast-message {
      flex: 1;
      font-size: 0.8125rem;
      font-weight: 500;
      color: #1e293b;
      line-height: 1.4;
    }

    .toast-close {
      background: none;
      border: none;
      color: #94a3b8;
      font-size: 0.875rem;
      cursor: pointer;
      padding: 0.25rem;
      border-radius: 4px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .toast-close:hover { background: #f1f5f9; color: #475569; }

    @keyframes toastSlideIn {
      from { opacity: 0; transform: translateX(100%); }
      to { opacity: 1; transform: translateX(0); }
    }

    @media (max-width: 575.98px) {
      .toast-container {
        top: 62px;
        right: 0.5rem;
        left: 0.5rem;
        max-width: none;
        width: auto;
      }
    }
  `]
})
export class ToastComponent {
  constructor(public toastService: ToastService) {}
}
