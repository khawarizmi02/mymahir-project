import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment.development';
import { Observable, tap } from 'rxjs';
import {
  AuthRes,
  AuthResponse,
  PinRequestDto,
  PinVerifyDto,
  UserLogin,
} from '../interfaces/auth.data';
import { DataService } from './data.service';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class AuthApiService {
  public baseUrl: string = environment.apiUrl + '/auth';
  private http = inject(HttpClient);
  private dataService = inject(DataService);
  private readonly TOKEN_KEY = 'token';

  /**
   * @deprecated
   * @param user {@link UserLogin}
   * @returns {@link AuthRes}
   */
  loginUser(user: UserLogin): Observable<AuthRes> {
    return this.http.post<AuthRes>(`${this.baseUrl}/sign-in`, user);
  }

  requestPin(payload: PinRequestDto): Observable<AuthResponse> {
    console.log(`${this.baseUrl}/pin`, { params: { ...payload } });
    return this.http.get<AuthResponse>(`${this.baseUrl}/pin`, {
      params: {
        ...payload,
      },
    });
  }

  verifyPin(payload: PinVerifyDto): Observable<AuthResponse> {
    console.log('payload', payload);
    // Clear old auth data before new login
    this.logout();
    localStorage.removeItem('user_role');
    console.log('AuthApiService - Cleared old auth, making request...');

    return this.http.post<AuthResponse>(`${this.baseUrl}/pin`, payload).pipe(
      tap((res) => {
        console.log('AuthApiService - Response received:', res);
        if (res.success && res.data?.token) {
          console.log(
            'AuthApiService - saving new token:',
            res.data.token.substring(0, 20) + '...'
          );
          this.setToken(res.data.token);
          console.log(
            'AuthApiService - Token saved. Verifying:',
            this.getToken()?.substring(0, 20) + '...'
          );
        }
      })
    );
  }

  // ADD: googleLogin method
  googleLogin(idToken: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/google`, { idToken }).pipe(
      tap((res) => {
        if (res.success && res.data?.token) {
          this.setToken(res.data.token);
        }
      })
    );
  }

  isLogin(): Boolean {
    return !!this.getToken();
  }

  getToken(): String | null {
    return this.dataService.getLocalStorage(this.TOKEN_KEY);
  }

  setToken(token: string): void {
    this.dataService.setLocalStorage(this.TOKEN_KEY, token);
  }

  logout() {
    this.dataService.deleteStorage(this.TOKEN_KEY);
  }
}
