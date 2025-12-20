import { Component, OnInit, OnDestroy } from '@angular/core';
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
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface MaintenanceRequest {
  id: number;
  title: string;
  description?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED';
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
    FormsModule,
  ],
  template: `
    <mat-toolbar color="primary" class="toolbar">
      <button mat-icon-button (click)="goBack()">
        <mat-icon>arrow_back</mat-icon>
      </button>
      <span class="title">Maintenance Requests</span>
      <span class="spacer"></span>
    </mat-toolbar>

    <div class="landlord-maintenance-container">
      <mat-card class="list-card">
        <mat-card-header>
          <mat-card-title>All Maintenance Requests</mat-card-title>
          <mat-card-subtitle>Manage all maintenance requests from your tenants</mat-card-subtitle>
        </mat-card-header>

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
      .toolbar {
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        margin-bottom: 20px;
      }

      .title {
        font-size: 18px;
        font-weight: 500;
      }

      .spacer {
        flex: 1 1 auto;
      }

      .landlord-maintenance-container {
        padding: 20px;
        max-width: 1200px;
        margin: 0 auto;
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
    private snackBar: MatSnackBar
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
    this.router.navigate(['/landlord/maintenance', id]);
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
