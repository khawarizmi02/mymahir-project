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
        
        // Check role in both places (matching AuthService logic)
        const role = res.data?.user?.role || res.data?.role;

        if (res.success && role) {
          this.snackBar.open('Welcome back!', 'Success', { duration: 3000 });
          this.router.navigate([`/${role.toLowerCase()}/dashboard`]);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.snackBar.open(err.error?.message || 'Invalid or expired PIN', 'Error', {
          duration: 5000,
        });
      },
    });
  }
}
