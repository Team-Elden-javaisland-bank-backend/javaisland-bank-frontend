import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  template: `
    <div class="empty-state-card" [class.compact]="compact">
      <div class="empty-state-icon" [style.background]="iconBg" [style.color]="iconColor">
        <i [class]="icon"></i>
      </div>
      <h6 class="empty-state-title">{{ title }}</h6>
      <p class="empty-state-text">{{ message }}</p>
      @if (actionLabel) {
        <button class="empty-state-btn" (click)="actionClick.emit()">
          @if (actionIcon) { <i [class]="actionIcon + ' me-1'"></i> }{{ actionLabel }}
        </button>
      }
    </div>
  `,
  styles: [`
    .empty-state-card {
      background: #fff;
      border-radius: 12px;
      padding: 3rem 2rem;
      text-align: center;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
      border: 1px dashed rgba(0, 0, 0, 0.1);
    }
    .empty-state-card.compact { padding: 2rem 1.5rem; }
    .empty-state-icon {
      width: 64px; height: 64px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.5rem; margin: 0 auto 1rem;
    }
    .compact .empty-state-icon { width: 48px; height: 48px; font-size: 1.125rem; margin-bottom: 0.75rem; }
    .empty-state-title { font-weight: 700; color: var(--bi-navy, #0a192f); margin-bottom: 0.5rem; }
    .compact .empty-state-title { font-size: 0.875rem; }
    .empty-state-text { color: #94a3b8; font-size: 0.875rem; margin-bottom: 1rem; }
    .compact .empty-state-text { font-size: 0.8125rem; margin-bottom: 0.75rem; }
    .empty-state-btn {
      display: inline-flex; align-items: center; padding: 0.625rem 1.125rem;
      border-radius: 8px; border: none; background: var(--bi-navy, #0a192f);
      color: #fff; font-size: 0.8125rem; font-weight: 600; cursor: pointer;
      transition: all 0.2s;
    }
    .empty-state-btn:hover { background: #0f2744; }
  `]
})
export class EmptyStateComponent {
  @Input() icon = 'bi bi-inbox';
  @Input() iconBg = 'rgba(229, 169, 60, 0.1)';
  @Input() iconColor = '#e5a93c';
  @Input() title = 'Nessun dato';
  @Input() message = '';
  @Input() actionLabel = '';
  @Input() actionIcon = '';
  @Input() compact = false;

  @Output() actionClick = new EventEmitter<void>();
}
