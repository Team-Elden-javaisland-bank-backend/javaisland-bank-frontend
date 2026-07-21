import { Component, input, output, signal, computed, OnInit, effect } from '@angular/core';
import { DatePipe } from '@angular/common';
import { EmployeeUserDetailDto } from '../../core/models/user/employee-user-detail.dto';

@Component({
  selector: 'app-user-detail-modal',
  standalone: true,
  imports: [DatePipe],
  template: `
    @if (visible()) {
      <div class="modal-backdrop-custom" (click)="onClose.emit()"></div>
      <div class="modal-custom" role="dialog" (click)="$event.stopPropagation()">
        <div class="modal-content-custom">
          <div class="modal-header-custom">
            <h5 class="modal-title-custom">
              <i class="bi bi-person-badge me-2"></i>
              Dettaglio Utente
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

              <!-- Personal Info -->
              <div class="detail-section">
                <h6 class="detail-section-title">
                  <i class="bi bi-person me-2"></i>
                  Informazioni Personali
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
                    <span class="detail-label">Username</span>
                    <span class="detail-value mono">{{ d.username }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Email</span>
                    <span class="detail-value">{{ d.email }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Telefono</span>
                    <span class="detail-value">{{ d.phone }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Codice Fiscale</span>
                    <span class="detail-value mono">{{ d.fiscalCode }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Data di Nascita</span>
                    <span class="detail-value">{{ d.birthDate | date:'dd/MM/yyyy' }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Luogo di Nascita</span>
                    <span class="detail-value">{{ d.birthPlace }} ({{ d.birthProvince }})</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Sesso</span>
                    <span class="detail-value">{{ d.gender }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Professione</span>
                    <span class="detail-value">{{ d.profession }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Residenza</span>
                    <span class="detail-value">{{ d.residence }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Stato Utente</span>
                    <span [class]="'status-pill ' + getUserStatusClass(d.userStatus)">
                      {{ getUserStatusLabel(d.userStatus) }}
                    </span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Registrato il</span>
                    <span class="detail-value">{{ d.userCreatedAt | date:'dd/MM/yyyy HH:mm' }}</span>
                  </div>
                </div>
              </div>

              <!-- Account -->
              <div class="detail-section">
                <h6 class="detail-section-title">
                  <i class="bi bi-wallet2 me-2"></i>
                  Conto Corrente
                </h6>
                <div class="detail-grid">
                  <div class="detail-item">
                    <span class="detail-label">Numero Conto</span>
                    <span class="detail-value mono">{{ d.accountNumber }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Saldo</span>
                    <span class="detail-value account-balance-value">{{ formatCurrency(d.balance) }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Stato Conto</span>
                    <span [class]="'status-pill ' + getAccountStatusClass(d.accountStatus)">
                      {{ getAccountStatusLabel(d.accountStatus) }}
                    </span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Conto Creato il</span>
                    <span class="detail-value">{{ d.accountCreatedAt | date:'dd/MM/yyyy HH:mm' }}</span>
                  </div>
                  @if (d.closedAt) {
                    <div class="detail-item">
                      <span class="detail-label">Conto Chiuso il</span>
                      <span class="detail-value">{{ d.closedAt | date:'dd/MM/yyyy HH:mm' }}</span>
                    </div>
                  }
                </div>
              </div>

              <!-- Cards -->
              @if (d.cards && d.cards.length > 0) {
                <div class="detail-section">
                  <h6 class="detail-section-title">
                    <i class="bi bi-credit-card me-2"></i>
                    Carte ({{ d.cards.length }})
                  </h6>
                  <div class="cards-grid">
                    @for (card of d.cards; track card.id) {
                      <div class="card-item">
                        <div class="card-item-header">
                          <span [class]="'status-pill status-pill-sm ' + getCardStatusClass(card.cardStatus)">
                            {{ getCardStatusLabel(card.cardStatus) }}
                          </span>
                          <span class="card-type-label">{{ card.cardType }}</span>
                        </div>
                        <div class="card-item-number mono">{{ card.maskedCardNumber }}</div>
                        <div class="card-item-details">
                          <div class="card-detail-row">
                            <span class="detail-label-sm">Titolare</span>
                            <span class="detail-value-sm">{{ card.holderName }}</span>
                          </div>
                          <div class="card-detail-row">
                            <span class="detail-label-sm">Scadenza</span>
                            <span class="detail-value-sm mono">{{ card.expirationDate }}</span>
                          </div>
                          <div class="card-detail-row">
                            <span class="detail-label-sm">CVV</span>
                            <span class="detail-value-sm mono">{{ card.cvv }}</span>
                          </div>
                          @if (card.fullCardNumber) {
                            <div class="card-detail-row">
                              <span class="detail-label-sm">Numero Completo</span>
                              <span class="detail-value-sm mono">{{ card.fullCardNumber }}</span>
                            </div>
                          }
                        </div>
                      </div>
                    }
                  </div>
                </div>
              } @else {
                <div class="detail-section">
                  <h6 class="detail-section-title">
                    <i class="bi bi-credit-card me-2"></i>
                    Carte
                  </h6>
                  <div class="no-cards-msg">
                    <i class="bi bi-credit-card-2-front"></i>
                    <span>Nessuna carta associata a questo conto</span>
                  </div>
                </div>
              }
            } @else {
              <div class="empty-detail">
                <i class="bi bi-exclamation-triangle"></i>
                <span>Impossibile caricare i dettagli dell'utente.</span>
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
      max-width: 720px;
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

    .detail-section {
      margin-bottom: 1.5rem;
    }

    .detail-section:last-child {
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

    .detail-label-sm {
      font-size: 0.625rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #94a3b8;
    }

    .detail-value-sm {
      font-size: 0.8125rem;
      color: #1e293b;
    }

    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 0.875rem;
    }

    .card-item {
      background: linear-gradient(135deg, var(--bi-navy), #172a45);
      border-radius: 12px;
      padding: 1rem 1.25rem;
      color: #fff;
    }

    .card-item-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.75rem;
    }

    .card-type-label {
      font-size: 0.6875rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: rgba(255, 255, 255, 0.6);
    }

    .card-item-number {
      font-size: 1.125rem;
      font-weight: 600;
      letter-spacing: 2px;
      margin-bottom: 0.875rem;
      color: rgba(255, 255, 255, 0.95);
    }

    .card-item-details {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }

    .card-detail-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .card-detail-row .detail-label-sm {
      color: rgba(255, 255, 255, 0.5);
    }

    .card-detail-row .detail-value-sm {
      color: rgba(255, 255, 255, 0.9);
    }

    .no-cards-msg,
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

    .no-cards-msg i,
    .empty-detail i {
      font-size: 1.5rem;
    }

    .account-balance-value {
      color: var(--bi-gold-dark, #c8912a);
      font-weight: 700;
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

      .cards-grid {
        grid-template-columns: 1fr;
      }

      .card-item {
        padding: 0.875rem 1rem;
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

      .detail-section-title { color: #f1f5f9; }

      .detail-value { color: #e2e8f0; }

      .detail-value-sm { color: #e2e8f0; }

      .card-item {
        background: linear-gradient(135deg, #0f172a, #1a2744);
      }

      .no-cards-msg { color: #64748b; }
      .empty-detail { color: #64748b; }
    }
  `]
})
export class UserDetailModalComponent {
  detail = input<EmployeeUserDetailDto | null>(null);
  loading = input(false);
  onClose = output<void>();

  visible = computed(() => this.detail() !== null || this.loading());

  getUserStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      ACTIVE: 'Attivo',
      INACTIVE: 'Inattivo',
      PENDING: 'In attesa',
    };
    return labels[status] || status;
  }

  getUserStatusClass(status: string): string {
    const classes: Record<string, string> = {
      ACTIVE: 'badge-active',
      INACTIVE: 'badge-closed',
      PENDING: 'badge-pending',
    };
    return classes[status] || 'badge-pending';
  }

  getAccountStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      ACTIVE: 'Attivo',
      FROZEN: 'Sospeso',
      CLOSED: 'Chiuso',
      PENDING: 'In attesa',
      REJECTED: 'Rifiutato',
    };
    return labels[status] || status;
  }

  getAccountStatusClass(status: string): string {
    const classes: Record<string, string> = {
      ACTIVE: 'badge-active',
      FROZEN: 'badge-frozen',
      CLOSED: 'badge-closed',
      PENDING: 'badge-pending',
      REJECTED: 'badge-rejected',
    };
    return classes[status] || 'badge-pending';
  }

  getCardStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      ACTIVE: 'Attiva',
      INACTIVE: 'Inattiva',
      BLOCKED: 'Bloccata',
    };
    return labels[status] || status;
  }

  getCardStatusClass(status: string): string {
    const classes: Record<string, string> = {
      ACTIVE: 'badge-active',
      INACTIVE: 'badge-pending',
      BLOCKED: 'badge-closed',
    };
    return classes[status] || 'badge-pending';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  }
}
