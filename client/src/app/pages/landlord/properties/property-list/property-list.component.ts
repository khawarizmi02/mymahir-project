// src/app/pages/landlord/properties/property-list/property-list.component.ts

import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { LayoutModule } from '@angular/cdk/layout';
import { Router } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Subscription } from 'rxjs';

import { IProperty, PropertyStatus } from '../../../../interfaces/models'; 
import { ApiService } from '../../../../services/api.service'; 

@Component({
  selector: 'app-property-list',
  templateUrl: './property-list.component.html',
  styleUrls: ['./property-list.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatChipsModule,
    LayoutModule
  ]
})
export class PropertyListComponent implements OnInit, AfterViewInit, OnDestroy {
  // Columns displayed on the desktop MatTable
  displayedColumns: string[] = ['title', 'address', 'monthlyRent', 'status', 'actions'];
  
  // MatTable DataSource holds the actual data
  dataSource = new MatTableDataSource<IProperty>();

  @ViewChild('matSort') sort!: MatSort;
  @ViewChild('matPaginator') paginator!: MatPaginator;

  // State flag for responsive design (true for mobile/handset views)
  isMobile: boolean = false; 
  private breakpointSubscription!: Subscription; 

  constructor(
    private apiService: ApiService, 
    private router: Router,
    private breakpointObserver: BreakpointObserver // Inject BreakpointObserver
  ) { }

  ngOnInit(): void {
    this.loadProperties();
    this.observeBreakpoints(); 
  }

  ngAfterViewInit(): void {
    // Assign sort and paginator AFTER view initialization
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  ngOnDestroy(): void {
    // Clean up the subscription to prevent memory leaks
    if (this.breakpointSubscription) {
        this.breakpointSubscription.unsubscribe();
    }
  }

  observeBreakpoints(): void {
    // Listen for Handset breakpoints (common mobile sizes)
    this.breakpointSubscription = this.breakpointObserver
      .observe([
        Breakpoints.HandsetPortrait,
        Breakpoints.HandsetLandscape,
        Breakpoints.Small
      ])
      .subscribe(result => {
        // Set isMobile flag based on whether any small breakpoint matches
        this.isMobile = result.matches; 
      });
  }

  loadProperties(): void {
    // This calls the authenticated endpoint (e.g., GET /api/v1/properties)
    this.apiService.getLandlordProperties().subscribe({
      next: (data: IProperty[]) => {
        this.dataSource.data = data;
        // Remove sort/paginator assignment from here
      },
      error: (err) => {
        console.error('Failed to load properties:', err);
        // Implement global error handling (e.g., MatSnackBar)
      }
    });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  editProperty(id: number): void {
    this.router.navigate(['/landlord/properties/edit', id]);
  }

  deleteProperty(id: number): void {
    if (confirm('WARNING: Are you sure you want to permanently delete this property?')) {
      this.apiService.deleteProperty(id).subscribe({
        next: () => {
          this.loadProperties(); // Reload the list
        },
        error: (err) => {
          console.error('Deletion failed:', err);
          // Alert user (e.g., "Cannot delete property with active tenancy.")
        }
      });
    }
  }
  
  // Helper to determine chip color
  getStatusColor(status: PropertyStatus): string {
    switch(status) {
      case PropertyStatus.OCCUPIED: return 'accent';
      case PropertyStatus.VACANT: return 'primary';
      case PropertyStatus.MAINTENANCE: return 'warn';
      default: return '';
    }
  }
}