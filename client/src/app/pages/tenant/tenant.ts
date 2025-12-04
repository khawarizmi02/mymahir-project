import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { ApiService } from '../../services/api.service';
import { Router } from '@angular/router';
import { DataService } from '../../services/data.service';

interface TenantDashboardData {
  metrics: {
    currentRent: number;
    nextPaymentDue: string | null;
    leaseEndDate: string | null;
    openMaintenanceRequests: number;
  };
  property: {
    id: number;
    title: string;
    address: string;
    landlordName: string;
    landlordEmail: string;
    monthlyRent: number;
    leaseStart: string;
    leaseEnd: string;
  } | null;
  recentPayments: Array<{
    id: number;
    amount: number;
    status: string;
    paidAt: string | null;
    createdAt: string;
  }>;
  maintenanceRequests: Array<{
    id: number;
    propertyId: number;
    title: string;
    description: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  }>;
  upcomingTenancies: Array<{
    id: number;
    propertyId: number;
    propertyTitle: string;
    propertyAddress: string;
    landlordName: string;
    landlordEmail: string;
    monthlyRent: number;
    leaseStart: string;
    leaseEnd: string;
  }>;
}

interface AvailableProperty {
  id: number;
  title: string;
  address: string;
  description: string;
  bedrooms: number;
  bathrooms: number;
  monthlyRent: number;
  landlordName: string;
  createdAt: string;
}

@Component({
  selector: 'app-tenant',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatChipsModule,
    MatTabsModule
  ],
  templateUrl: './tenant.html',
  styleUrl: './tenant.scss',
})
export class Tenant implements OnInit {
  private apiService = inject(ApiService);
  private router = inject(Router);
  private dataService = inject(DataService);

  isLoading = signal(true);
  error = signal<string | null>(null);
  dashboardData = signal<TenantDashboardData | null>(null);
  availableProperties = signal<AvailableProperty[]>([]);
  propertiesLoading = signal(false);
  userName = signal<string>('');

  ngOnInit(): void {
    this.loadUserName();
    this.loadDashboard();
  }

  loadUserName(): void {
    const userData = this.dataService.getLocalStorage<{ name?: string; email?: string }>('user');
    if (userData) {
      this.userName.set(userData.name || userData.email || 'Tenant');
    }
  }

  loadDashboard(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.apiService.get<{ success: boolean; data: TenantDashboardData }>('/tenant/dashboard')
      .subscribe({
        next: (response: { success: boolean; data: TenantDashboardData }) => {
          console.log('Dashboard API response:', response);
          console.log('Upcoming tenancies:', response.data?.upcomingTenancies);
          if (response.success) {
            this.dashboardData.set(response.data);
          }
          this.isLoading.set(false);
        },
        error: (err: unknown) => {
          console.error('Error loading dashboard:', err);
          this.error.set('Failed to load dashboard data');
          this.isLoading.set(false);
        }
      });
  }

  loadAvailableProperties(): void {
    this.propertiesLoading.set(true);

    this.apiService.get<{ success: boolean; data: AvailableProperty[] }>('/tenant/properties')
      .subscribe({
        next: (response: { success: boolean; data: AvailableProperty[] }) => {
          if (response.success) {
            this.availableProperties.set(response.data);
          }
          this.propertiesLoading.set(false);
        },
        error: (err: unknown) => {
          console.error('Error loading properties:', err);
          this.propertiesLoading.set(false);
        }
      });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' }).format(amount);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-MY', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getStatusColor(status: string): string {
    switch (status.toUpperCase()) {
      case 'PAID':
      case 'COMPLETED':
        return 'primary';
      case 'PENDING':
        return 'accent';
      case 'IN_PROGRESS':
        return 'accent';
      case 'OVERDUE':
      case 'REJECTED':
        return 'warn';
      default:
        return '';
    }
  }

  logout(): void {
    this.dataService.deleteStorage('token');
    this.dataService.deleteStorage('user');
    this.router.navigate(['/login']);
  }
}
