// src/app/pages/landlord/landlord-routing.module.ts

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LandlordDashboardComponent } from './landlord-dashboard.component';
import { PropertyListComponent } from './properties/property-list/property-list.component';
import { PropertyFormComponent } from './properties/property-form/property-form.component';
import { LeaseListComponent } from './leases/lease-list/lease-list.component';
import { LeaseFormComponent } from './leases/lease-form/lease-form.component';
import { LandlordPaymentListComponent } from './payments/payment-list/payment-list.component';
import { LandlordMaintenanceListComponent } from './maintenance/landlord-maintenance-list.component';
import { LandlordMaintenanceDetailComponent } from './maintenance/landlord-maintenance-detail.component';

const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: LandlordDashboardComponent },
  { path: 'properties', component: PropertyListComponent },
  { path: 'properties/add', component: PropertyFormComponent },
  { path: 'properties/edit/:id', component: PropertyFormComponent },
  { path: 'leases', component: LeaseListComponent },
  { path: 'leases/new', component: LeaseFormComponent },
  { path: 'payments', component: LandlordPaymentListComponent },
  { path: 'maintenance', component: LandlordMaintenanceListComponent },
  { path: 'maintenance/:id', component: LandlordMaintenanceDetailComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LandlordRoutingModule {}
