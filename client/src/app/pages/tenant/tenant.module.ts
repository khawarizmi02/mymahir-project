import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TenantDashboardComponent } from './tenant-dashboard/tenant-dashboard.component';
import { TenantPaymentListComponent } from './payments/payment-list/payment-list.component';
import { TenantPaymentFormComponent } from './payments/payment-form/payment-form.component';
import { ProofUploadComponent } from './payments/proof-upload/proof-upload.component';
import { MaintenanceFormComponent } from './maintenance/maintenance-form/maintenance-form.component';
import { MaintenanceListComponent } from './maintenance/maintenance-list/maintenance-list.component';
import { StripePaymentComponent } from './payments/stripe-payment/stripe-payment.component';

const routes: Routes = [
  {
    path: '',
    component: TenantDashboardComponent
  },
  {
    path: 'dashboard',
    component: TenantDashboardComponent
  },
  {
    path: 'payments',
    component: TenantPaymentListComponent
  },
  {
    path: 'payments/new',
    component: TenantPaymentFormComponent
  },
  {
    path: 'payments/:id/upload-proof',
    component: ProofUploadComponent
  },
  {
    path: 'payments/stripe',
    component: StripePaymentComponent
  },
  {
    path: 'maintenance',
    component: MaintenanceListComponent
  },
  {
    path: 'maintenance/new',
    component: MaintenanceFormComponent
  }
];

@NgModule({
  imports: [
    RouterModule.forChild(routes),
    TenantDashboardComponent,
    TenantPaymentListComponent,
    TenantPaymentFormComponent,
    ProofUploadComponent,
    MaintenanceFormComponent,
    MaintenanceListComponent,
    StripePaymentComponent
  ]
})
export class TenantModule { }
