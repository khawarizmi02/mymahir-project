import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { DataService } from '../../../services/data.service';
import { PaymentStatus, MaintenanceStatus } from '../../../interfaces/models';

// Interfaces for multiple tenancy support
interface Tenancy {
  id: number;
  propertyId: number;
  propertyTitle: string;
  propertyAddress: string;
  landlordId: number;
  landlordName: string;
  landlordEmail: string;
  monthlyRent: number;
  leaseStart: string;
  leaseEnd: string;
  isActive: boolean;
}

interface Payment {
  id: number;
  tenancyId: number;
  amount: number;
  status: string;
  paidAt: string | null;
  createdAt: string;
  tenancy?: {
    property?: { title: string };
  };
}

interface MaintenanceRequest {
  id: number;
  propertyId: number;
  title: string;
  description: string;
  status: string;
  createdAt: string;
}

interface AggregateMetrics {
  totalMonthlyRent: number;
  earliestPaymentDue: { date: string; propertyTitle: string; daysUntil: number } | null;
  soonestLeaseEnding: { date: string; propertyTitle: string; daysRemaining: number } | null;
  totalOpenRequests: number;
  totalTenancies: number;
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
    MatProgressSpinnerModule,
    MatSelectModule,
    MatFormFieldModule,
    MatMenuModule,
    MatBadgeModule,
    MatTooltipModule,
    FormsModule
  ]
})
export class TenantDashboardComponent implements OnInit {
  // State signals
  isLoading = signal(true);
  error = signal<string | null>(null);
  userName = signal<string>('');

  // Data signals
  allTenancies = signal<Tenancy[]>([]);
  allPayments = signal<Payment[]>([]);
  allMaintenanceRequests = signal<MaintenanceRequest[]>([]);
  selectedTenancyId = signal<number | null>(null);

  // Computed: Selected tenancy object
  selectedTenancy = computed(() => {
    const tenancies = this.allTenancies();
    const selectedId = this.selectedTenancyId();
    if (selectedId) {
      return tenancies.find(t => t.id === selectedId) || null;
    }
    // Default to first active tenancy
    return tenancies.find(t => t.isActive) || tenancies[0] || null;
  });

  // Computed: Active tenancies (lease not ended)
  activeTenancies = computed(() => {
    const now = new Date();
    return this.allTenancies().filter(t => new Date(t.leaseEnd) >= now);
  });

  // Computed: Aggregate metrics across ALL tenancies
  aggregateMetrics = computed<AggregateMetrics>(() => {
    const tenancies = this.activeTenancies();
    const now = new Date();

    // Total monthly rent across all properties
    const totalMonthlyRent = tenancies.reduce((sum, t) => sum + t.monthlyRent, 0);

    // Find earliest payment due (assume first of next month for active tenancies)
    let earliestPaymentDue: AggregateMetrics['earliestPaymentDue'] = null;
    const activeTenancies = tenancies.filter(t => t.isActive);
    if (activeTenancies.length > 0) {
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const daysUntil = Math.ceil((nextMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      earliestPaymentDue = {
        date: nextMonth.toISOString(),
        propertyTitle: activeTenancies.length > 1 ? `${activeTenancies.length} properties` : activeTenancies[0].propertyTitle,
        daysUntil
      };
    }

    // Find soonest lease ending
    let soonestLeaseEnding: AggregateMetrics['soonestLeaseEnding'] = null;
    if (tenancies.length > 0) {
      const sorted = [...tenancies].sort((a, b) => 
        new Date(a.leaseEnd).getTime() - new Date(b.leaseEnd).getTime()
      );
      const soonest = sorted[0];
      const daysRemaining = Math.ceil((new Date(soonest.leaseEnd).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      soonestLeaseEnding = {
        date: soonest.leaseEnd,
        propertyTitle: soonest.propertyTitle,
        daysRemaining
      };
    }

    // Total open maintenance requests
    const totalOpenRequests = this.allMaintenanceRequests().filter(
      r => r.status === 'PENDING' || r.status === 'IN_PROGRESS'
    ).length;

    return {
      totalMonthlyRent,
      earliestPaymentDue,
      soonestLeaseEnding,
      totalOpenRequests,
      totalTenancies: tenancies.length
    };
  });

  // Computed: Payments for selected tenancy
  selectedTenancyPayments = computed(() => {
    const selected = this.selectedTenancy();
    if (!selected) return [];
    return this.allPayments()
      .filter(p => p.tenancyId === selected.id)
      .slice(0, 5);
  });

  // Computed: Maintenance for selected property
  selectedPropertyMaintenance = computed(() => {
    const selected = this.selectedTenancy();
    if (!selected) return [];
    return this.allMaintenanceRequests()
      .filter(r => r.propertyId === selected.propertyId)
      .slice(0, 5);
  });

  // Computed: Days until selected lease ends
  selectedLeaseDaysRemaining = computed(() => {
    const selected = this.selectedTenancy();
    if (!selected) return 0;
    const now = new Date();
    const leaseEnd = new Date(selected.leaseEnd);
    return Math.ceil((leaseEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  });

  constructor(
    private apiService: ApiService,
    private dataService: DataService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUserName();
    this.loadAllData();
  }

  loadUserName(): void {
    const userData = this.dataService.getLocalStorage<{ name?: string; email?: string }>('user');
    if (userData) {
      this.userName.set(userData.name || userData.email || 'Tenant');
    }
  }

  async loadAllData(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      // Load all tenancies
      const tenanciesRes = await this.apiService.getTenantTenancies().toPromise();
      if (tenanciesRes?.data) {
        // Transform backend response to match our Tenancy interface
        const tenancies: Tenancy[] = tenanciesRes.data.map((t: any) => {
          const now = new Date();
          const leaseStart = new Date(t.leaseStart);
          const leaseEnd = new Date(t.leaseEnd);
          const isActive = leaseStart <= now && leaseEnd >= now;
          
          return {
            id: t.id,
            propertyId: t.propertyId ?? t.property?.id,
            propertyTitle: t.propertyTitle ?? t.property?.title ?? 'Unknown Property',
            propertyAddress: t.propertyAddress ?? t.property?.address ?? '',
            landlordId: t.landlordId ?? t.property?.landlordId ?? t.landlord?.id,
            landlordName: t.landlordName ?? t.landlord?.name ?? t.property?.landlord?.name ?? 'Unknown',
            landlordEmail: t.landlordEmail ?? t.landlord?.email ?? t.property?.landlord?.email ?? '',
            monthlyRent: Number(t.monthlyRent ?? t.property?.rentAmount ?? 0),
            leaseStart: t.leaseStart,
            leaseEnd: t.leaseEnd,
            isActive: t.isActive ?? isActive
          };
        });
        
        this.allTenancies.set(tenancies);
        
        // Auto-select first active tenancy, or first upcoming if none active
        const active = tenancies.find(t => t.isActive);
        if (active) {
          this.selectedTenancyId.set(active.id);
        } else if (tenancies.length > 0) {
          this.selectedTenancyId.set(tenancies[0].id);
        }
      }

      // Load all payments
      const paymentsRes = await this.apiService.getTenantPayments().toPromise();
      if (paymentsRes?.data) {
        this.allPayments.set(paymentsRes.data as Payment[]);
      }

      // Maintenance requests - set empty for now
      this.allMaintenanceRequests.set([]);

    } catch (err) {
      console.error('Error loading dashboard:', err);
      this.error.set('Failed to load dashboard data');
    } finally {
      this.isLoading.set(false);
    }
  }

  onTenancyChange(tenancyId: number): void {
    this.selectedTenancyId.set(tenancyId);
  }

  navigateToMakePayment(): void {
    const selected = this.selectedTenancy();
    if (selected) {
      this.router.navigate(['/tenant/payments/new'], { queryParams: { tenancyId: selected.id } });
    } else {
      this.router.navigate(['/tenant/payments/new']);
    }
  }

  navigateToPaymentHistory(): void {
    this.router.navigate(['/tenant/payments']);
  }

  navigateToReportIssue(): void {
    const selected = this.selectedTenancy();
    if (selected) {
      this.router.navigate(['/tenant/maintenance/new'], { queryParams: { propertyId: selected.propertyId } });
    }
  }

  getPaymentStatusColor(status: string): 'primary' | 'accent' | 'warn' {
    switch (status?.toUpperCase()) {
      case 'COMPLETED':
      case 'PAID':
        return 'primary';
      case 'PENDING':
        return 'warn';
      case 'FAILED':
        return 'accent';
      default:
        return 'primary';
    }
  }

  getMaintenanceStatusColor(status: string): 'primary' | 'accent' | 'warn' {
    switch (status?.toUpperCase()) {
      case 'RESOLVED':
        return 'primary';
      case 'IN_PROGRESS':
        return 'accent';
      case 'PENDING':
        return 'warn';
      default:
        return 'primary';
    }
  }

  getLeaseStatusClass(): string {
    const days = this.selectedLeaseDaysRemaining();
    if (days <= 30) return 'urgent';
    if (days <= 90) return 'warning';
    return 'good';
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

  logout(): void {
    this.dataService.deleteStorage('token');
    this.dataService.deleteStorage('user');
    this.router.navigate(['/login']);
  }
}
