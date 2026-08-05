import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of, Subject } from 'rxjs';
import { CustomerTransactionsComponent } from './customer-transactions.component';
import { CustomerService } from '../../core/services/customer.service';
import { ToastService } from '../../core/services/toast.service';
import { TranslateService } from '@ngx-translate/core';
import { TransactionResponseDto } from '../../core/models/transaction/transaction-response.dto';

function makeTx(
  id: number,
  statusName: string,
  scheduledDate: string | null,
): TransactionResponseDto {
  return {
    id,
    amount: 100,
    typeId: 3,
    statusId: statusName === 'PENDING' ? 1 : 2,
    typeName: 'TRANSFER',
    statusName,
    description: 'Test',
    createdAt: '2026-07-01T10:00:00',
    scheduledDate,
    sourceAccountNumber: 'IT00000000000000001',
    destinationAccountNumber: 'IT00000000000000002',
    sourceUserName: 'Alice',
    destinationUserName: 'Bob',
    sourceBalanceAfter: 0,
    destBalanceAfter: 0,
  };
}

describe('CustomerTransactionsComponent', () => {
  const translateStub = {
    instant: (key: string) => key,
    currentLang: 'it',
    translate: (key: string) => signal(key),
    get: (key: string) => of(key),
    onLangChange: new Subject<any>(),
    onTranslationChange: new Subject<any>(),
    onDefaultLangChange: new Subject<any>(),
  };

  function setup(transactions: TransactionResponseDto[]) {
    const customerServiceStub = {
      getAllTransactions: () =>
        of({
          content: transactions,
          totalPages: 1,
          page: 0,
          size: 20,
          totalElements: transactions.length,
          last: true,
        }),
      getAccounts: () => of([]),
      cancelTransaction: () => of({ message: 'ok' }),
    };

    TestBed.configureTestingModule({
      imports: [CustomerTransactionsComponent],
      providers: [
        { provide: CustomerService, useValue: customerServiceStub },
        { provide: TranslateService, useValue: translateStub },
        ToastService,
      ],
    });

    return TestBed.createComponent(CustomerTransactionsComponent);
  }

  it('shows cancel button only on scheduled (PENDING) transactions', async () => {
    const fixture = setup([
      makeTx(1, 'PENDING', '2026-08-10T00:00:00'),
      makeTx(2, 'COMPLETED', null),
    ]);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll('.tx-cancel-btn');
    expect(buttons.length).toBe(2);
  });

  it('does not show cancel button on failed transactions', async () => {
    const fixture = setup([
      makeTx(1, 'FAILED', null),
      makeTx(2, 'COMPLETED', null),
    ]);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll('.tx-cancel-btn');
    expect(buttons.length).toBe(0);
  });

  it('opens the confirm modal when cancel is clicked', async () => {
    const fixture = setup([
      makeTx(1, 'PENDING', '2026-08-10T00:00:00'),
      makeTx(2, 'COMPLETED', null),
    ]);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const btn = fixture.nativeElement.querySelector('.tx-cancel-btn') as HTMLButtonElement;
    btn.click();
    fixture.detectChanges();

    const modal = fixture.nativeElement.querySelector('app-scheduled-cancel-modal');
    expect(modal).toBeTruthy();
  });

  it('translates CANCELLED status through the i18n key, never raw', async () => {
    const fixture = setup([
      makeTx(1, 'CANCELLED', null),
    ]);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const badges = fixture.nativeElement.querySelectorAll('.status-badge');
    expect(badges.length).toBeGreaterThan(0);
    for (const badge of Array.from(badges) as HTMLElement[]) {
      expect(badge.textContent?.trim()).toBe('TRANSACTIONS.STATUS.CANCELLED');
    }
  });

  it('translates the cancellation description marker instead of raw English text', async () => {
    const fixture = setup([
      {
        ...makeTx(1, 'CANCELLED', null),
        description: 'Bonifico Programmato - TRANSACTION_CANCELLED_BY_USER',
      },
    ]);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const cells = fixture.nativeElement.querySelectorAll('.tx-desc');
    expect(cells.length).toBeGreaterThan(0);
    for (const cell of Array.from(cells) as HTMLElement[]) {
      expect(cell.textContent).not.toContain('Cancelled by user');
      expect(cell.textContent).toContain('TRANSACTIONS.cancelled_by_user');
    }
  });
});
