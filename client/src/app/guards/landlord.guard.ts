// src/app/guards/landlord.guard.ts

import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class LandlordGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    const role = this.authService.getUserRole();
    console.log('LandlordGuard - role:', role); // Debug log
    
    // Compare as string to handle both enum and raw string values
    if (role && role.toString().toUpperCase() === 'LANDLORD') {
      return true;
    }
    
    console.log('LandlordGuard - Access denied, redirecting to login');
    this.router.navigate(['/login']);
    return false;
  }
}