import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  template: `
    @switch (type) {
      @case ('card') {
        <div class="skeleton-card">
          <div class="skeleton-line skeleton-title"></div>
          <div class="skeleton-line skeleton-subtitle"></div>
          <div class="skeleton-line skeleton-body"></div>
          <div class="skeleton-line skeleton-body short"></div>
        </div>
      }
      @case ('table') {
        <div class="skeleton-table">
          @for (r of rowsArr; track r) {
            <div class="skeleton-table-row">
              <div class="skeleton-circle"></div>
              <div class="skeleton-line skeleton-cell"></div>
              <div class="skeleton-line skeleton-cell short"></div>
              <div class="skeleton-line skeleton-cell"></div>
            </div>
          }
        </div>
      }
      @case ('stats') {
        <div class="skeleton-stats">
          @for (s of rowsArr; track s) {
            <div class="skeleton-stat-card">
              <div class="skeleton-line skeleton-stat-value"></div>
              <div class="skeleton-line skeleton-stat-label"></div>
            </div>
          }
        </div>
      }
      @default {
        <div class="skeleton-lines">
          @for (l of rowsArr; track l) {
            <div class="skeleton-line" [class.short]="l % 3 === 0"></div>
          }
        </div>
      }
    }
  `,
  styles: [`
    :host { display: block; }

    .skeleton-line {
      background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 6px;
    }

    .skeleton-card {
      background: #fff;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
      border: 1px solid rgba(0, 0, 0, 0.04);
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .skeleton-title { height: 1.25rem; width: 40%; }
    .skeleton-subtitle { height: 0.875rem; width: 60%; }
    .skeleton-body { height: 0.875rem; width: 100%; }
    .skeleton-body.short { width: 75%; }

    .skeleton-table {
      background: #fff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
      border: 1px solid rgba(0, 0, 0, 0.04);
    }

    .skeleton-table-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.875rem 1rem;
      border-bottom: 1px solid #f8fafc;
    }

    .skeleton-table-row:last-child { border-bottom: none; }

    .skeleton-circle {
      width: 36px; height: 36px; border-radius: 8px; flex-shrink: 0;
      background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }

    .skeleton-cell { height: 0.875rem; flex: 1; }
    .skeleton-cell.short { flex: 0.5; }

    .skeleton-stats {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 1rem;
    }

    .skeleton-stat-card {
      background: #fff;
      border-radius: 12px;
      padding: 1.25rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
      border: 1px solid rgba(0, 0, 0, 0.04);
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      align-items: center;
    }

    .skeleton-stat-value { height: 1.5rem; width: 60%; }
    .skeleton-stat-label { height: 0.75rem; width: 40%; }

    .skeleton-lines {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .skeleton-lines .skeleton-line { height: 0.875rem; width: 100%; }
    .skeleton-lines .skeleton-line.short { width: 65%; }

    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
  `]
})
export class SkeletonComponent {
  @Input() type: 'card' | 'table' | 'stats' | 'lines' = 'lines';
  @Input() rows = 4;

  get rowsArr(): number[] {
    return Array.from({ length: this.rows }, (_, i) => i + 1);
  }
}
