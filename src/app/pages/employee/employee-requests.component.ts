import { Component, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { TranslatePipe, TranslateDirective } from '@ngx-translate/core';
import { EmployeeService } from '../../core/services/employee.service';
import { EmployeeUserDetailDto } from '../../core/models/user/employee-user-detail.dto';

interface EmployeeRequestDto {
  id: number;
  type: string;
  status: string;
  description: string;
  userId: number;
  userFirstName: string;
  userLastName: string;
  userEmail: string;
  accountNumber: string;
  createdAt: string;
  processedAt: string | null;
}

type RequestType = 'ALL' | 'PASSWORD_CHANGE' | 'ACCOUNT_OPENING' | 'ACCOUNT_CLOSURE';
type StatusTab = 'PENDING' | 'APPROVED' | 'REJECTED';

@Component({
  selector: 'app-employee-requests',
  imports: [FormsModule, DatePipe, CurrencyPipe, TranslatePipe, TranslateDirective],
  templateUrl: './employee-requests.html',
  styleUrls: ['./employee-requests.css'],
})
export class EmployeeRequestsComponent implements OnInit {
  allRequests = signal<EmployeeRequestDto[]>([]);
  loading = signal(true);
  message = signal('');
  messageType = signal<'success' | 'error'>('success');

  activeType = signal<RequestType>('ALL');
  activeStatus = signal<StatusTab>('PENDING');
  searchQuery = signal('');
  sortField = signal<'createdAt' | 'userFirstName'>('createdAt');
  sortOrder = signal<'desc' | 'asc'>('desc');

  userDetail = signal<EmployeeUserDetailDto | null>(null);
  userDetailLoading = signal(false);
  showUserModal = signal(false);

  filteredRequests = computed(() => {
    let reqs = this.allRequests();

    if (this.activeType() !== 'ALL') {
      reqs = reqs.filter(r => r.type === this.activeType());
    }

    reqs = reqs.filter(r => r.status === this.activeStatus());

    const q = this.searchQuery().toLowerCase().trim();
    if (q) {
      reqs = reqs.filter(r =>
        r.userFirstName?.toLowerCase().includes(q) ||
        r.userLastName?.toLowerCase().includes(q) ||
        r.userEmail?.toLowerCase().includes(q) ||
        r.accountNumber?.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q)
      );
    }

    reqs = [...reqs].sort((a, b) => {
      let valA: string;
      let valB: string;
      if (this.sortField() === 'createdAt') {
        valA = a.createdAt || '';
        valB = b.createdAt || '';
      } else {
        valA = (a.userFirstName || '').toLowerCase();
        valB = (b.userFirstName || '').toLowerCase();
      }
      return this.sortOrder() === 'desc'
        ? valB.localeCompare(valA)
        : valA.localeCompare(valB);
    });

    return reqs;
  });

  typeCounts = computed(() => {
    const pending = this.allRequests().filter(r => r.status === 'PENDING');
    return {
      ALL: pending.length,
      PASSWORD_CHANGE: pending.filter(r => r.type === 'PASSWORD_CHANGE').length,
      ACCOUNT_OPENING: pending.filter(r => r.type === 'ACCOUNT_OPENING').length,
      ACCOUNT_CLOSURE: pending.filter(r => r.type === 'ACCOUNT_CLOSURE').length,
    };
  });

  statusCounts = computed(() => {
    let reqs = this.allRequests();
    if (this.activeType() !== 'ALL') {
      reqs = reqs.filter(r => r.type === this.activeType());
    }
    return {
      PENDING: reqs.filter(r => r.status === 'PENDING').length,
      APPROVED: reqs.filter(r => r.status === 'APPROVED').length,
      REJECTED: reqs.filter(r => r.status === 'REJECTED').length,
    };
  });

  constructor(private employeeService: EmployeeService) {}

  ngOnInit(): void {
    this.loadRequests();
  }

  loadRequests(): void {
    this.loading.set(true);
    this.employeeService.getAllRequests().subscribe({
      next: (data) => {
        this.allRequests.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  setType(type: RequestType): void {
    this.activeType.set(type);
  }

  setStatus(status: StatusTab): void {
    this.activeStatus.set(status);
  }

  toggleSort(field: 'createdAt' | 'userFirstName'): void {
    if (this.sortField() === field) {
      this.sortOrder.set(this.sortOrder() === 'desc' ? 'asc' : 'desc');
    } else {
      this.sortField.set(field);
      this.sortOrder.set('desc');
    }
  }

  viewUser(userId: number): void {
    this.showUserModal.set(true);
    this.userDetailLoading.set(true);
    this.employeeService.getUserDetailByUserId(userId).subscribe({
      next: (data) => {
        this.userDetail.set(data);
        this.userDetailLoading.set(false);
      },
      error: () => this.userDetailLoading.set(false),
    });
  }

  closeUserModal(): void {
    this.showUserModal.set(false);
    this.userDetail.set(null);
  }

  approve(req: EmployeeRequestDto): void {
    if (!confirm('Confermare approvazione?')) return;

    switch (req.type) {
      case 'PASSWORD_CHANGE':
        this.employeeService.approvePasswordRequest(req.id).subscribe({
          next: (res) => { this.toast(res, 'success'); this.loadRequests(); },
          error: (err) => this.toast(err.message, 'error'),
        });
        break;
      case 'ACCOUNT_OPENING':
        this.employeeService.activateAccount(req.accountNumber).subscribe({
          next: (res) => { this.toast(res, 'success'); this.loadRequests(); },
          error: (err) => this.toast(err.message, 'error'),
        });
        break;
      case 'ACCOUNT_CLOSURE':
        this.employeeService.validateClosure(req.accountNumber).subscribe({
          next: (res) => { this.toast(res, 'success'); this.loadRequests(); },
          error: (err) => this.toast(err.message, 'error'),
        });
        break;
    }
  }

  reject(req: EmployeeRequestDto): void {
    if (!confirm('Confermare rifiuto?')) return;

    switch (req.type) {
      case 'PASSWORD_CHANGE':
        this.employeeService.rejectPasswordRequest(req.id).subscribe({
          next: (res) => { this.toast(res, 'success'); this.loadRequests(); },
          error: (err) => this.toast(err.message, 'error'),
        });
        break;
      case 'ACCOUNT_OPENING':
        this.employeeService.rejectAccount(req.accountNumber).subscribe({
          next: (res) => { this.toast(res, 'success'); this.loadRequests(); },
          error: (err) => this.toast(err.message, 'error'),
        });
        break;
      case 'ACCOUNT_CLOSURE':
        this.employeeService.rejectClosure(req.accountNumber).subscribe({
          next: (res) => { this.toast(res, 'success'); this.loadRequests(); },
          error: (err) => this.toast(err.message, 'error'),
        });
        break;
    }
  }

  getTypeIcon(type: string): string {
    switch (type) {
      case 'PASSWORD_CHANGE': return 'bi-key';
      case 'ACCOUNT_OPENING': return 'bi-bank';
      case 'ACCOUNT_CLOSURE': return 'bi-lock';
      default: return 'bi-question-circle';
    }
  }

  getTypeLabel(type: string): string {
    switch (type) {
      case 'PASSWORD_CHANGE': return 'Cambio Password';
      case 'ACCOUNT_OPENING': return 'Apertura Conto';
      case 'ACCOUNT_CLOSURE': return 'Chiusura Conto';
      default: return type;
    }
  }

  private toast(msg: string, type: 'success' | 'error'): void {
    this.message.set(msg);
    this.messageType.set(type);
  }
}
