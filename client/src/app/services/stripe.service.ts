import { Injectable, signal } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PaymentMethod } from '../interfaces/models';

@Injectable({
  providedIn: 'root',
})
export class StripeService {
  private apiUrl = `${environment.apiUrl}/v1`;

  private loadingSignal = signal(false);
  private errorSignal = signal<string | null>(null);

  loading = this.loadingSignal.asReadonly();
  error = this.errorSignal.asReadonly();

  constructor(private http: HttpClient) {}

  /**
   * Create payment on backend (handles both STRIPE and MANUAL methods)
   */
  createPayment(payload: {
    tenancyId: number;
    amount: number;
    currency: string;
    method: string;
    paidAt?: string;
  }): Observable<any> {
    return this.http.post<{ success: boolean; data: any }>(`${this.apiUrl}/payments`, payload);
  }

  /**
   * Clear error message
   */
  clearError(): void {
    this.errorSignal.set(null);
  }
}
