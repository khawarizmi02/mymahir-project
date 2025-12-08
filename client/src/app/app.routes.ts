import { Routes } from '@angular/router';

// Public Pages (Eagerly Loaded)
import { Login } from './pages/login/login';
import { VerifyPin } from './pages/login/verify-pin/verify-pin';
import { AcceptInvitationComponent } from './pages/accept-invitation/accept-invitation.component';
import { PropertiesComponent } from './pages/properties/properties.component';

// Guards
import { AuthGuard } from './guards/auth.guard';
import { LandlordGuard } from './guards/landlord.guard';
import { TenantGuard } from './guards/tenant.guard';

export const routes: Routes = [
  // 1. Default Route: Redirect to public properties page
  {
    path: '',
    redirectTo: 'properties',
    pathMatch: 'full'
  },

  // 2. Public Properties Browsing (No Auth Required)
  {
    path: 'properties',
    component: PropertiesComponent
  },

  // 3. Public Authentication Routes
  {
    path: 'login',
    component: Login
  },
  {
    path: 'login/verify',
    component: VerifyPin
  },

  // 4. Public Invitation Acceptance Route
  {
    path: 'invite/:token',
    component: AcceptInvitationComponent
  },

  // 5. SECURE LANDLORD PORTAL (Lazy Loaded)
  {
    path: 'landlord',
    canActivate: [AuthGuard, LandlordGuard],
    loadChildren: () => import('./pages/landlord/landlord.module').then(m => m.LandlordModule)
  },

  // 6. SECURE TENANT PORTAL (Lazy Loaded)
  {
    path: 'tenant',
    canActivate: [AuthGuard, TenantGuard],
    loadChildren: () => import('./pages/tenant/tenant.module').then(m => m.TenantModule)
  },

  // 7. Wildcard: Catch any weird URLs and send back to properties
  {
    path: '**',
    redirectTo: 'properties'
  }
];
