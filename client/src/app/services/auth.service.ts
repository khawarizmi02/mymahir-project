import { Injectable } from '@angular/core';
import { AuthApiService } from './auth-api.service';
import { tap } from 'rxjs/operators';
import { UserRole } from '../interfaces/models';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_ROLE_KEY = 'user_role';

  constructor(
    private authApi: AuthApiService, 
    private router: Router
  ) {}

  // 1. The Logic to Login AND Save Data
  loginWithGoogle(idToken: string) {
    return this.authApi.googleLogin(idToken).pipe(
      tap((response: any) => {
        // AuthApiService already saves token via setToken in the tap
        // Check both possible locations for role
        const role = response?.data?.user?.role || response?.data?.role;
        if (role) {
          localStorage.setItem(this.USER_ROLE_KEY, role);
        }
      })
    );
  }

  verifyPinLogin(email: string, pin: string) {
    return this.authApi.verifyPin({ email, pin }).pipe(
      tap((response: any) => {
        console.log('AuthService - Full response:', response); // Debug log
        
        // Check both possible locations for role
        const role = response?.data?.user?.role || response?.data?.role;
        console.log('AuthService - Extracted role:', role); // Debug log
        
        if (role) {
          localStorage.setItem(this.USER_ROLE_KEY, role);
          console.log('AuthService - Role saved to localStorage:', role); // Debug log
        }
      })
    );
  }

  isLoggedIn(): boolean {
    const token = this.authApi.getToken();
    console.log('AuthService - Token exists:', !!token); // Debug log
    return !!token;
  }

  getUserRole(): string | null {
    const role = localStorage.getItem(this.USER_ROLE_KEY);
    console.log('AuthService - getUserRole:', role); // Debug log
    return role;
  }

  logout() {
    this.authApi.logout();
    localStorage.removeItem(this.USER_ROLE_KEY);
    this.router.navigate(['/login']);
  }
}