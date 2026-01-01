import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '../../../../services/api.service';
import { IPayment, PaymentStatus } from '../../../../interfaces/models';
// Dialog component for reviewing payments
import { PaymentReviewDialogComponent } from './payment-review-dialog.component';

@Component({
  selector: 'app-landlord-payment-list',
  templateUrl: './payment-list.component.html',
  styleUrls: ['./payment-list.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatTabsModule,
    MatBadgeModule,
    MatDialogModule,
    MatSnackBarModule,
    MatChipsModule,
  ],
})
export class LandlordPaymentListComponent implements OnInit {
  allPayments: IPayment[] = [];
  pendingPayments: IPayment[] = [];
  completedPayments: IPayment[] = [];
  isLoading = true;
  displayedColumns = ['tenant', 'property', 'amount', 'payBy', 'proof', 'actions'];

  constructor(
    private apiService: ApiService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadPayments();
  }

  loadPayments(): void {
    this.isLoading = true;
    this.apiService.getLandlordPayments().subscribe({
      next: (response) => {
        this.allPayments = response.data || [];
        this.filterPayments();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load payments:', err);
        this.isLoading = false;
        this.snackBar.open('Failed to load payments', 'Close', { duration: 3000 });
      },
    });
  }

  filterPayments(): void {
    this.pendingPayments = this.allPayments.filter((p) => p.status === PaymentStatus.PENDING);
    this.completedPayments = this.allPayments.filter(
      (p) => p.status === PaymentStatus.COMPLETED || p.status === PaymentStatus.FAILED
    );
  }

  getStatusColor(status: PaymentStatus): string {
    switch (status) {
      case PaymentStatus.COMPLETED:
        return 'primary';
      case PaymentStatus.PENDING:
        return 'warn';
      case PaymentStatus.FAILED:
        return 'accent';
      default:
        return '';
    }
  }

  getStatusIcon(status: PaymentStatus): string {
    switch (status) {
      case PaymentStatus.COMPLETED:
        return 'check_circle';
      case PaymentStatus.PENDING:
        return 'schedule';
      case PaymentStatus.FAILED:
        return 'cancel';
      default:
        return 'help';
    }
  }

  viewProof(proofUrl: string): void {
    window.open(proofUrl, '_blank');
  }

  openReviewDialog(payment: IPayment): void {
    const dialogRef = this.dialog.open(PaymentReviewDialogComponent, {
      width: '500px',
      data: { payment },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'approved') {
        this.approvePayment(payment);
      } else if (result === 'rejected') {
        this.rejectPayment(payment);
      }
    });
  }

  approvePayment(payment: IPayment): void {
    this.apiService.updatePaymentStatus(payment.id, { status: PaymentStatus.COMPLETED }).subscribe({
      next: () => {
        this.snackBar.open('Payment approved successfully', 'Close', { duration: 3000 });
        this.loadPayments(); // Reload to update the lists
      },
      error: (err) => {
        console.error('Failed to approve payment:', err);
        this.snackBar.open('Failed to approve payment', 'Close', { duration: 3000 });
      },
    });
  }

  rejectPayment(payment: IPayment): void {
    this.apiService.updatePaymentStatus(payment.id, { status: PaymentStatus.FAILED }).subscribe({
      next: () => {
        this.snackBar.open('Payment rejected', 'Close', { duration: 3000 });
        this.loadPayments();
      },
      error: (err) => {
        console.error('Failed to reject payment:', err);
        this.snackBar.open('Failed to reject payment', 'Close', { duration: 3000 });
      },
    });
  }

  isOverdue(payBy: string): boolean {
    return new Date(payBy) < new Date();
  }

  needsReview(payment: IPayment): boolean {
    return payment.status === PaymentStatus.PENDING && !!payment.proofUrl;
  }
}
