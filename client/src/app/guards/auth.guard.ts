// src/app/guards/auth.guard.ts

import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    console.log('AuthGuard - CHECKING...');
    console.log('AuthGuard - localStorage token:', localStorage.getItem('token'));
    const isLoggedIn = this.authService.isLoggedIn();
    console.log('AuthGuard - isLoggedIn:', isLoggedIn);
    
    if (isLoggedIn) {
      console.log('AuthGuard - ALLOWED');
      return true;
    }

    console.log('AuthGuard - DENIED, redirecting to login');
    this.router.navigate(['/login']);
    return false;
  }
}