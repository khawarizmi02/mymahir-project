import { Component, OnInit, signal, computed, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DataService } from '../../services/data.service';
import { ActivatedRoute } from '@angular/router';
import { filter, Subscription } from 'rxjs';


interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-navigation-bar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatSidenavModule,
    MatIconModule,
    MatButtonModule,
    MatListModule,
    MatToolbarModule,
    MatDividerModule,
    MatMenuModule,
    MatTooltipModule
  ],
  templateUrl: './navigation-bar.component.html',
  styleUrls: ['./navigation-bar.component.scss']
})
export class NavigationBarComponent implements OnInit, OnDestroy {
  private activatedRoute = inject(ActivatedRoute);
  private navigationSubscription: Subscription | null = null;

  isCollapsed = signal(true); // Sidebar collapsed by default
  userRole = signal<'tenant' | 'landlord' | null>(null);
  userName = signal<string>('');
  userEmail = signal<string>('');
  isAuthenticated = signal(false);
  isMobileView = signal(window.innerWidth < 768);

  // Public routes where navbar should NOT show
  publicRoutes = ['', '/', '/properties', '/login', '/login/verify', '/invite', '/'];

  shouldShowNavbar = computed(() => {
    const currentUrl = this.router.url;
    // Check if current URL is a public route
    const isPublicRoute = this.publicRoutes.some(route => {
      if (route === '' || route === '/') {
        // For home route, only hide if URL is exactly '/' or empty
        return currentUrl === '' || currentUrl === '/' || currentUrl === '.';
      }
      return currentUrl.startsWith(route);
    });
    
    console.log('Current URL:', currentUrl, 'Is Public:', isPublicRoute, 'Show Navbar:', this.isAuthenticated() && !isPublicRoute);
    return this.isAuthenticated() && !isPublicRoute;
  });

  
  tenantMenuItems: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/tenant/dashboard' },
    { label: 'Payments', icon: 'payment', route: '/tenant/payments' },
    { label: 'Maintenance', icon: 'build', route: '/tenant/maintenance' },
    { label: 'Profile', icon: 'person', route: '/tenant/profile' }
  ];

  // Landlord menu items
  landlordMenuItems: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/landlord/dashboard' },
    { label: 'Properties', icon: 'apartment', route: '/landlord/properties' },
    { label: 'Tenants', icon: 'people', route: '/landlord/tenants' },
    { label: 'Payments', icon: 'payment', route: '/landlord/payments' },
    { label: 'Analytics', icon: 'analytics', route: '/landlord/analytics' },
    { label: 'Profile', icon: 'person', route: '/landlord/profile' }
  ];

  menuItems = computed(() => {
    const role = this.userRole();
    const items = role === 'tenant' ? this.tenantMenuItems : this.landlordMenuItems;
    console.log('Menu items updated - Role:', role, 'Items:', items);
    return items;
  });

  constructor(
    private dataService: DataService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUserInfo();
    
    // Listen to window resize events
    window.addEventListener('resize', this.onWindowResize.bind(this));

    // Listen to route changes and reload user info
    this.navigationSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.loadUserInfo();
      });
  }

  ngOnDestroy(): void {
    if (this.navigationSubscription) {
      this.navigationSubscription.unsubscribe();
    }
    window.removeEventListener('resize', this.onWindowResize.bind(this));
  }

  private onWindowResize(): void {
    this.isMobileView.set(window.innerWidth < 768);
    // Collapse sidebar on mobile
    if (this.isMobileView()) {
      this.isCollapsed.set(true);
    }
  }

  private loadUserInfo(): void {
    const user = this.dataService.getLocalStorage<any>('user');
    const token = this.dataService.getLocalStorage<string>('token');

    if (token) {
      this.isAuthenticated.set(true);
      
      // Try to get user info from localStorage first
      if (user) {
        this.userName.set(user.name || user.email || 'User');
        this.userEmail.set(user.email || '');
      }
      
      // Decode JWT token to get role
      try {
        const tokenPayload = this.decodeToken(token);
        console.log('Token payload:', tokenPayload);
        
        if (tokenPayload) {
          // Set user info from token if not already set
          if (!user) {
            this.userName.set(tokenPayload.email || 'User');
            this.userEmail.set(tokenPayload.email || '');
          }
          
          // Get role from token (it's uppercase in JWT)
          let detectedRole: 'tenant' | 'landlord' | null = null;
          if (tokenPayload.role) {
            const roleStr = String(tokenPayload.role).toLowerCase().trim();
            detectedRole = roleStr === 'tenant' ? 'tenant' : 'landlord';
          }
          
          console.log('Detected role from token:', detectedRole);
          this.userRole.set(detectedRole);
        }
      } catch (error) {
        console.error('Error decoding token:', error);
        // Fallback to checking user object
        if (user && user.role) {
          const roleStr = String(user.role).toLowerCase().trim();
          this.userRole.set(roleStr === 'tenant' ? 'tenant' : 'landlord');
        }
      }
    } else {
      this.isAuthenticated.set(false);
      this.userRole.set(null);
    }
  }

  private decodeToken(token: string): any {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid token format');
      }
      
      const decoded = atob(parts[1]);
      return JSON.parse(decoded);
    } catch (error) {
      console.error('Error decoding JWT:', error);
      return null;
    }
  }

  toggleSidebar(): void {
    this.isCollapsed.set(!this.isCollapsed());
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 768) {
      this.isCollapsed.set(true);
    }
  }

  logout(): void {
    this.dataService.deleteStorage('token');
    this.dataService.deleteStorage('user');
    this.isAuthenticated.set(false);
    this.userRole.set(null);
    this.router.navigate(['/login']);
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(n => n.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
  }

  goToProfile(): void {
    const role = this.userRole();
    const profileRoute = role === 'tenant' ? '/tenant/profile' : '/landlord/profile';
    this.navigateTo(profileRoute);
  }

  // Make window accessible in template
  window = window;
}
