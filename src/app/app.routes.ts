import { Routes } from '@angular/router';
import { authGuard, roleGuard, limitsSetupGuard, limitsSetupPageGuard } from './core/guards/auth.guard';
import { LayoutComponent } from './layout/layout.component';
import { LoginComponent } from './pages/auth/login.component';
import { RegisterComponent } from './pages/auth/register.component';
import { CustomerDashboardComponent } from './pages/customer/customer-dashboard.component';
import { CustomerAccountsComponent } from './pages/customer/customer-accounts.component';
import { CustomerAccountDetailComponent } from './pages/customer/customer-account-detail.component';
import { CustomerTransactionsComponent } from './pages/customer/customer-transactions.component';
import { CustomerBeneficiariesComponent } from './pages/customer/customer-beneficiaries.component';
import { CustomerCardsComponent } from './pages/customer/customer-cards.component';
import { CustomerLimitsComponent } from './pages/customer/customer-limits.component';
import { CustomerLimitsSetupComponent } from './pages/customer/customer-limits-setup.component';
import { CustomerSavedBeneficiariesComponent } from './pages/customer/customer-saved-beneficiaries.component';
import { EmployeeDashboardComponent } from './pages/employee/employee-dashboard.component';
import { EmployeeRegistrationsComponent } from './pages/employee/employee-registrations.component';
import { EmployeeAccountsComponent } from './pages/employee/employee-accounts.component';
import { EmployeeCardsComponent } from './pages/employee/employee-cards.component';
import { EmployeeLimitsComponent } from './pages/employee/employee-limits.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: 'customer',
    component: LayoutComponent,
    canActivate: [roleGuard('C'), limitsSetupGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: CustomerDashboardComponent },
      { path: 'accounts', component: CustomerAccountsComponent },
      { path: 'accounts/:accountNumber', component: CustomerAccountDetailComponent },
      { path: 'transactions', component: CustomerTransactionsComponent },
      { path: 'beneficiaries', component: CustomerBeneficiariesComponent },
      { path: 'limits', component: CustomerLimitsComponent },
      { path: 'cards', component: CustomerCardsComponent },
      { path: 'saved-beneficiaries', component: CustomerSavedBeneficiariesComponent },
    ],
  },
  {
    path: 'customer/limits-setup',
    component: CustomerLimitsSetupComponent,
    canActivate: [limitsSetupPageGuard],
  },
  {
    path: 'employee',
    component: LayoutComponent,
    canActivate: [roleGuard('D')],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: EmployeeDashboardComponent },
      { path: 'registrations', component: EmployeeRegistrationsComponent },
      { path: 'accounts', component: EmployeeAccountsComponent },
      { path: 'limits', component: EmployeeLimitsComponent },
      { path: 'cards', component: EmployeeCardsComponent },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
