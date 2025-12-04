import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { ApiService } from '../../../../services/api.service';
import { IProperty } from '../../../../interfaces/models';

@Component({
  selector: 'app-lease-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatIconModule,
    MatDividerModule
  ],
  templateUrl: './lease-form.component.html',
  styleUrl: './lease-form.component.scss'
})
export class LeaseFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private apiService = inject(ApiService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);

  form!: FormGroup;
  properties = signal<IProperty[]>([]);
  isLoading = signal(false);
  isSubmitting = signal(false);
  invitationUrl = signal<string | null>(null);
  selectedProperty = signal<IProperty | null>(null);

  // Min date for lease start (today)
  minDate = new Date();
  
  ngOnInit() {
    this.initForm();
    this.loadProperties();

    // Check if property ID was passed in route
    const propertyId = this.route.snapshot.queryParams['propertyId'];
    if (propertyId) {
      this.form.patchValue({ propertyId: Number(propertyId) });
    }
  }

  private initForm() {
    this.form = this.fb.group({
      propertyId: [null, Validators.required],
      tenantName: ['', Validators.required],
      tenantEmail: ['', [Validators.required, Validators.email]],
      leaseStart: [null, Validators.required],
      leaseEnd: [null, Validators.required],
      monthlyRent: [null, [Validators.required, Validators.min(0)]],
      depositAmount: [null, Validators.min(0)]
    });

    // Update selected property when selection changes
    this.form.get('propertyId')?.valueChanges.subscribe(id => {
      const property = this.properties().find(p => p.id === id);
      this.selectedProperty.set(property || null);
      
      // Auto-fill monthly rent from property
      if (property) {
        this.form.patchValue({ monthlyRent: property.monthlyRent });
      }
    });
  }

  private loadProperties() {
    this.isLoading.set(true);
    this.apiService.getLandlordProperties().subscribe({
      next: (response: any) => {
        // Handle wrapped response
        const properties = response?.data || response || [];
        // Filter to only show vacant properties
        const vacantProperties = properties.filter((p: IProperty) => p.status === 'VACANT');
        this.properties.set(vacantProperties);
        this.isLoading.set(false);

        // If propertyId was set, update selected property
        const propertyId = this.form.get('propertyId')?.value;
        if (propertyId) {
          const property = vacantProperties.find((p: IProperty) => p.id === propertyId);
          this.selectedProperty.set(property || null);
          if (property) {
            this.form.patchValue({ monthlyRent: property.monthlyRent });
          }
        }
      },
      error: (err) => {
        console.error('Error loading properties:', err);
        this.snackBar.open('Failed to load properties', 'Close', { duration: 3000 });
        this.isLoading.set(false);
      }
    });
  }

  onSubmit() {
    if (this.form.invalid) {
      // Mark all fields as touched to show validation errors
      Object.keys(this.form.controls).forEach(key => {
        this.form.get(key)?.markAsTouched();
      });
      return;
    }

    this.isSubmitting.set(true);
    const formValue = this.form.value;

    // Format dates to ISO string
    const payload = {
      propertyId: formValue.propertyId,
      tenantName: formValue.tenantName,
      tenantEmail: formValue.tenantEmail,
      leaseStart: formValue.leaseStart.toISOString(),
      leaseEnd: formValue.leaseEnd.toISOString(),
      monthlyRent: Number(formValue.monthlyRent),
      depositAmount: formValue.depositAmount ? Number(formValue.depositAmount) : undefined
    };

    this.apiService.createInvitation(payload).subscribe({
      next: (response) => {
        this.isSubmitting.set(false);
        if (response.success) {
          this.invitationUrl.set(response.data.invitationUrl);
          this.snackBar.open(response.message, 'Success', { duration: 5000 });
        } else {
          this.snackBar.open(response.message || 'Failed to create invitation', 'Error', { duration: 5000 });
        }
      },
      error: (err) => {
        this.isSubmitting.set(false);
        console.error('Error creating invitation:', err);
        const message = err.error?.message || 'Failed to create invitation';
        this.snackBar.open(message, 'Error', { duration: 5000 });
      }
    });
  }

  copyInvitationUrl() {
    const url = this.invitationUrl();
    if (url) {
      navigator.clipboard.writeText(url).then(() => {
        this.snackBar.open('Invitation link copied to clipboard!', 'Done', { duration: 2000 });
      });
    }
  }

  createAnother() {
    this.invitationUrl.set(null);
    this.form.reset();
    this.selectedProperty.set(null);
  }

  goBack() {
    this.router.navigate(['/landlord/leases']);
  }
}
