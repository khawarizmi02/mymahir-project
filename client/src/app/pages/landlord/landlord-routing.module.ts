// src/app/pages/landlord/landlord-routing.module.ts

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LandlordDashboardComponent } from './landlord-dashboard.component';
import { PropertyListComponent } from './properties/property-list/property-list.component';
import { PropertyFormComponent } from './properties/property-form/property-form.component';

const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: LandlordDashboardComponent },
  { path: 'properties', component: PropertyListComponent },
  { path: 'properties/add', component: PropertyFormComponent },
  { path: 'properties/edit/:id', component: PropertyFormComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LandlordRoutingModule { }