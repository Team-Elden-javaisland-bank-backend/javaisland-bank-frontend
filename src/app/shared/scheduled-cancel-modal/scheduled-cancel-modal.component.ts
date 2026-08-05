import { Component, ChangeDetectionStrategy, EventEmitter, Input, Output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { CurrencyPipe, DatePipe } from '@angular/common';

@Component({
  selector: 'app-scheduled-cancel-modal',
  standalone: true,
  imports: [TranslatePipe, CurrencyPipe, DatePipe],
  templateUrl: './scheduled-cancel-modal.component.html',
  styleUrl: './scheduled-cancel-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScheduledCancelModalComponent {
  @Input() amount: number = 0;
  @Input() scheduledDate: string | null = null;
  @Input() loading = false;
  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  confirm(): void {
    if (this.loading) return;
    this.confirmed.emit();
  }

  cancel(): void {
    if (this.loading) return;
    this.cancelled.emit();
  }

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('sched-modal-overlay')) {
      this.cancel();
    }
  }
}
