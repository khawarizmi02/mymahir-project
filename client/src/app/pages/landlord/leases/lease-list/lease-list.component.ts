import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '../../../../services/api.service';
import { ITenantInvitation, InvitationStatus } from '../../../../interfaces/models';

@Component({
  selector: 'app-lease-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule
  ],
  templateUrl: './lease-list.component.html',
  styleUrl: './lease-list.component.scss'
})
export class LeaseListComponent implements OnInit {
  private apiService = inject(ApiService);
  private snackBar = inject(MatSnackBar);

  invitations = signal<ITenantInvitation[]>([]);
  isLoading = signal(true);
  
  displayedColumns = ['property', 'tenant', 'lease', 'rent', 'status', 'actions'];

  ngOnInit() {
    this.loadInvitations();
  }

  loadInvitations() {
    this.isLoading.set(true);
    this.apiService.getLandlordInvitations().subscribe({
      next: (response) => {
        this.invitations.set(response.data || []);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading invitations:', err);
        this.snackBar.open('Failed to load invitations', 'Close', { duration: 3000 });
        this.isLoading.set(false);
      }
    });
  }

  getStatusColor(status: InvitationStatus): string {
    switch (status) {
      case 'PENDING': return 'accent';
      case 'ACCEPTED': return 'primary';
      case 'EXPIRED': return 'warn';
      case 'CANCELLED': return '';
      default: return '';
    }
  }

  getStatusIcon(status: InvitationStatus): string {
    switch (status) {
      case 'PENDING': return 'hourglass_empty';
      case 'ACCEPTED': return 'check_circle';
      case 'EXPIRED': return 'schedule';
      case 'CANCELLED': return 'cancel';
      default: return 'help';
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-MY', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  copyInvitationUrl(invitation: ITenantInvitation) {
    const url = `${window.location.origin}/invite/${invitation.token}`;
    navigator.clipboard.writeText(url).then(() => {
      this.snackBar.open('Invitation link copied!', 'Done', { duration: 2000 });
    });
  }

  resendInvitation(invitation: ITenantInvitation) {
    this.apiService.resendInvitation(invitation.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.snackBar.open('Invitation resent with new link!', 'Success', { duration: 3000 });
          this.loadInvitations(); // Refresh list
        }
      },
      error: (err) => {
        console.error('Error resending invitation:', err);
        this.snackBar.open(err.error?.message || 'Failed to resend invitation', 'Error', { duration: 3000 });
      }
    });
  }

  cancelInvitation(invitation: ITenantInvitation) {
    if (confirm('Are you sure you want to cancel this invitation?')) {
      this.apiService.cancelInvitation(invitation.id).subscribe({
        next: (response) => {
          if (response.success) {
            this.snackBar.open('Invitation cancelled', 'Done', { duration: 3000 });
            this.loadInvitations(); // Refresh list
          }
        },
        error: (err) => {
          console.error('Error cancelling invitation:', err);
          this.snackBar.open(err.error?.message || 'Failed to cancel invitation', 'Error', { duration: 3000 });
        }
      });
    }
  }
}
