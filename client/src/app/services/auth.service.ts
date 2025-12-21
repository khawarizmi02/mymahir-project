import { Injectable, signal, computed } from '@angular/core';
import { AuthApiService } from './auth-api.service';
import { tap } from 'rxjs/operators';
import { UserRole } from '../interfaces/models';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_ROLE_KEY = 'user_role';
  private readonly USER_EMAIL_KEY = 'user_email';

  // Reactive signals for auth state (lazy initialization)
  private userRoleSignal = signal<string | null>(null);
  private tokenSignal = signal<string | null>(null);

  // Public computed signals
  isAuthenticated = computed(() => !!this.tokenSignal());
  userRole$ = computed(() => this.userRoleSignal());
  userEmail$ = computed(() => localStorage.getItem(this.USER_EMAIL_KEY));

  constructor(private authApi: AuthApiService, private router: Router) {
    // Initialize signals on service creation
    this.initializeAuthState();
  }

  // Initialize auth state from localStorage on app startup
  private initializeAuthState() {
    const token = this.authApi.getToken();
    const role = this.getUserRoleSync();
    this.tokenSignal.set(token as string | null);
    this.userRoleSignal.set(role);
  }

  // Get role synchronously from localStorage
  private getUserRoleSync(): string | null {
    return localStorage.getItem(this.USER_ROLE_KEY);
  }

  // 1. The Logic to Login AND Save Data
  loginWithGoogle(idToken: string) {
    return this.authApi.googleLogin(idToken).pipe(
      tap((response: any) => {
        // AuthApiService already saves token via setToken in the tap
        // Check both possible locations for role
        const role = response?.data?.user?.role || response?.data?.role;
        const email = response?.data?.user?.email || response?.data?.email;

        if (role) {
          localStorage.setItem(this.USER_ROLE_KEY, role);
          this.userRoleSignal.set(role);
        }
        if (email) {
          localStorage.setItem(this.USER_EMAIL_KEY, email);
        }
        // Update token signal
        const token = this.authApi.getToken();
        this.tokenSignal.set(token as string | null);
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
          this.userRoleSignal.set(role);
          console.log('AuthService - Role saved to localStorage:', role); // Debug log
        }
        if (email) {
          localStorage.setItem(this.USER_EMAIL_KEY, email);
        }
        // Update token signal
        const token = this.authApi.getToken();
        this.tokenSignal.set(token as string | null);
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
    localStorage.removeItem(this.USER_EMAIL_KEY);

    // Reset signals
    this.tokenSignal.set(null);
    this.userRoleSignal.set(null);

    this.router.navigate(['/login']);
  }
}
