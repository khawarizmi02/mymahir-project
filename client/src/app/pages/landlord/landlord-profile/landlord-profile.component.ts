import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PropertyApiService } from '../../../services/property-api.service';

@Component({
  selector: 'app-landlord-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './landlord-profile.component.html',
  styleUrls: ['./landlord-profile.component.scss'],
})
export class LandlordProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private propertyApiService = inject(PropertyApiService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  form: FormGroup;
  isLoading = signal(false);
  isSaving = signal(false);

  constructor() {
    this.form = this.fb.group({
      fullName: ['', [Validators.minLength(2)]],
      phoneNumber: ['', [Validators.minLength(7)]],
      whatsappNumber: ['', [Validators.minLength(7)]],
      businessHours: [''],
    });
  }

  ngOnInit(): void {
    // Initialize form with empty values
    // In a real app, you might want to load the current user data
    this.form.patchValue({
      fullName: '',
      phoneNumber: '',
      whatsappNumber: '',
      businessHours: '',
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.snackBar.open('Please fix the errors in the form', 'Close', { duration: 3000 });
      return;
    }

    this.isSaving.set(true);
    const formValues = this.form.value;

    const profileData = {
      fullName: formValues.fullName || null,
      phoneNumber: formValues.phoneNumber || null,
      whatsappNumber: formValues.whatsappNumber || null,
      businessHours: formValues.businessHours || null,
    };

    this.propertyApiService.updateLandlordProfile(profileData).subscribe({
      next: (response) => {
        this.snackBar.open('Profile updated successfully', 'Close', { duration: 3000 });
        this.isSaving.set(false);
        this.router.navigate(['/landlord/dashboard']);
      },
      error: (error) => {
        this.snackBar.open('Failed to update profile. Please try again.', 'Close', {
          duration: 3000,
        });
        this.isSaving.set(false);
      },
    });
  }

  onCancel(): void {
    this.router.navigate(['/landlord/dashboard']);
  }
}
