import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
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
import {
  MatDialog,
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface MaintenanceRequest {
  id: number;
  title: string;
  description?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED';
  photos?: string[];
  property?: {
    id: number;
    address: string;
  };
  tenant?: {
    id: number;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

@Component({
  selector: 'app-landlord-maintenance-list',
  standalone: true,
  imports: [
    CommonModule,
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
    ReactiveFormsModule,
  ],
  template: `
    <div class="landlord-maintenance-container">
      <div class="landlord-maintenance-header">
        <div class="left-header">
          <button mat-icon-button (click)="goBack()" class="back-btn">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <h2>Maintenance Requests</h2>
        </div>
      </div>
      <mat-card class="list-card">
        <mat-card-content>
          <!-- Filters -->
          <div class="filter-section">
            <mat-form-field appearance="outline" class="filter-field">
              <mat-label>Filter by Status</mat-label>
              <mat-select [(ngModel)]="selectedStatus" (change)="filterRequests()">
                <mat-option value="">All Statuses</mat-option>
                <mat-option value="PENDING">Pending</mat-option>
                <mat-option value="IN_PROGRESS">In Progress</mat-option>
                <mat-option value="RESOLVED">Resolved</mat-option>
              </mat-select>
            </mat-form-field>
          </div>

          <mat-divider></mat-divider>

          <!-- Loading State -->
          <div *ngIf="isLoading" class="loading-container">
            <mat-spinner diameter="40"></mat-spinner>
            <p>Loading maintenance requests...</p>
          </div>

          <!-- Empty State -->
          <div *ngIf="!isLoading && filteredRequests.length === 0" class="empty-state">
            <mat-icon>inbox</mat-icon>
            <h3>No maintenance requests</h3>
            <p>You don't have any maintenance requests from your tenants.</p>
          </div>

          <!-- Requests Table -->
          <div *ngIf="!isLoading && filteredRequests.length > 0" class="table-wrapper">
            <table mat-table [dataSource]="filteredRequests" class="maintenance-table">
              <!-- Title Column -->
              <ng-container matColumnDef="title">
                <th mat-header-cell *matHeaderCellDef>Title</th>
                <td mat-cell *matCellDef="let element">
                  <strong>{{ element.title }}</strong>
                </td>
              </ng-container>

              <!-- Property Column -->
              <ng-container matColumnDef="property">
                <th mat-header-cell *matHeaderCellDef>Property</th>
                <td mat-cell *matCellDef="let element">
                  {{ element.property?.address || 'N/A' }}
                </td>
              </ng-container>

              <!-- Tenant Column -->
              <ng-container matColumnDef="tenant">
                <th mat-header-cell *matHeaderCellDef>Tenant</th>
                <td mat-cell *matCellDef="let element">
                  {{ element.tenant?.name || 'N/A' }}
                </td>
              </ng-container>

              <!-- Status Column -->
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let element">
                  <mat-chip class="status-chip" [ngClass]="getStatusClass(element.status)">
                    {{ formatStatus(element.status) }}
                  </mat-chip>
                </td>
              </ng-container>

              <!-- Date Column -->
              <ng-container matColumnDef="createdAt">
                <th mat-header-cell *matHeaderCellDef>Created</th>
                <td mat-cell *matCellDef="let element">
                  {{ element.createdAt | date : 'MMM dd, yyyy' }}
                </td>
              </ng-container>

              <!-- Actions Column -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let element">
                  <button
                    mat-icon-button
                    matTooltip="View Details"
                    (click)="viewDetails(element.id)"
                    color="primary"
                  >
                    <mat-icon>visibility</mat-icon>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
            </table>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .landlord-maintenance-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 16px;
        margin-bottom: 24px;
        padding: 16px 24px;
        background: linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%);
        border-radius: 12px;
      }

      .left-header {
        display: flex;
        flex-direction: row;
        width: fit-content;
        gap: 1rem;
        align-items: center;
      }

      .left-header h2 {
        margin: 0;
        font-size: 28px;
        font-weight: 600;
        color: #1a237e;
      }

      .landlord-maintenance-container {
        max-width: 80rem;
        margin: auto;
        padding-top: 24px;
      }

      .list-card {
        margin-bottom: 20px;
      }

      .filter-section {
        padding: 16px 0;
        display: flex;
        gap: 16px;
        align-items: center;
      }

      .filter-field {
        width: 200px;
      }

      .loading-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 40px;
        gap: 16px;
      }

      .empty-state {
        text-align: center;
        padding: 40px;
        opacity: 0.7;
      }

      .empty-state mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        margin-bottom: 16px;
      }

      .table-wrapper {
        overflow-x: auto;
      }

      .maintenance-table {
        width: 100%;
      }

      .status-chip {
        font-size: 12px;
        padding: 4px 8px;

        &.pending {
          background-color: #fff3cd;
          color: #856404;
        }

        &.in-progress {
          background-color: #cfe2ff;
          color: #084298;
        }

        &.resolved {
          background-color: #d1e7dd;
          color: #0f5132;
        }
      }
    `,
  ],
})
export class LandlordMaintenanceListComponent implements OnInit, OnDestroy {
  maintenanceRequests: MaintenanceRequest[] = [];
  filteredRequests: MaintenanceRequest[] = [];
  selectedStatus = '';
  isLoading = true;
  displayedColumns = ['title', 'property', 'tenant', 'status', 'createdAt', 'actions'];

  private destroy$ = new Subject<void>();

  constructor(
    private apiService: ApiService,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadMaintenanceRequests();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadMaintenanceRequests(): void {
    this.isLoading = true;
    this.apiService
      .get('/maintenances')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.maintenanceRequests = response.data || [];
          this.filterRequests();
          this.isLoading = false;
        },
        error: (err: any) => {
          console.error('Failed to load maintenance requests:', err);
          this.snackBar.open('Failed to load maintenance requests', 'Close', { duration: 3000 });
          this.isLoading = false;
        },
      });
  }

  filterRequests(): void {
    if (this.selectedStatus) {
      this.filteredRequests = this.maintenanceRequests.filter(
        (r) => r.status === this.selectedStatus
      );
    } else {
      this.filteredRequests = [...this.maintenanceRequests];
    }
  }

  viewDetails(id: number): void {
    const dialogRef = this.dialog.open(MaintenanceDetailDialogComponent, {
      width: '900px',
      maxHeight: '90vh',
      data: { maintenanceId: id },
    });

    dialogRef.afterClosed().subscribe((result) => {
      // Reload the maintenance list if data was updated
      if (result?.updated) {
        this.loadMaintenanceRequests();
      }
    });
  }

  formatStatus(status: string): string {
    return status.replace(/_/g, ' ');
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'pending';
      case 'IN_PROGRESS':
        return 'in-progress';
      case 'RESOLVED':
        return 'resolved';
      default:
        return '';
    }
  }

  goBack(): void {
    this.router.navigate(['/landlord/dashboard']);
  }
}

// Maintenance Detail Dialog Component
@Component({
  selector: 'app-maintenance-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatSelectModule,
    MatFormFieldModule,
    MatDividerModule,
    MatSnackBarModule,
    MatDialogModule,
    ReactiveFormsModule,
  ],
  template: `
    <!-- Loading State -->
    <div *ngIf="isLoading" class="loading-container">
      <mat-spinner diameter="40"></mat-spinner>
      <p>Loading maintenance request...</p>
    </div>

    <!-- Detail Content -->
    <div *ngIf="!isLoading && maintenance" class="dialog-content">
      <!-- Header -->
      <div class="dialog-header">
        <h2 mat-dialog-title>{{ maintenance.title }}</h2>
        <mat-chip class="status-chip" [ngClass]="getStatusClass(maintenance.status)">
          {{ formatStatus(maintenance.status) }}
        </mat-chip>
      </div>

      <mat-dialog-content>
        <!-- Request Info -->
        <div class="info-section">
          <div class="info-grid">
            <div class="info-item">
              <label>Property:</label>
              <p>{{ maintenance.property?.address || 'N/A' }}</p>
            </div>

            <div class="info-item">
              <label>Tenant:</label>
              <p>{{ maintenance.tenant?.name || 'N/A' }}</p>
            </div>

            <div class="info-item">
              <label>Tenant Email:</label>
              <p>{{ maintenance.tenant?.email || 'N/A' }}</p>
            </div>

            <div class="info-item">
              <label>Created:</label>
              <p>{{ maintenance.createdAt | date : 'MMM dd, yyyy, hh:mm a' }}</p>
            </div>

            <div class="info-item">
              <label>Last Updated:</label>
              <p>{{ maintenance.updatedAt | date : 'MMM dd, yyyy, hh:mm a' }}</p>
            </div>
          </div>
        </div>

        <mat-divider></mat-divider>

        <!-- Description -->
        <div class="description-section">
          <h3>Description</h3>
          <p>{{ maintenance.description || 'No description provided' }}</p>
        </div>

        <mat-divider></mat-divider>

        <!-- Photos Gallery -->
        <div *ngIf="maintenance.photos && maintenance.photos.length > 0" class="photos-section">
          <h3>Photos ({{ maintenance.photos.length }})</h3>
          <div class="photo-gallery">
            <div
              *ngFor="let photo of maintenance.photos; let i = index"
              class="photo-item"
              (click)="selectedPhoto = photo"
            >
              <img [src]="photo" alt="Maintenance photo {{ i + 1 }}" class="photo-thumbnail" />
            </div>
          </div>

          <!-- Photo Lightbox -->
          <div *ngIf="selectedPhoto" class="lightbox" (click)="selectedPhoto = null">
            <div class="lightbox-content" (click)="$event.stopPropagation()">
              <button mat-icon-button class="close-btn" (click)="selectedPhoto = null">
                <mat-icon>close</mat-icon>
              </button>
              <img [src]="selectedPhoto" alt="Full size photo" class="lightbox-image" />
            </div>
          </div>
        </div>

        <div *ngIf="!maintenance.photos || maintenance.photos.length === 0" class="no-photos">
          <mat-icon>image_not_supported</mat-icon>
          <p>No photos provided</p>
        </div>

        <mat-divider></mat-divider>

        <!-- Status Update Form -->
        <div class="status-update-section">
          <h3>Update Status</h3>
          <form [formGroup]="statusForm" (ngSubmit)="updateStatus()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Status</mat-label>
              <mat-select formControlName="status">
                <mat-option value="PENDING">Pending</mat-option>
                <mat-option value="IN_PROGRESS">In Progress</mat-option>
                <mat-option value="RESOLVED">Resolved</mat-option>
              </mat-select>
            </mat-form-field>
          </form>
        </div>
      </mat-dialog-content>

      <!-- Dialog Actions -->
      <mat-dialog-actions align="end">
        <button mat-button (click)="onClose()">Cancel</button>
        <button
          mat-raised-button
          color="primary"
          (click)="updateStatus()"
          [disabled]="isUpdating || !statusForm.valid"
        >
          <mat-icon *ngIf="!isUpdating">save</mat-icon>
          <mat-spinner *ngIf="isUpdating" diameter="20"></mat-spinner>
          {{ isUpdating ? 'Updating...' : 'Update Status' }}
        </button>
      </mat-dialog-actions>
    </div>

    <!-- Error State -->
    <div *ngIf="!isLoading && !maintenance" class="error-state">
      <mat-icon color="warn">error</mat-icon>
      <p>Maintenance request not found</p>
      <button mat-raised-button color="primary" (click)="onClose()">Close</button>
    </div>
  `,
  styles: [
    `
      .loading-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 60px 20px;
        gap: 16px;
      }

      .dialog-content {
        max-height: 80vh;
        overflow-y: auto;
      }

      .dialog-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;

        h2 {
          margin: 0;
          flex: 1;
        }

        mat-chip {
          margin-right: 16px;
        }
      }

      .info-section,
      .description-section,
      .photos-section,
      .status-update-section {
        padding: 16px 0;
      }

      .info-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
      }

      .info-item {
        display: flex;
        flex-direction: column;
        gap: 4px;

        label {
          font-weight: 600;
          font-size: 14px;
          color: rgba(0, 0, 0, 0.6);
        }

        p {
          margin: 0;
          font-size: 16px;
        }
      }

      .description-section {
        p {
          white-space: pre-wrap;
          line-height: 1.6;
        }
      }

      .photo-gallery {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
        gap: 12px;
        margin-top: 12px;
      }

      .photo-item {
        aspect-ratio: 1;
        overflow: hidden;
        border-radius: 8px;
        cursor: pointer;
        background-color: #f5f5f5;
        transition: transform 0.2s;

        &:hover {
          transform: scale(1.05);
        }
      }

      .photo-thumbnail {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .lightbox {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }

      .lightbox-content {
        position: relative;
        max-width: 90vw;
        max-height: 90vh;
      }

      .close-btn {
        position: absolute;
        top: -40px;
        right: 0;
        color: white;
      }

      .lightbox-image {
        max-width: 100%;
        max-height: 100%;
      }

      .no-photos {
        text-align: center;
        padding: 40px 20px;
        color: rgba(0, 0, 0, 0.4);

        mat-icon {
          font-size: 48px;
          width: 48px;
          height: 48px;
        }
      }

      .status-update-section {
        background-color: #f9f9f9;
        padding: 16px;
        border-radius: 8px;
      }

      .full-width {
        width: 100%;
      }

      .status-chip {
        font-size: 12px;
        padding: 4px 8px;

        &.pending {
          background-color: #fff3cd;
          color: #856404;
        }

        &.in-progress {
          background-color: #cfe2ff;
          color: #084298;
        }

        &.resolved {
          background-color: #d1e7dd;
          color: #0f5132;
        }
      }

      .error-state {
        text-align: center;
        padding: 40px;
      }

      .error-state mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
      }
    `,
  ],
})
export class MaintenanceDetailDialogComponent implements OnInit, OnDestroy {
  maintenance: MaintenanceRequest | null = null;
  statusForm: FormGroup;
  isLoading = true;
  isUpdating = false;
  selectedPhoto: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private apiService: ApiService,
    private snackBar: MatSnackBar,
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<MaintenanceDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { maintenanceId: number }
  ) {
    this.statusForm = this.fb.group({
      status: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadMaintenanceDetail(this.data.maintenanceId);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadMaintenanceDetail(id: number): void {
    this.isLoading = true;
    this.apiService
      .get(`/maintenances/${id}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.maintenance = response.data;
          this.statusForm.patchValue({ status: this.maintenance?.status });
          this.isLoading = false;
        },
        error: (err: any) => {
          console.error('Failed to load maintenance request:', err);
          this.snackBar.open('Failed to load maintenance request', 'Close', { duration: 3000 });
          this.isLoading = false;
        },
      });
  }

  updateStatus(): void {
    if (!this.statusForm.valid || !this.maintenance) {
      return;
    }

    this.isUpdating = true;
    const newStatus = this.statusForm.get('status')?.value;

    this.apiService
      .put(`/maintenances/${this.maintenance.id}`, { status: newStatus })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.maintenance = response.data;
          this.snackBar.open('Status updated successfully', 'OK', { duration: 3000 });
          this.isUpdating = false;
          this.dialogRef.close({ updated: true });
        },
        error: (err: any) => {
          console.error('Failed to update status:', err);
          this.snackBar.open('Failed to update status', 'Close', { duration: 3000 });
          this.isUpdating = false;
        },
      });
  }

  onClose(): void {
    this.dialogRef.close();
  }

  formatStatus(status: string): string {
    return status.replace(/_/g, ' ');
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'pending';
      case 'IN_PROGRESS':
        return 'in-progress';
      case 'RESOLVED':
        return 'resolved';
      default:
        return '';
    }
  }
}
