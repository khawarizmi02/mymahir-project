import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { IPayment } from '../../../../interfaces/models';

@Component({
  selector: 'app-payment-review-dialog',
  template: `
    <h2 mat-dialog-title>
      <mat-icon>rate_review</mat-icon> Review Payment
    </h2>
    
    <mat-dialog-content>
      <div class="payment-details">
        <div class="detail-row">
          <span class="label">Tenant:</span>
          <span class="value">{{ data.payment.tenant?.name || data.payment.tenant?.email }}</span>
        </div>
        <div class="detail-row">
          <span class="label">Property:</span>
          <span class="value">{{ data.payment.tenancy?.property?.title }}</span>
        </div>
        <div class="detail-row">
          <span class="label">Amount:</span>
          <span class="value amount">RM {{ data.payment.amount | number:'1.2-2' }}</span>
        </div>
        <div class="detail-row">
          <span class="label">Due Date:</span>
          <span class="value">{{ data.payment.payBy | date:'mediumDate' }}</span>
        </div>
      </div>

      <div class="proof-section" *ngIf="data.payment.proofUrl">
        <h4>Payment Proof</h4>
        <div class="proof-preview">
          <img *ngIf="isImage(data.payment.proofUrl)" [src]="data.payment.proofUrl" alt="Payment Proof">
          <div *ngIf="!isImage(data.payment.proofUrl)" class="pdf-preview">
            <mat-icon>picture_as_pdf</mat-icon>
            <span>PDF Document</span>
          </div>
        </div>
        <a [href]="data.payment.proofUrl" target="_blank" mat-stroked-button color="primary">
          <mat-icon>open_in_new</mat-icon> View Full Size
        </a>
      </div>

      <div class="no-proof" *ngIf="!data.payment.proofUrl">
        <mat-icon>warning</mat-icon>
        <p>No payment proof has been uploaded yet.</p>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-raised-button color="warn" (click)="onReject()" [disabled]="!data.payment.proofUrl">
        <mat-icon>close</mat-icon> Reject
      </button>
      <button mat-raised-button color="primary" (click)="onApprove()" [disabled]="!data.payment.proofUrl">
        <mat-icon>check</mat-icon> Approve
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    h2[mat-dialog-title] {
      display: flex;
      align-items: center;
      gap: 8px;
      
      mat-icon {
        color: #1976d2;
      }
    }

    .payment-details {
      margin-bottom: 24px;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid rgba(0,0,0,0.1);

      &:last-child {
        border-bottom: none;
      }

      .label {
        color: rgba(0,0,0,0.6);
      }

      .value {
        font-weight: 500;

        &.amount {
          color: #1976d2;
          font-size: 18px;
        }
      }
    }

    .proof-section {
      h4 {
        margin: 0 0 12px;
        color: rgba(0,0,0,0.7);
      }

      .proof-preview {
        margin-bottom: 12px;
        text-align: center;

        img {
          max-width: 100%;
          max-height: 300px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .pdf-preview {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 32px;
          background: #f5f5f5;
          border-radius: 8px;

          mat-icon {
            font-size: 48px;
            width: 48px;
            height: 48px;
            color: #f44336;
          }
        }
      }
    }

    .no-proof {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: #fff3e0;
      border-radius: 8px;

      mat-icon {
        color: #ff9800;
      }

      p {
        margin: 0;
        color: rgba(0,0,0,0.7);
      }
    }

    mat-dialog-actions {
      gap: 8px;
    }
  `],
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ]
})
export class PaymentReviewDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<PaymentReviewDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { payment: IPayment }
  ) {}

  isImage(url: string): boolean {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onApprove(): void {
    this.dialogRef.close('approved');
  }

  onReject(): void {
    this.dialogRef.close('rejected');
  }
}
