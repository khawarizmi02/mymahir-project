import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { StripeService } from '../../../../services/stripe.service';
import { ApiService } from '../../../../services/api.service';
import { ITenancy, IPayment } from '../../../../interfaces/models';

@Component({
  selector: 'app-stripe-payment',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatSelectModule,
    MatTableModule,
    MatDividerModule,
    MatTabsModule,
  ],
  templateUrl: './stripe-payment.component.html',
  styleUrls: ['./stripe-payment.component.scss'],
})
export class StripePaymentComponent implements OnInit {
  @ViewChild('stripeElement') stripeElementRef?: ElementRef;

  paymentForm: FormGroup;
  isProcessing = false;
  errorMessage = '';
  successMessage = '';
  currentTenancy: ITenancy | null = null;
  paymentHistory: IPayment[] = [];
  paymentColumns: string[] = ['date', 'amount', 'status', 'reference'];
  defaultRentAmount = 0; // Default rent amount in USD
  dueDate: Date | null = null;

  constructor(
    private fb: FormBuilder,
    private stripeService: StripeService,
    private apiService: ApiService,
    private snackBar: MatSnackBar
  ) {
    this.paymentForm = this.fb.group({
      amount: ['', [Validators.required, Validators.min(0.01)]],
      notes: [''],
    });
  }

  ngOnInit(): void {
    this.loadTenancyInfo();
    this.loadPaymentHistory();
  }

  private loadTenancyInfo(): void {
    this.apiService.getTenancyInfo().subscribe({
      next: (response: any) => {
        this.currentTenancy = response?.data;
        // Set default rent amount to 1500 (can be customized based on backend data)
        this.defaultRentAmount = 1500;
        this.dueDate = new Date();
        this.dueDate.setDate(this.dueDate.getDate() + 30); // Due in 30 days
        this.paymentForm.patchValue({ amount: this.defaultRentAmount });
      },
      error: (error: any) => {
        this.errorMessage = 'Failed to load tenancy information';
        console.error('Error loading tenancy info:', error);
      },
    });
  }

  private loadPaymentHistory(): void {
    this.apiService.getPaymentHistory().subscribe({
      next: (response: any) => {
        this.paymentHistory = response?.data || [];
      },
      error: (error: any) => {
        console.error('Error loading payment history:', error);
      },
    });
  }

  onSubmit(): void {
    if (!this.paymentForm.valid || !this.currentTenancy) {
      return;
    }

    this.isProcessing = true;
    const amount = this.paymentForm.get('amount')?.value;
    const tenancyId = String(this.currentTenancy.id);

    // Create payment intent
    const payload = {
      tenancyId: parseInt(tenancyId),
      amount,
      currency: 'USD',
      method: 'STRIPE',
      paidAt: new Date().toISOString(),
    };

    this.stripeService.createPayment(payload).subscribe({
      next: (response: any) => {
        const clientSecret = response?.data?.clientSecret;

        if (!clientSecret) {
          this.errorMessage = 'Failed to create payment intent';
          this.isProcessing = false;
          return;
        }

        // Payment intent created successfully
        this.successMessage = 'Payment intent created. Proceeding with payment confirmation...';
        this.snackBar.open('Payment created, confirming with Stripe...', 'OK', { duration: 3000 });

        this.isProcessing = false;
      },
      error: (error: any) => {
        this.errorMessage = 'Failed to process payment. Please try again.';
        this.isProcessing = false;
        this.snackBar.open('Error processing payment', 'Close', { duration: 3000 });
        console.error('Error creating payment intent:', error);
      },
    });
  }

  getDaysUntilDue(dueDate?: string | Date): number {
    const due = dueDate ? new Date(dueDate) : this.dueDate || new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);

    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  }
}
