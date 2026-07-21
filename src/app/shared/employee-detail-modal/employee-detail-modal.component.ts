import { Component, input, output, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { EmployeeDetailDto } from '../../core/services/admin.service';

@Component({
  selector: 'app-employee-detail-modal',
  standalone: true,
  imports: [DatePipe],
  template: `
    @if (visible()) {
      <div class="modal-backdrop-custom" (click)="onClose.emit()"></div>
      <div class="modal-custom" role="dialog" (click)="$event.stopPropagation()">
        <div class="modal-content-custom">
          <div class="modal-header-custom">
            <h5 class="modal-title-custom">
              <i class="bi bi-person-gear me-2"></i>
              Dettaglio Dipendente
            </h5>
            <button class="btn-close-custom" (click)="onClose.emit()">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>

          <div class="modal-body-custom">
            @if (loading()) {
              <div class="d-flex justify-content-center py-5">
                <div class="spinner-border" role="status" style="color: var(--bi-gold) !important;"></div>
              </div>
            } @else if (detail()) {
              @let d = detail()!;

              <div class="employee-profile">
                <div class="employee-avatar">
                  {{ d.firstName.charAt(0) }}{{ d.lastName.charAt(0) }}
                </div>
                <h4 class="employee-name">{{ d.firstName }} {{ d.lastName }}</h4>
                <span class="employee-email">{{ d.email }}</span>
              </div>

              <div class="detail-section">
                <h6 class="detail-section-title">
                  <i class="bi bi-info-circle me-2"></i>
                  Informazioni Dipendente
                </h6>
                <div class="detail-grid">
                  <div class="detail-item">
                    <span class="detail-label">Nome</span>
                    <span class="detail-value">{{ d.firstName }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Cognome</span>
                    <span class="detail-value">{{ d.lastName }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Email</span>
                    <span class="detail-value">{{ d.email }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Data di Nascita</span>
                    <span class="detail-value">{{ d.birthDate | date:'dd/MM/yyyy' }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Stato</span>
                    <span [class]="'status-pill ' + getStatusClass(d.status)">
                      {{ getStatusLabel(d.status) }}
                    </span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Data Creazione</span>
                    <span class="detail-value">{{ d.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
                  </div>
                </div>
              </div>
            } @else {
              <div class="empty-detail">
                <i class="bi bi-exclamation-triangle"></i>
                <span>Impossibile caricare i dettagli del dipendente.</span>
              </div>
            }
          </div>

          <div class="modal-footer-custom">
            <button class="btn btn-secondary" (click)="onClose.emit()">Chiudi</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    :host { display: contents; }

    .modal-backdrop-custom {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 1040;
      animation: fadeIn 0.2s ease;
    }

    .modal-custom {
      position: fixed;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1050;
      padding: 1rem;
      animation: fadeIn 0.2s ease;
    }

    .modal-content-custom {
      background: #fff;
      border-radius: 16px;
      width: 100%;
      max-width: 560px;
      max-height: 85vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
      animation: slideUp 0.25s ease;
    }

    .modal-header-custom {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #f1f5f9;
    }

    .modal-title-custom {
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--bi-navy);
      margin-bottom: 0;
      display: flex;
      align-items: center;
    }

    .btn-close-custom {
      background: none;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      padding: 0.375rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      transition: color 0.2s, background 0.2s;
      font-size: 1rem;
    }

    .btn-close-custom:hover {
      color: var(--bi-navy);
      background: rgba(0, 0, 0, 0.05);
    }

    .modal-body-custom {
      padding: 1.5rem;
      overflow-y: auto;
      flex: 1;
    }

    .modal-footer-custom {
      padding: 1rem 1.5rem;
      border-top: 1px solid #f1f5f9;
      display: flex;
      justify-content: flex-end;
    }

    .employee-profile {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 1.5rem 0;
      margin-bottom: 1.5rem;
      border-bottom: 1px solid #f1f5f9;
    }

    .employee-avatar {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--bi-navy), #172a45);
      color: var(--bi-gold);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      font-weight: 700;
      margin-bottom: 0.75rem;
    }

    .employee-name {
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--bi-navy);
      margin-bottom: 0.25rem;
    }

    .employee-email {
      font-size: 0.8125rem;
      color: #94a3b8;
    }

    .detail-section {
      margin-bottom: 0;
    }

    .detail-section-title {
      font-size: 0.875rem;
      font-weight: 700;
      color: var(--bi-navy);
      margin-bottom: 0.875rem;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid rgba(229, 169, 60, 0.2);
      display: flex;
      align-items: center;
    }

    .detail-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 0.875rem;
    }

    .detail-item {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }

    .detail-label {
      font-size: 0.6875rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #94a3b8;
    }

    .detail-value {
      font-size: 0.875rem;
      color: #1e293b;
      font-weight: 500;
    }

    .empty-detail {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 2rem;
      color: #94a3b8;
      font-size: 0.875rem;
    }

    .empty-detail i {
      font-size: 1.5rem;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @media (max-width: 767.98px) {
      .modal-content-custom {
        max-height: 90vh;
        border-radius: 12px;
      }

      .detail-grid {
        grid-template-columns: 1fr 1fr;
        gap: 0.75rem;
      }
    }

    @media (max-width: 479.98px) {
      .detail-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (prefers-color-scheme: dark) {
      .modal-content-custom {
        background: #1e293b;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      }

      .modal-header-custom {
        border-color: #334155;
      }

      .modal-title-custom { color: #f1f5f9; }

      .btn-close-custom {
        color: #64748b;
      }

      .btn-close-custom:hover {
        color: #e2e8f0;
        background: #334155;
      }

      .modal-footer-custom {
        border-color: #334155;
      }

      .employee-profile {
        border-color: #334155;
      }

      .employee-name { color: #f1f5f9; }
      .employee-email { color: #64748b; }

      .detail-section-title { color: #f1f5f9; }

      .detail-value { color: #e2e8f0; }

      .empty-detail { color: #64748b; }
    }
  `]
})
export class EmployeeDetailModalComponent {
  detail = input<EmployeeDetailDto | null>(null);
  loading = input(false);
  onClose = output<void>();

  visible = computed(() => this.detail() !== null || this.loading());

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      ACTIVE: 'Attivo',
      SUSPENDED: 'Sospeso',
      INACTIVE: 'Inattivo',
    };
    return labels[status] || status;
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      ACTIVE: 'badge-active',
      SUSPENDED: 'badge-frozen',
      INACTIVE: 'badge-closed',
    };
    return classes[status] || 'badge-pending';
  }
}
