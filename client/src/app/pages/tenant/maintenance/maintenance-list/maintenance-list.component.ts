import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDividerModule } from '@angular/material/divider';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { MaintenanceService } from '../../../../services/maintenance.service';
import { IMaintenance } from '../../../../interfaces/models';

@Component({
  selector: 'app-maintenance-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatSelectModule,
    MatFormFieldModule,
    MatDividerModule,
    MatToolbarModule,
    MatSnackBarModule,
    MatDialogModule,
    FormsModule,
  ],
  templateUrl: './maintenance-list.component.html',
  styleUrls: ['./maintenance-list.component.scss'],
})
export class MaintenanceListComponent implements OnInit {
  selectedStatus: string = '';
  selectedRequest: IMaintenance | null = null;

  displayedColumns: string[] = ['title', 'property', 'status', 'createdAt', 'actions'];

  constructor(
    public maintenanceService: MaintenanceService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadMaintenanceRequests();
  }

  private loadMaintenanceRequests(): void {
    this.maintenanceService.getTenantMaintenanceRequests().subscribe({
      next: () => {
        // Data is loaded into the signal automatically by the service
      },
      error: (error: any) => {
        this.snackBar.open('Failed to load maintenance requests', 'Close', { duration: 3000 });
        console.error('Error loading maintenance requests:', error);
      },
    });
  }

  filteredRequests = () => {
    const requests = this.maintenanceService.maintenanceListSignal();
    if (!this.selectedStatus) {
      return requests;
    }
    return requests.filter((req) => req.status === this.selectedStatus);
  };

  getStatusClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      PENDING: 'pending',
      IN_PROGRESS: 'in-progress',
      RESOLVED: 'resolved',
    };
    return statusMap[status] || 'pending';
  }

  formatStatus(status: string): string {
    const statusMap: { [key: string]: string } = {
      PENDING: 'Pending',
      IN_PROGRESS: 'In Progress',
      RESOLVED: 'Resolved',
    };
    return statusMap[status] || status;
  }

  viewDetails(request: IMaintenance): void {
    this.selectedRequest = request;
  }

  deleteRequest(id: string): void {
    if (confirm('Are you sure you want to delete this maintenance request?')) {
      const idNum = parseInt(id, 10);
      this.maintenanceService.deleteMaintenanceRequest(idNum).subscribe({
        next: () => {
          this.snackBar.open('Maintenance request deleted', 'Close', { duration: 3000 });
          this.loadMaintenanceRequests();
        },
        error: (error: any) => {
          this.snackBar.open('Failed to delete maintenance request', 'Close', { duration: 3000 });
          console.error('Error deleting maintenance request:', error);
        },
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/tenant/dashboard']);
  }
}
