import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService, AuditLogDto, EmployeeDetailDto } from '../../core/services/admin.service';

@Component({
  selector: 'app-admin-audit-logs',
  standalone: true,
  imports: [CommonModule],
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

  readonly actionTypes = [
    { value: '', label: 'Tutti' },
    { value: 'VALIDATE', label: 'Valida' },
    { value: 'REJECT', label: 'Rifiuta' },
    { value: 'FREEZE', label: 'Blocca' },
    { value: 'UNFREEZE', label: 'Sblocca' },
    { value: 'ACTIVATE', label: 'Attiva' }
  ];

  readonly timePeriods = [
    { value: 1, label: '1 giorno' },
    { value: 7, label: '7 giorni' },
    { value: 30, label: '30 giorni' },
    { value: 90, label: '90 giorni' }
  ];

  filteredLogs = computed(() => {
    const action = this.selectedAction();
    const logs = this.logs();
    if (!action) return logs;
    return logs.filter(l => l.action === action);
  });

  logCount = computed(() => this.filteredLogs().length);

  constructor(private adminService: AdminService) {}

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
        this.error.set('Errore nel caricamento dei log di audit');
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
        this.modalError.set('Errore nel caricamento del dettaglio dipendente');
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
    switch (action) {
      case 'VALIDATE': return 'Valida';
      case 'REJECT': return 'Rifiuta';
      case 'FREEZE': return 'Blocca';
      case 'UNFREEZE': return 'Sblocca';
      case 'ACTIVATE': return 'Attiva';
      default: return action;
    }
  }

  formatDateTime(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
