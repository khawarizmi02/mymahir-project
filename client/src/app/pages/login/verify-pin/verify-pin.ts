import { ChangeDetectionStrategy, Component, signal, inject, OnInit } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button'; // Use Module
import { MatFormFieldModule } from '@angular/material/form-field'; // Use Module
import { MatInputModule } from '@angular/material/input'; // Use Module
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, RouterModule } from '@angular/router'; // Use RouterModule
import { AuthService } from '../../../services/auth.service'; // Import AuthService

@Component({
  selector: 'app-verify-pin',
  standalone: true, // Explicitly mark as standalone
  imports: [
    ReactiveFormsModule, 
    RouterModule, 
    MatFormFieldModule, 
    MatInputModule, 
    MatButtonModule
  ],
  templateUrl: './verify-pin.html',
  styleUrl: './verify-pin.scss',
})
export class VerifyPin implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService); // Inject AuthService instead of AuthApiService
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  email = signal<string>('');

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    pin: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
  });

  isLoading = signal(false);

  ngOnInit() {
    this.isLoading.set(true);
    
    // Clear any existing auth data when landing on verify-pin page
    localStorage.removeItem('token');
    localStorage.removeItem('user_role');
    console.log('VerifyPin - Cleared old auth data');
    
    const state = history.state;
    if (state?.email) {
      this.email.set(state.email);
      this.form.patchValue({ email: state.email });
    }

    this.isLoading.set(false);
  }

  onSubmit() {
    if (this.form.invalid) return;

    this.isLoading.set(true);
    const { email, pin } = this.form.value;

    if (!email || !pin) return;

    // Use AuthService to ensure role is saved to localStorage
    this.authService.verifyPinLogin(email, pin).subscribe({
      next: (res: any) => {
        this.isLoading.set(false);
        console.log('Login response:', res); // Debug log
        
        // Check role in both places (matching AuthService logic)
        const role = res.data?.user?.role || res.data?.role;
        console.log('VerifyPin - extracted role:', role);

        if (res.success && role) {
          const targetRoute = `/${role.toLowerCase()}/dashboard`;
          console.log('VerifyPin - navigating to:', targetRoute);
          console.log('VerifyPin - localStorage token:', localStorage.getItem('token'));
          console.log('VerifyPin - localStorage user_role:', localStorage.getItem('user_role'));
          
          this.snackBar.open('Welcome back!', 'Success', { duration: 3000 });
          this.router.navigate([targetRoute]).then(
            (success) => console.log('VerifyPin - navigation success:', success),
            (error) => console.log('VerifyPin - navigation error:', error)
          );
        } else {
          // Handle case where login succeeded but no role found
          this.snackBar.open('Login successful but role not found', 'Warning', { duration: 5000 });
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        console.error('Login error:', err); // Debug log
        
        // Show more detailed error message
        const errorMessage = err.error?.message || err.message || 'Invalid or expired PIN';
        this.snackBar.open(errorMessage, 'Error', {
          duration: 5000,
        });
      },
    });
  }
}
