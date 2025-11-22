import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { App } from './app';
import { VerifyPin } from './pages/login/verify-pin/verify-pin';
import { Tenant } from './pages/tenant/tenant';

export const routes: Routes = [
  {
    path: '',
    component: App,
  },
  {
    path: 'login',
    component: Login,
  },
  {
    path: 'login/verify',
    component: VerifyPin,
  },
  {
    path: 'tenant',
    component: Tenant,
  },
  {
    path: 'tenant/dashboard',
    component: App,
  },
  {
    path: 'landlord',
    component: App,
  },
  {
    path: 'landlord/dashboard',
    component: App,
  },
];
