import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe, TranslateDirective, TranslateService } from '@ngx-translate/core';
import { AdminService, AuditLogDto, EmployeeDetailDto } from '../../core/services/admin.service';

@Component({
  selector: 'app-admin-audit-logs',
  standalone: true,
  imports: [CommonModule, TranslatePipe, TranslateDirective],
  templateUrl: './admin-audit-logs.html',
  styleUrls: ['./admin-audit-logs.css']
})
export class AdminAuditLogsComponent implements OnInit {
  logs = signal<AuditLogDto[]>([]);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);

  selectedAction = signal<string>('');
  selectedDays = signal<number>(7);

  showModal = signal<boolean>(false);
  modalLoading = signal<boolean>(false);
  modalError = signal<string | null>(null);
  selectedEmployee = signal<EmployeeDetailDto | null>(null);

  actionTypes = computed(() => [
    { value: '', label: this.translate.instant('ADMIN.audit.filter_all') },
    { value: 'VALIDATE', label: this.translate.instant('ADMIN.audit.filter_validate') },
    { value: 'REJECT', label: this.translate.instant('ADMIN.audit.filter_reject') },
    { value: 'FREEZE', label: this.translate.instant('ADMIN.audit.filter_freeze') },
    { value: 'UNFREEZE', label: this.translate.instant('ADMIN.audit.filter_unfreeze') },
    { value: 'ACTIVATE', label: this.translate.instant('ADMIN.audit.filter_activate') }
  ]);

  timePeriods = computed(() => [
    { value: 1, label: this.translate.instant('ADMIN.audit.period_1d') },
    { value: 7, label: this.translate.instant('ADMIN.audit.period_7d') },
    { value: 30, label: this.translate.instant('ADMIN.audit.period_30d') },
    { value: 90, label: this.translate.instant('ADMIN.audit.period_90d') }
  ]);

  filteredLogs = computed(() => {
    const action = this.selectedAction();
    const logs = this.logs();
    if (!action) return logs;
    return logs.filter(l => l.action === action);
  });

  logCount = computed(() => this.filteredLogs().length);

  constructor(private adminService: AdminService, private translate: TranslateService) {}

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs(): void {
    this.loading.set(true);
    this.error.set(null);

    this.adminService.getAuditLogs({ recentDays: this.selectedDays() }).subscribe({
      next: (data) => {
        this.logs.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(this.translate.instant('ADMIN.audit.error_load'));
        this.loading.set(false);
        console.error('Audit logs error:', err);
      }
    });
  }

  setActionFilter(action: string): void {
    this.selectedAction.set(action);
  }

  setTimePeriod(days: number): void {
    this.selectedDays.set(days);
    this.loadLogs();
  }

  openPerformerDetail(log: AuditLogDto): void {
    if (!log.performedByUserId) return;

    this.showModal.set(true);
    this.modalLoading.set(true);
    this.modalError.set(null);
    this.selectedEmployee.set(null);

    this.adminService.getEmployeeDetail(log.performedByUserId).subscribe({
      next: (data) => {
        this.selectedEmployee.set(data);
        this.modalLoading.set(false);
      },
      error: (err) => {
        this.modalError.set(this.translate.instant('ADMIN.audit.error_employee_load'));
        this.modalLoading.set(false);
        console.error('Employee detail error:', err);
      }
    });
  }

  closeModal(): void {
    this.showModal.set(false);
    this.selectedEmployee.set(null);
    this.modalError.set(null);
  }

  getActionBadgeClass(action: string): string {
    switch (action) {
      case 'VALIDATE': return 'badge-validate';
      case 'REJECT': return 'badge-reject';
      case 'FREEZE': return 'badge-freeze';
      case 'UNFREEZE': return 'badge-unfreeze';
      case 'ACTIVATE': return 'badge-activate';
      default: return 'badge-secondary';
    }
  }

  getActionIcon(action: string): string {
    switch (action) {
      case 'VALIDATE': return 'bi-check-circle-fill';
      case 'REJECT': return 'bi-x-circle-fill';
      case 'FREEZE': return 'bi-shield-lock-fill';
      case 'UNFREEZE': return 'bi-shield-check-fill';
      case 'ACTIVATE': return 'bi-lightning-fill';
      default: return 'bi-info-circle-fill';
    }
  }

  getActionLabel(action: string): string {
    return this.translate.instant('ADMIN.audit.action_' + action.toLowerCase());
  }

  formatDateTime(dateStr: string): string {
    const d = new Date(dateStr);
    const locale = this.translate.currentLang === 'it' ? 'it-IT' : 'en-GB';
    return d.toLocaleDateString(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
