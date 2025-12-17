import { Component, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatRadioModule } from '@angular/material/radio';
import { MatDividerModule } from '@angular/material/divider';
import { ApiService } from '../../../../services/api.service';
import { injectStripe } from 'ngx-stripe';
import { PaymentMethod } from '../../../../interfaces/models';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';

interface TenancyOption {
  id: number;
  propertyTitle: string;
  monthlyRent: number;
}

@Component({
  selector: 'app-tenant-payment-form',
  templateUrl: './payment-form.component.html',
  styleUrls: ['./payment-form.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatRadioModule,
    MatDividerModule,
  ],
})
export class TenantPaymentFormComponent implements OnInit, OnDestroy {
  @ViewChild('stripeElement') stripeElementRef?: ElementRef;

  // Form states
  step: 'method-selection' | 'payment-details' | 'stripe-payment' = 'method-selection';
  selectedMethod: PaymentMethod | null = null;

  paymentForm: FormGroup;
  tenancies: TenancyOption[] = [];
  isLoading = true;
  isSubmitting = false;
  isProcessing = false;
  maxDate = new Date();

  // Stripe specific
  currentClientSecret: string | null = null;
  currentPaymentId: number | null = null;
  stripeErrorMessage = '';
  stripe = injectStripe();

  // Store Stripe instance and elements for reuse
  private stripeInstance: any = null;
  private stripeElements: any = null;

  PaymentMethod = PaymentMethod;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.paymentForm = this.fb.group({
      tenancyId: ['', Validators.required],
      amount: ['', [Validators.required, Validators.min(0.01)]],
      currency: ['MYR', Validators.required],
      paidAt: [new Date(), Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadTenancies();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadTenancies(): void {
    this.apiService.getTenantTenancies().subscribe({
      next: (response) => {
        this.tenancies = response.data || [];
        this.isLoading = false;

        // Auto-select if only one tenancy
        if (this.tenancies.length === 1) {
          this.paymentForm.patchValue({
            tenancyId: this.tenancies[0].id,
            amount: this.tenancies[0].monthlyRent,
          });
        }
      },
      error: (err) => {
        console.error('Failed to load tenancies:', err);
        this.isLoading = false;
        this.snackBar.open('Failed to load tenancies', 'Close', { duration: 3000 });
      },
    });
  }

  // Step 1: User selects payment method
  selectPaymentMethod(method: PaymentMethod): void {
    this.selectedMethod = method;
    this.step = 'payment-details';
  }

  backToMethodSelection(): void {
    this.step = 'method-selection';
    this.selectedMethod = null;
    this.paymentForm.reset();
  }

  onTenancyChange(): void {
    const tenancyId = this.paymentForm.get('tenancyId')?.value;
    const selectedTenancy = this.tenancies.find((t) => t.id === tenancyId);

    if (selectedTenancy) {
      this.paymentForm.patchValue({
        amount: selectedTenancy.monthlyRent,
      });
    }
  }

  // Step 2: User submits payment details
  onSubmit(): void {
    if (this.paymentForm.invalid) {
      this.paymentForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    const formValue = this.paymentForm.value;
    const payload = {
      tenancyId: formValue.tenancyId,
      amount: Number(formValue.amount),
      currency: formValue.currency,
      method: this.selectedMethod as string,
      paidAt: formValue.paidAt
        ? new Date(formValue.paidAt).toISOString()
        : new Date().toISOString(),
    };

    // Call backend API through ApiService
    this.apiService
      .post(`/payments`, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.isSubmitting = false;
          const paymentData = response.data;

          if (this.selectedMethod === PaymentMethod.STRIPE) {
            // Show Stripe payment form
            this.handleStripePayment(paymentData);
          } else if (this.selectedMethod === PaymentMethod.MANUAL) {
            // Redirect to proof upload
            this.snackBar.open('Payment created successfully! Now upload your proof.', 'OK', {
              duration: 3000,
            });
            setTimeout(() => {
              this.router.navigate(['/tenant/payments', paymentData.id, 'upload-proof']);
            }, 300);
          }
        },
        error: (err: any) => {
          this.isSubmitting = false;
          console.error('Failed to create payment:', err);
          this.snackBar.open(err.error?.message || 'Failed to create payment', 'Close', {
            duration: 3000,
          });
        },
      });
  }

  // Step 3: Handle Stripe payment flow
  private async handleStripePayment(paymentData: any): Promise<void> {
    this.currentPaymentId = paymentData.id;
    this.currentClientSecret = paymentData.clientSecret;

    if (!this.currentClientSecret) {
      this.stripeErrorMessage = 'Failed to create payment intent';
      return;
    }

    this.step = 'stripe-payment';

    // Wait for view to render before mounting
    setTimeout(() => {
      if (this.stripeElementRef) {
        this.mountPaymentElement();
      }
    }, 100);
  }

  /**
   * Mount Stripe payment element
   */
  private mountPaymentElement(): void {
    if (!this.currentClientSecret || !this.stripeElementRef) {
      this.stripeErrorMessage = 'Missing client secret or container';
      return;
    }

    try {
      // ngx-stripe loads Stripe.js script and it's available globally
      const checkAndMount = () => {
        if ((window as any).Stripe) {
          // Stripe is a constructor function, we need to call it with the publishable key
          const stripeConstructor = (window as any).Stripe;
          this.stripeInstance = stripeConstructor(environment.stripePublishableKey);

          // Create elements with client secret
          this.stripeElements = this.stripeInstance.elements({
            clientSecret: this.currentClientSecret,
          });

          // Create and mount payment element
          const paymentElement = this.stripeElements.create('payment');
          paymentElement.mount(this.stripeElementRef!.nativeElement);
        } else {
          // Retry after a short delay if Stripe is still loading
          setTimeout(checkAndMount, 100);
        }
      };

      checkAndMount();
    } catch (error: any) {
      this.stripeErrorMessage = error?.message || 'Failed to create payment element';
      console.error('Payment element creation error:', error);
    }
  }

  async confirmStripePayment(): Promise<void> {
    if (!this.currentClientSecret) {
      this.stripeErrorMessage = 'Payment secret not found';
      return;
    }

    // Check if we have a mounted payment element
    if (!this.stripeInstance || !this.stripeElements) {
      this.stripeErrorMessage =
        'Payment element not initialized. Please wait for the form to load.';
      return;
    }

    this.isProcessing = true;

    try {
      const result = await this.stripeInstance.confirmPayment({
        elements: this.stripeElements,
        confirmParams: {
          return_url: `${window.location.origin}/tenant/payments`,
        },
      });

      // Handle undefined result
      if (!result) {
        this.stripeErrorMessage = 'Payment confirmation failed - no response from Stripe';
        this.snackBar.open(this.stripeErrorMessage, 'Close', { duration: 3000 });
        this.isProcessing = false;
        return;
      }

      // Check for error in result
      if (result.error) {
        this.stripeErrorMessage = result.error.message || 'Payment failed';
        this.snackBar.open(this.stripeErrorMessage, 'Close', { duration: 3000 });
        this.isProcessing = false;
        return;
      }

      // Check for successful payment intent
      if (result.paymentIntent?.status === 'succeeded') {
        // Show success message for 3 seconds then redirect
        this.snackBar.open('Payment successful! Your rent has been paid.', 'OK', {
          duration: 3000,
        });

        setTimeout(() => {
          this.router.navigate(['/tenant/payments']);
        }, 3000);
      } else {
        // Handle other payment intent statuses
        this.stripeErrorMessage = `Payment processing: ${
          result.paymentIntent?.status || 'unknown status'
        }`;
        this.snackBar.open(this.stripeErrorMessage, 'Close', { duration: 3000 });
      }
    } catch (error: any) {
      this.stripeErrorMessage = error?.message || 'Payment confirmation failed';
      this.snackBar.open(this.stripeErrorMessage, 'Close', { duration: 3000 });
      console.error('Payment confirmation error:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  retryStripePayment(): void {
    this.stripeErrorMessage = '';
    this.step = 'payment-details';
    this.selectedMethod = null;
    this.currentClientSecret = null;
    this.currentPaymentId = null;
  }

  getSelectedTenancy(): TenancyOption | undefined {
    const tenancyId = this.paymentForm.get('tenancyId')?.value;
    return this.tenancies.find((t) => t.id === tenancyId);
  }
}
