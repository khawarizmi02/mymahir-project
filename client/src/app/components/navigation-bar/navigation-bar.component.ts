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
    MatChipsModule,
  ],
  templateUrl: './navigation-bar.component.html',
  styleUrls: ['./navigation-bar.component.scss'],
})
export class NavigationBarComponent implements OnInit {
  @ViewChild('sidenav') sidenav: any;

  isMobile = false;
  mobileQuery: MediaQueryList;
  private mobileQueryListener: () => void;

  // Tenant menu items
  tenantMenuItems = [
    { label: 'Dashboard', icon: 'dashboard', route: '/tenant/dashboard' },
    { label: 'Maintenance', icon: 'home_repair_service', route: '/tenant/maintenance' },
    { label: 'Payments', icon: 'payment', route: '/tenant/payments' },
  ];

  // Landlord menu items
  landlordMenuItems = [
    { label: 'Dashboard', icon: 'dashboard', route: '/landlord/dashboard' },
    { label: 'Properties', icon: 'apartment', route: '/landlord/properties' },
    { label: 'Tenants', icon: 'people', route: '/landlord/tenants' },
    { label: 'Maintenance', icon: 'home_repair_service', route: '/landlord/maintenance' },
    { label: 'Payments', icon: 'payment', route: '/landlord/payments' },
  ];

  // Reactive signals from AuthService (via getters)
  get isAuthenticated() {
    return this.authService.isAuthenticated;
  }

  get userRole() {
    return this.authService.userRole$;
  }

  get userEmail() {
    return this.authService.userEmail$;
  }

  get menuItems() {
    const role = this.userRole();
    return role === 'TENANT' ? this.tenantMenuItems : this.landlordMenuItems;
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
    const role = this.userRole();
    const profileRoute = role === 'TENANT' ? '/tenant/profile' : '/landlord/profile';
    this.navigateTo(profileRoute);
  }

  logout(): void {
    this.authService.logout();
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
    const role = this.userRole();
    return role === 'TENANT' ? 'primary' : 'accent';
  }

  getRoleIcon(): string {
    const role = this.userRole();
    return role === 'TENANT' ? 'person' : 'business';
  }
}
