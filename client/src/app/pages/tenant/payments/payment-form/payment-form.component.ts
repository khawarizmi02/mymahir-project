import { Component, OnInit } from '@angular/core';
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
import { ApiService } from '../../../../services/api.service';
import { PaymentMethod } from '../../../../interfaces/models';

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
    MatNativeDateModule
  ]
})
export class TenantPaymentFormComponent implements OnInit {
  paymentForm: FormGroup;
  tenancies: TenancyOption[] = [];
  isLoading = true;
  isSubmitting = false;
  maxDate = new Date(); // Can't select future dates

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
      method: [PaymentMethod.MANUAL, Validators.required],
      paidAt: [new Date(), Validators.required] // Payment date, defaults to today
    });
  }

  ngOnInit(): void {
    this.loadTenancies();
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
            amount: this.tenancies[0].monthlyRent
          });
        }
      },
      error: (err) => {
        console.error('Failed to load tenancies:', err);
        this.isLoading = false;
        this.snackBar.open('Failed to load tenancies', 'Close', { duration: 3000 });
      }
    });
  }

  onTenancyChange(): void {
    const tenancyId = this.paymentForm.get('tenancyId')?.value;
    const selectedTenancy = this.tenancies.find(t => t.id === tenancyId);
    
    if (selectedTenancy) {
      this.paymentForm.patchValue({
        amount: selectedTenancy.monthlyRent
      });
    }
  }

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
      method: formValue.method,
      paidAt: formValue.paidAt ? formValue.paidAt.toISOString() : new Date().toISOString()
    };

    this.apiService.createPayment(payload).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.snackBar.open('Payment created successfully! Now upload your proof.', 'OK', {
          duration: 5000
        });
        // Navigate to proof upload page
        this.router.navigate(['/tenant/payments', response.data.id, 'upload-proof']);
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error('Failed to create payment:', err);
        this.snackBar.open(err.error?.message || 'Failed to create payment', 'Close', {
          duration: 3000
        });
      }
    });
  }

  getSelectedTenancy(): TenancyOption | undefined {
    const tenancyId = this.paymentForm.get('tenancyId')?.value;
    return this.tenancies.find(t => t.id === tenancyId);
  }
}
