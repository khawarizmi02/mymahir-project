import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { AuthService } from '../../services/auth.service';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatToolbarModule,
    MatMenuModule,
    MatDividerModule,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  private router = inject(Router);
  private authService = inject(AuthService);

  // Auth state signals
  isAuthenticated = this.authService.isAuthenticated;
  userRole = this.authService.userRole$;
  userEmail = this.authService.userEmail$;

  navigateToProperties(): void {
    this.router.navigate(['/properties']);
  }

  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }

  navigateToDashboard() {
    const route = this.userRole() === 'TENANT' ? '/tenant/dashboard' : '/landlord/dashboard';
    this.router.navigate([route]);
  }

  logout() {
    this.authService.logout();
  }

  trendingLocations = [
    { name: 'Kuala Lumpur', icon: 'location_on' },
    { name: 'Cheras', icon: 'location_on' },
    { name: 'Melaka', icon: 'location_on' },
    { name: 'Johor Bahru', icon: 'location_on' },
    { name: 'Penang', icon: 'location_on' },
    { name: 'Subang Jaya', icon: 'location_on' },
    { name: 'Bukit Bintang', icon: 'location_on' },
    { name: 'Ipoh', icon: 'location_on' },
    { name: 'Bandar Utama', icon: 'location_on' },
    { name: 'Petaling Jaya', icon: 'location_on' },
    { name: 'Sabah', icon: 'location_on' },
    { name: 'Sarawak', icon: 'location_on' },
  ];
}
