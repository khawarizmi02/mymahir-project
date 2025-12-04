import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../../services/api.service';
import { 
  ITenantDashboardMetrics, 
  ITenantProperty, 
  ITenantPayment, 
  IMaintenance,
  PaymentStatus,
  MaintenanceStatus 
} from '../../../interfaces/models';

interface UpcomingTenancy {
  id: number;
  propertyId: number;
  propertyTitle: string;
  propertyAddress: string;
  landlordName: string;
  landlordEmail: string;
  monthlyRent: number;
  leaseStart: string;
  leaseEnd: string;
}

@Component({
  selector: 'app-tenant-dashboard',
  templateUrl: './tenant-dashboard.component.html',
  styleUrls: ['./tenant-dashboard.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatListModule,
    MatChipsModule,
    MatDividerModule,
    MatProgressSpinnerModule
  ]
})
export class TenantDashboardComponent implements OnInit {
  
  metrics: ITenantDashboardMetrics = {
    currentRent: 0,
    nextPaymentDue: null,
    leaseEndDate: null,
    openMaintenanceRequests: 0
  };

  property: ITenantProperty | null = null;
  recentPayments: ITenantPayment[] = [];
  maintenanceRequests: IMaintenance[] = [];
  upcomingTenancies: UpcomingTenancy[] = [];
  isLoading = true;
  hasActiveTenancy = false;

  constructor(private apiService: ApiService) { }

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.apiService.getTenantDashboardSummary().subscribe({
      next: (response: any) => {
        console.log('Dashboard response:', response);
        const data = response.data || response;
        this.metrics = data.metrics;
        this.property = data.property;
        this.recentPayments = data.recentPayments || [];
        this.maintenanceRequests = data.maintenanceRequests || [];
        this.upcomingTenancies = data.upcomingTenancies || [];
        this.hasActiveTenancy = !!this.property;
        this.isLoading = false;
        console.log('Upcoming tenancies:', this.upcomingTenancies);
      },
      error: (err: any) => {
        console.error('Failed to load tenant dashboard:', err);
        this.isLoading = false;
      }
    });
  }

  getPaymentStatusColor(status: PaymentStatus): string {
    switch(status) {
      case PaymentStatus.COMPLETED: return 'primary';
      case PaymentStatus.PENDING: return 'warn';
      case PaymentStatus.FAILED: return 'accent';
      default: return '';
    }
  }

  getMaintenanceStatusColor(status: MaintenanceStatus): string {
    switch(status) {
      case MaintenanceStatus.RESOLVED: return 'primary';
      case MaintenanceStatus.IN_PROGRESS: return 'accent';
      case MaintenanceStatus.PENDING: return 'warn';
      default: return '';
    }
  }

  getDaysUntilPayment(): number {
    if (!this.metrics.nextPaymentDue) return 0;
    const diff = new Date(this.metrics.nextPaymentDue).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  getDaysUntilLeaseEnd(): number {
    if (!this.metrics.leaseEndDate) return 0;
    const diff = new Date(this.metrics.leaseEndDate).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }
}
