import { Injectable, inject } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class TenantGuard implements CanActivate {
  private authService = inject(AuthService);
  private router = inject(Router);

  canActivate(): boolean {
    console.log('TenantGuard - CHECKING...');
    console.log('TenantGuard - localStorage user_role:', localStorage.getItem('user_role'));
    const role = this.authService.getUserRole();
    console.log('TenantGuard - role from service:', role);
    
    // Compare as string to handle both enum and raw string values
    if (role && role.toString().toUpperCase() === 'TENANT') {
      console.log('TenantGuard - ALLOWED');
      return true;
    }
    
    // If landlord, redirect to landlord dashboard
    if (role && role.toString().toUpperCase() === 'LANDLORD') {
      console.log('TenantGuard - Landlord trying to access tenant area, redirecting');
      this.router.navigate(['/landlord']);
      return false;
    }
    
    console.log('TenantGuard - DENIED, redirecting to login');
    this.router.navigate(['/login']);
    return false;
  }
}
