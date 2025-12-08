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
import { MatMenuModule } from '@angular/material/menu';
import { ApiService } from '../../../../services/api.service';
import { IPayment, PaymentStatus } from '../../../../interfaces/models';

@Component({
  selector: 'app-tenant-payment-list',
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
    MatMenuModule
  ]
})
export class TenantPaymentListComponent implements OnInit {
  payments: IPayment[] = [];
  isLoading = true;
  displayedColumns = ['property', 'amount', 'payBy', 'status', 'proof', 'actions'];

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadPayments();
  }

  loadPayments(): void {
    this.isLoading = true;
    this.apiService.getTenantPayments().subscribe({
      next: (response) => {
        this.payments = response.data || [];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load payments:', err);
        this.isLoading = false;
      }
    });
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

  isOverdue(payBy: string): boolean {
    return new Date(payBy) < new Date() && this.payments.find(p => p.payBy === payBy)?.status === PaymentStatus.PENDING;
  }

  needsProof(payment: IPayment): boolean {
    return payment.status === PaymentStatus.PENDING && !payment.proofUrl;
  }

  viewProof(proofUrl: string): void {
    window.open(proofUrl, '_blank');
  }
}
