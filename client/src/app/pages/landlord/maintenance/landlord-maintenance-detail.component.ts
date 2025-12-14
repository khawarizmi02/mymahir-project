import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
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
  selector: 'app-landlord-maintenance-detail',
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
    ReactiveFormsModule,
  ],
  template: `
    <div class="detail-container">
      <!-- Loading State -->
      <div *ngIf="isLoading" class="loading-container">
        <mat-spinner diameter="40"></mat-spinner>
        <p>Loading maintenance request...</p>
      </div>

      <!-- Detail Card -->
      <mat-card *ngIf="!isLoading && maintenance" class="detail-card">
        <mat-card-header>
          <div class="header-top">
            <button mat-icon-button (click)="goBack()" class="back-btn">
              <mat-icon>arrow_back</mat-icon>
            </button>
            <mat-card-title>{{ maintenance.title }}</mat-card-title>
          </div>
          <mat-card-subtitle>
            <mat-chip class="status-chip" [ngClass]="getStatusClass(maintenance.status)">
              {{ formatStatus(maintenance.status) }}
            </mat-chip>
          </mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
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

              <div class="form-actions">
                <button
                  mat-raised-button
                  color="primary"
                  type="submit"
                  [disabled]="isUpdating || !statusForm.valid"
                >
                  <mat-icon *ngIf="!isUpdating">save</mat-icon>
                  <mat-spinner *ngIf="isUpdating" diameter="20"></mat-spinner>
                  {{ isUpdating ? 'Updating...' : 'Update Status' }}
                </button>
                <button mat-button type="button" (click)="goBack()">Cancel</button>
              </div>
            </form>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Error State -->
      <div *ngIf="!isLoading && !maintenance" class="error-state">
        <mat-card>
          <mat-card-content>
            <mat-icon color="warn">error</mat-icon>
            <p>Maintenance request not found</p>
            <button mat-raised-button color="primary" (click)="goBack()">Go Back</button>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [
    `
      .detail-container {
        padding: 20px;
        max-width: 1000px;
        margin: 0 auto;
      }

      .loading-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 60px;
        gap: 16px;
      }

      .detail-card {
        margin-bottom: 20px;
      }

      .header-top {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .back-btn {
        margin-left: -12px;
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
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
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
        padding: 40px;
        color: rgba(0, 0, 0, 0.4);

        mat-icon {
          font-size: 48px;
          width: 48px;
          height: 48px;
        }
      }

      .status-update-section {
        background-color: #f9f9f9;
        padding: 20px;
        border-radius: 8px;
      }

      .full-width {
        width: 100%;
      }

      .form-actions {
        display: flex;
        gap: 12px;
        margin-top: 16px;
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
export class LandlordMaintenanceDetailComponent implements OnInit, OnDestroy {
  maintenance: MaintenanceRequest | null = null;
  statusForm: FormGroup;
  isLoading = true;
  isUpdating = false;
  selectedPhoto: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private apiService: ApiService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
    private fb: FormBuilder
  ) {
    this.statusForm = this.fb.group({
      status: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadMaintenanceDetail(parseInt(id));
    }
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
        },
        error: (err: any) => {
          console.error('Failed to update status:', err);
          this.snackBar.open('Failed to update status', 'Close', { duration: 3000 });
          this.isUpdating = false;
        },
      });
  }

  goBack(): void {
    this.router.navigate(['/landlord/maintenance']);
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
