import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { ApiService } from '../../services/api.service';
import { IDashboardMetrics, IUrgentTask } from '../../interfaces/models';

@Component({
  selector: 'app-landlord-dashboard',
  templateUrl: './landlord-dashboard.component.html',
  styleUrls: ['./landlord-dashboard.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatListModule,
    MatChipsModule,
    MatDividerModule
  ]
})
export class LandlordDashboardComponent implements OnInit {
  
  metrics: IDashboardMetrics = {
    totalProperties: 0,
    occupancyRate: 0,
    outstandingRent: '0.00',
    activeMaintenance: 0
  };

  urgentTasks: IUrgentTask[] = [];
  isLoading = true;

  constructor(private apiService: ApiService) { }

  ngOnInit(): void {
    this.apiService.getLandlordDashboardSummary().subscribe({
      next: (data: { metrics: IDashboardMetrics; urgentTasks: IUrgentTask[] }) => {
        this.metrics = data.metrics;
        this.urgentTasks = data.urgentTasks;
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Failed to load dashboard:', err);
        this.isLoading = false;
      }
    });
  }

  getTaskIcon(type: string): string {
    switch(type) {
      case 'MAINTENANCE': return 'build';
      case 'PAYMENT': return 'attach_money';
      case 'LEASE': return 'assignment';
      default: return 'info';
    }
  }
}