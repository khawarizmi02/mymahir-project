import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TenantDashboardComponent } from './tenant-dashboard/tenant-dashboard.component';
import { TenantPaymentListComponent } from './payments/payment-list/payment-list.component';
import { TenantPaymentFormComponent } from './payments/payment-form/payment-form.component';
import { ProofUploadComponent } from './payments/proof-upload/proof-upload.component';

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
  }
];

@NgModule({
  imports: [
    RouterModule.forChild(routes),
    TenantDashboardComponent,
    TenantPaymentListComponent,
    TenantPaymentFormComponent,
    ProofUploadComponent
  ]
})
export class TenantModule { }
