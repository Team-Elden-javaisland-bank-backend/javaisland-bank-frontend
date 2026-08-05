import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of, Subject } from 'rxjs';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { CustomerAccountsComponent } from './customer-accounts.component';
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

function makeAccount(
  accountNumber: string,
  statusId: number,
  closureRequestedAt: string | null = null,
): AccountResponseDto {
  return {
    accountNumber,
    balance: 100,
    statusId,
    profileId: 1,
    profileFirstName: 'Alice',
    profileLastName: 'Smith',
    userStatusId: 1,
    initialAmount: null,
    createdAt: '2026-01-01T00:00:00',
    closedAt: null,
    closureRequestedAt,
  };
}

describe('CustomerAccountsComponent', () => {
  function setup(
    accounts: AccountResponseDto[],
    closureRequest = () => of({ messageKey: 'ACCOUNTS.CLOSE_REQUEST_SUCCESS', status: 'PENDING' }),
  ) {
    const customerServiceStub = {
      getAccounts: () => of(accounts),
      closureRequest,
    };

    TestBed.configureTestingModule({
      imports: [CustomerAccountsComponent],
      providers: [
        provideRouter([]),
        { provide: CustomerService, useValue: customerServiceStub },
        { provide: TranslateService, useValue: translateStub },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: { get: () => null } } } },
        ToastService,
      ],
    });

    const toastService = TestBed.inject(ToastService);
    const i18nSuccessSpy = vi.spyOn(toastService, 'i18nSuccess');

    const fixture = TestBed.createComponent(CustomerAccountsComponent);
    fixture.detectChanges();
    return { fixture, toastService, i18nSuccessSpy };
  }

  it('shows translated success toast after closure request, never an empty message', async () => {
    const { fixture, i18nSuccessSpy } = setup([
      makeAccount('IT1', 2),
      makeAccount('IT2', 2),
    ]);
    await fixture.whenStable();

    fixture.componentInstance.closeAccountNumber = 'IT1';
    fixture.componentInstance.requestClosure();
    await fixture.whenStable();

    expect(i18nSuccessSpy).toHaveBeenCalledWith('ACCOUNTS.CLOSE_REQUEST_SUCCESS');
    expect(fixture.componentInstance.showCloseForm()).toBe(false);
    expect(fixture.componentInstance.closeAccountNumber).toBe('');
  });

  it('shows closure-pending badge on account with a pending closure request', async () => {
    const { fixture } = setup([
      makeAccount('IT1', 2),
      makeAccount('IT2', 3, '2026-01-10T10:00:00'),
    ]);
    await fixture.whenStable();
    fixture.detectChanges();

    const pill = fixture.nativeElement.querySelector('.status-pill.closure-pending');
    expect(pill).toBeTruthy();
    expect(pill.textContent?.trim()).toBe('ACCOUNTS.closure_requested_badge');
  });
});
