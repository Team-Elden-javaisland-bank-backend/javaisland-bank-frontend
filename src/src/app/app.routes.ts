import { Routes } from '@angular/router';
import { authGuard, roleGuard, limitsSetupGuard, limitsSetupPageGuard, pinSetupPageGuard, pinVerifyPageGuard, loginRedirectGuard } from './core/guards/auth.guard';
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
import { CustomerProfileComponent } from './pages/customer/customer-profile.component';
import { CustomerRequestsComponent } from './pages/customer/customer-requests.component';
import { CustomerNotificationsComponent } from './pages/customer/customer-notifications.component';
import { PinSetupComponent } from './pages/customer/pin-setup.component';
import { PinVerifyComponent } from './pages/customer/pin-verify.component';
import { EmployeeDashboardComponent } from './pages/employee/employee-dashboard.component';
import { EmployeeRegistrationsComponent } from './pages/employee/employee-registrations.component';
import { EmployeeAccountsComponent } from './pages/employee/employee-accounts.component';
import { EmployeeCardsComponent } from './pages/employee/employee-cards.component';
import { EmployeeLimitsComponent } from './pages/employee/employee-limits.component';
import { EmployeeCustomersComponent } from './pages/employee/employee-customers.component';
import { EmployeeRequestsComponent } from './pages/employee/employee-requests.component';
import { AdminDashboardComponent } from './pages/admin/admin-dashboard.component';
import { AdminEmployeesComponent } from './pages/admin/admin-employees.component';
import { AdminAuditLogsComponent } from './pages/admin/admin-audit-logs.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent, canActivate: [loginRedirectGuard] },
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
      { path: 'profile', component: CustomerProfileComponent },
      { path: 'requests', component: CustomerRequestsComponent },
      { path: 'notifications', component: CustomerNotificationsComponent },
    ],
  },
  {
    path: 'customer/limits-setup',
    component: CustomerLimitsSetupComponent,
    canActivate: [limitsSetupPageGuard],
  },
  {
    path: 'customer/pin-setup',
    component: PinSetupComponent,
    canActivate: [pinSetupPageGuard],
  },
  {
    path: 'customer/pin-verify',
    component: PinVerifyComponent,
    canActivate: [pinVerifyPageGuard],
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
      { path: 'customers', component: EmployeeCustomersComponent },
      { path: 'requests', component: EmployeeRequestsComponent },
    ],
  },
  {
    path: 'admin',
    component: LayoutComponent,
    canActivate: [roleGuard('A')],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'employees', component: AdminEmployeesComponent },
      { path: 'audit-logs', component: AdminAuditLogsComponent },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
