import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of, Subject } from 'rxjs';
import { AccountLimitsModalComponent } from './account-limits-modal.component';
import { CustomerService } from '../../core/services/customer.service';
import { ToastService } from '../../core/services/toast.service';
import { TranslateService } from '@ngx-translate/core';
import { AccountResponseDto } from '../../core/models/account/account-response.dto';

const translateStub = {
  instant: (key: string) => key,
  currentLang: 'it',
  translate: (key: string) => signal(key),
  get: (key: string) => of(key),
  onLangChange: new Subject<any>(),
  onTranslationChange: new Subject<any>(),
  onDefaultLangChange: new Subject<any>(),
};

const ALL_LIMITS = [
  { id: 1, limitType: 'ATM_WITHDRAWAL', maxAmount: 300 },
  { id: 2, limitType: 'POS_SPENDING', maxAmount: 2500 },
  { id: 3, limitType: 'DAILY_TRANSFER', maxAmount: 15000 },
  { id: 4, limitType: 'SINGLE_TRANSFER', maxAmount: 10000 },
  { id: 5, limitType: 'INSTANT_TRANSFER_SINGLE', maxAmount: 5000 },
  { id: 6, limitType: 'MONTHLY_TRANSFER', maxAmount: 50000 },
];

const account: AccountResponseDto = {
  accountNumber: 'IT00000000000000001',
  balance: 1000,
  statusId: 2,
  profileId: 1,
  profileFirstName: 'Alice',
  profileLastName: 'Smith',
  userStatusId: 1,
  initialAmount: null,
  createdAt: '2026-07-01T10:00:00',
  closedAt: null,
  isLimitsConfigured: false,
};

describe('AccountLimitsModalComponent', () => {
  function setup(overrides: { getAccountLimits?: any; completeAccountLimitsConfig?: any } = {}) {
    const completeConfig = overrides.completeAccountLimitsConfig ?? (() => of('ok'));
    const customerServiceStub = {
      getAccountLimits: overrides.getAccountLimits ?? (() => of(ALL_LIMITS as any)),
      completeAccountLimitsConfig: completeConfig,
    };

    TestBed.configureTestingModule({
      imports: [AccountLimitsModalComponent],
      providers: [
        { provide: CustomerService, useValue: customerServiceStub },
        { provide: TranslateService, useValue: translateStub },
        ToastService,
      ],
    });

    const fixture = TestBed.createComponent(AccountLimitsModalComponent);
    fixture.componentRef.setInput('account', account);
    fixture.detectChanges();
    return { fixture, customerServiceStub };
  }

  it('renders a blocking modal without a close button', () => {
    const { fixture } = setup();
    fixture.detectChanges();

    const overlay = fixture.nativeElement.querySelector('.limits-modal-overlay');
    const title = fixture.nativeElement.querySelector('.limits-modal-title');
    const closeBtn = fixture.nativeElement.querySelector('.modal-close-btn');

    expect(overlay).toBeTruthy();
    expect(title).toBeTruthy();
    expect(closeBtn).toBeFalsy();
    expect(fixture.nativeElement.querySelector('app-account-limits-form')).toBeTruthy();
  });

  it('stays open when the backdrop is clicked', async () => {
    const { fixture } = setup();
    await fixture.whenStable();
    fixture.detectChanges();

    const overlay = fixture.nativeElement.querySelector('.limits-modal-overlay');
    (overlay as HTMLElement).click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.limits-modal-overlay')).toBeTruthy();
  });

  it('keeps the confirm button disabled until all limits are set', async () => {
    const { fixture } = setup({ getAccountLimits: () => of([]) });
    await fixture.whenStable();
    fixture.detectChanges();

    const btn = fixture.nativeElement.querySelector('.btn-confirm') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it('submits limits, shows success toast and emits completed', async () => {
    const completeSpy = vi.fn(() => of('ok'));
    const { fixture } = setup({ completeAccountLimitsConfig: completeSpy });
    await fixture.whenStable();
    fixture.detectChanges();

    const btn = fixture.nativeElement.querySelector('.btn-confirm') as HTMLButtonElement;
    expect(btn.disabled).toBe(false);

    const completedSpy = vi.fn();
    fixture.componentInstance.completed.subscribe(completedSpy);

    btn.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(completeSpy).toHaveBeenCalledWith('IT00000000000000001');
    expect(completedSpy).toHaveBeenCalled();
  });
});
