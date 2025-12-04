import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TenantDashboardComponent } from './tenant-dashboard/tenant-dashboard.component';

const routes: Routes = [
  {
    path: '',
    component: TenantDashboardComponent
  },
  {
    path: 'dashboard',
    component: TenantDashboardComponent
  }
];

@NgModule({
  imports: [
    RouterModule.forChild(routes),
    TenantDashboardComponent
  ]
})
export class TenantModule { }
