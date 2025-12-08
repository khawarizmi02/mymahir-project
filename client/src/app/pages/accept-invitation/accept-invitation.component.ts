import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { ApiService } from '../../services/api.service';
import { ITenantInvitation } from '../../interfaces/models';

@Component({
  selector: 'app-accept-invitation',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatIconModule,
    MatDividerModule
  ],
  templateUrl: './accept-invitation.component.html',
  styleUrl: './accept-invitation.component.scss'
})
export class AcceptInvitationComponent implements OnInit {
  private fb = inject(FormBuilder);
  private apiService = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  token = signal<string>('');
  invitation = signal<ITenantInvitation | null>(null);
  isLoading = signal(true);
  isSubmitting = signal(false);
  error = signal<string | null>(null);
  success = signal(false);
  
  // User status signals
  isExistingUser = signal(false);  // User account exists
  existingUserHasPassword = signal(false);  // Existing user has a password set

  passwordForm!: FormGroup;
  currentPasswordForm!: FormGroup;

  ngOnInit() {
    this.initForm();
    
    // Get token from route
    const token = this.route.snapshot.params['token'];
    if (token) {
      this.token.set(token);
      this.loadInvitation(token);
    } else {
      this.error.set('Invalid invitation link');
      this.isLoading.set(false);
    }
  }

  private initForm() {
    // Form for new users to create password
    this.passwordForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });

    // Form for existing users to enter current password
    this.currentPasswordForm = this.fb.group({
      password: ['', [Validators.required]]
    });
  }

  private passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    
    if (password !== confirmPassword) {
      form.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  private loadInvitation(token: string) {
    this.isLoading.set(true);
    this.apiService.getInvitationByToken(token).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.invitation.set(response.data);
          // Set user status from backend response
          this.isExistingUser.set(response.data.existingUser ?? false);
          this.existingUserHasPassword.set(response.data.existingUserHasPassword ?? false);
        } else {
          this.error.set('Invitation not found');
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading invitation:', err);
        this.error.set(err.error?.message || 'Failed to load invitation');
        this.isLoading.set(false);
      }
    });
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-MY', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  acceptInvitation() {
    // Determine which form to validate based on user status
    if (this.isExistingUser() && this.existingUserHasPassword()) {
      // Existing user with password - validate current password form
      if (this.currentPasswordForm.invalid) {
        this.currentPasswordForm.markAllAsTouched();
        return;
      }
    } else {
      // New user OR existing user without password - validate new password form
      if (this.passwordForm.invalid) {
        Object.keys(this.passwordForm.controls).forEach(key => {
          this.passwordForm.get(key)?.markAsTouched();
        });
        return;
      }
    }

    this.isSubmitting.set(true);
    
    // Get password from the appropriate form
    let password: string;
    if (this.isExistingUser() && this.existingUserHasPassword()) {
      password = this.currentPasswordForm.get('password')?.value;
    } else {
      password = this.passwordForm.get('password')?.value;
    }

    const payload = { password };

    this.apiService.acceptInvitation(this.token(), payload).subscribe({
      next: (response) => {
        this.isSubmitting.set(false);
        if (response.success) {
          this.success.set(true);
          this.snackBar.open('Invitation accepted! You can now login.', 'Success', { duration: 5000 });
        }
      },
      error: (err) => {
        this.isSubmitting.set(false);
        console.error('Error accepting invitation:', err);
        this.snackBar.open(err.error?.message || 'Failed to accept invitation', 'Error', { duration: 5000 });
      }
    });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
