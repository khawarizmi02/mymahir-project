import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MediaMatcher } from '@angular/cdk/layout';
import { AuthService } from '../../services/auth.service';
import { AuthApiService } from '../../services/auth-api.service';

@Component({
  selector: 'app-navigation-bar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatBadgeModule,
    MatSidenavModule,
    MatListModule,
    MatDividerModule,
    MatChipsModule
  ],
  templateUrl: './navigation-bar.component.html',
  styleUrls: ['./navigation-bar.component.scss']
})
export class NavigationBarComponent implements OnInit {
  @ViewChild('sidenav') sidenav: any;

  userRole: string | null = null;
  userEmail: string | null = null;
  isMobile = false;
  mobileQuery: MediaQueryList;
  private mobileQueryListener: () => void;

  // Tenant menu items
  tenantMenuItems = [
    { label: 'Dashboard', icon: 'dashboard', route: '/tenant/dashboard' },
    { label: 'Maintenance', icon: 'home_repair_service', route: '/tenant/maintenance' },
    { label: 'Payments', icon: 'payment', route: '/tenant/payments' }
  ];

  // Landlord menu items
  landlordMenuItems = [
    { label: 'Dashboard', icon: 'dashboard', route: '/landlord/dashboard' },
    { label: 'Properties', icon: 'apartment', route: '/landlord/properties' },
    { label: 'Tenants', icon: 'people', route: '/landlord/tenants' },
    { label: 'Maintenance', icon: 'home_repair_service', route: '/landlord/maintenance' },
    { label: 'Payments', icon: 'payment', route: '/landlord/payments' }
  ];

  get menuItems() {
    return this.userRole === 'TENANT' ? this.tenantMenuItems : this.landlordMenuItems;
  }

  constructor(
    private authService: AuthService,
    private authApi: AuthApiService,
    private router: Router,
    media: MediaMatcher
  ) {
    this.mobileQuery = media.matchMedia('(max-width: 768px)');
    this.mobileQueryListener = () => this.updateIsMobile();
    this.mobileQuery.addListener(this.mobileQueryListener);
  }

  ngOnInit(): void {
    this.userRole = this.authService.getUserRole();
    this.userEmail = localStorage.getItem('user_email') || 'User';
    this.updateIsMobile();
  }

  ngOnDestroy(): void {
    this.mobileQuery.removeListener(this.mobileQueryListener);
  }

  private updateIsMobile(): void {
    this.isMobile = this.mobileQuery.matches;
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
    if (this.sidenav) {
      this.sidenav.close();
    }
  }

  goToProfile(): void {
    const profileRoute = this.userRole === 'TENANT' ? '/tenant/profile' : '/landlord/profile';
    this.navigateTo(profileRoute);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  toggleSidenav(): void {
    if (this.sidenav) {
      this.sidenav.toggle();
    }
  }

  closeSidenav(): void {
    if (this.sidenav) {
      this.sidenav.close();
    }
  }

  getRoleColor(): string {
    return this.userRole === 'TENANT' ? 'primary' : 'accent';
  }

  getRoleIcon(): string {
    return this.userRole === 'TENANT' ? 'person' : 'business';
  }
}
