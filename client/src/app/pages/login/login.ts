import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { AuthApiService } from '../../services/auth-api.service';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatSnackBarModule,
    MatIconModule,
    RouterModule,
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private fb = inject(FormBuilder);
  private authService = inject(AuthApiService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    name: [''],
    role: ['', Validators.required],
    password: [''],
  });

  isLoading = signal(false);
  successMessage = signal(false);
  hidePassword = signal(true);

  get isTenant(): boolean {
    return this.form.get('role')?.value === 'TENANT';
  }

  onRoleChange(): void {
    const passwordControl = this.form.get('password');
    if (this.isTenant) {
      passwordControl?.setValidators([Validators.required, Validators.minLength(6)]);
    } else {
      passwordControl?.clearValidators();
      passwordControl?.setValue('');
    }
    passwordControl?.updateValueAndValidity();
  }

  togglePasswordVisibility(): void {
    this.hidePassword.update(v => !v);
  }

  onSubmit() {
    if (this.form.invalid) return;

    this.isLoading.set(true);
    this.successMessage.set(false);

    const formData: any = {
      email: this.form.value.email,
      name: this.form.value.name,
      role: this.form.value.role,
    };

    // Include password for tenant login
    if (this.isTenant && this.form.value.password) {
      formData.password = this.form.value.password;
    }

    this.authService.requestPin(formData).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.successMessage.set(true);
        this.snackBar.open('PIN sent to your email!', 'OK', { duration: 5000 });
        setTimeout(
          () =>
            this.router.navigate(['login', 'verify'], { state: { email: this.form.value.email } }),
          2000
        );
      },
      error: (err) => {
        this.isLoading.set(false);
        this.snackBar.open(err.error?.message || 'Failed to send PIN', 'Close');
      },
    });
  }
}
