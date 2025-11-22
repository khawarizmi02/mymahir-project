import { ChangeDetectionStrategy, Component, signal, inject, OnInit } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, RouterLink } from '@angular/router';
import { AuthApiService } from '../../../services/auth-api.service';
import { PinVerifyDto } from '../../../interfaces/auth.data';

@Component({
  selector: 'app-verify-pin',
  imports: [ReactiveFormsModule, RouterLink, MatFormField, MatLabel, MatInput, MatButton],
  templateUrl: './verify-pin.html',
  styleUrl: './verify-pin.scss',
})
export class VerifyPin implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthApiService);
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

    this.authService.verifyPin(this.form.value as PinVerifyDto).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success && res.data?.role) {
          this.snackBar.open('Welcome back!', 'Success', { duration: 3000 });
          const role = res.data.role.toLowerCase();
          this.router.navigate([`/${role}/dashboard`]);
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
