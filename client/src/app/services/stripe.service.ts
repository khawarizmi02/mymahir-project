import { Injectable, signal } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PaymentMethod } from '../interfaces/models';

declare global {
  interface Window {
    Stripe?: any;
  }
}

@Injectable({
  providedIn: 'root'
})
export class StripeService {
  private apiUrl = `${environment.apiUrl}/v1`;
  private stripe: any = null;
  private elements: any = null;
  
  private loadingSignal = signal(false);
  private errorSignal = signal<string | null>(null);

  loading = this.loadingSignal.asReadonly();
  error = this.errorSignal.asReadonly();

  constructor(private http: HttpClient) {
    this.loadStripeScript();
  }

  /**
   * Load Stripe script dynamically
   */
  private loadStripeScript() {
    try {
      // Load Stripe script dynamically
      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/';
      script.async = true;
      script.onload = () => {
        if (window.Stripe) {
          this.stripe = window.Stripe(environment.stripePublishableKey);
          this.errorSignal.set(null);
        }
      };
      script.onerror = () => {
        this.errorSignal.set('Failed to load Stripe script');
      };
      document.head.appendChild(script);
    } catch (error: any) {
      this.errorSignal.set(error?.message || 'Failed to initialize Stripe');
    }
  }

  /**
   * Wait for Stripe to be initialized (returns Promise)
   */
  async initializeStripe(): Promise<void> {
    return new Promise((resolve) => {
      if (this.stripe) {
        resolve();
        return;
      }

      // Wait for Stripe to load
      const checkInterval = setInterval(() => {
        if (this.stripe) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);

      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        resolve();
      }, 10000);
    });
  }

  /**
   * Create payment element in container
   */
  async createPaymentElement(containerElement: HTMLElement, clientSecret: string) {
    try {
      if (!this.stripe) {
        this.errorSignal.set('Stripe not initialized yet');
        return;
      }

      // Create elements with client secret
      this.elements = this.stripe.elements({ clientSecret });
      const paymentElement = this.elements.create('payment');
      
      // Mount to the provided element
      paymentElement.mount(containerElement);
      this.errorSignal.set(null);
      
      return paymentElement;
    } catch (error: any) {
      this.errorSignal.set(error?.message || 'Failed to create payment element');
    }
  }

  /**
   * Confirm payment with Stripe
   */
  async confirmPayment(clientSecret: string): Promise<any> {
    try {
      if (!this.stripe || !this.elements) {
        this.errorSignal.set('Stripe or elements not initialized');
        return;
      }

      this.loadingSignal.set(true);
      
      const result = await this.stripe.confirmPayment({
        elements: this.elements,
        confirmParams: {
          return_url: `${window.location.origin}/tenant/payments/stripe`,
        },
      });

      this.loadingSignal.set(false);
      
      if (result.error) {
        this.errorSignal.set(result.error.message || 'Payment failed');
        return result;
      }

      return result;
    } catch (error: any) {
      this.errorSignal.set(error?.message || 'Payment confirmation failed');
      this.loadingSignal.set(false);
      return { error };
    }
  }

  /**
   * Create payment intent on backend
   */
  createPaymentIntent(tenancyId: number, amount: number): Observable<any> {
    return this.http.post<{ success: boolean; data: any }>(`${this.apiUrl}/payments/stripe/intent`, {
      tenancyId,
      amount,
      currency: 'USD',
      method: PaymentMethod.ONLINE
    });
  }

  /**
   * Retrieve payment intent status
   */
  async retrievePaymentIntent(clientSecret: string): Promise<any> {
    try {
      if (!this.stripe) {
        this.errorSignal.set('Stripe not initialized');
        return;
      }

      return await this.stripe.retrievePaymentIntent(clientSecret);
    } catch (error: any) {
      this.errorSignal.set(error?.message || 'Failed to retrieve payment intent');
    }
  }

  /**
   * Clear error message
   */
  clearError(): void {
    this.errorSignal.set(null);
  }

  /**
   * Get Stripe instance
   */
  getStripe(): any {
    return this.stripe;
  }

  /**
   * Get elements instance
   */
  getElements(): any {
    return this.elements;
  }
}

