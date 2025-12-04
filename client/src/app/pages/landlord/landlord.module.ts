// src/app/pages/landlord/landlord.module.ts

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LandlordRoutingModule } from './landlord-routing.module';

// Material Modules
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { LayoutModule } from '@angular/cdk/layout';

// UPDATED IMPORTS: Pointing to the correct file locations
import { LandlordDashboardComponent } from './landlord-dashboard.component';
import { PropertyListComponent } from './properties/property-list/property-list.component';
import { PropertyFormComponent } from './properties/property-form/property-form.component';
import { LeaseListComponent } from './leases/lease-list/lease-list.component';
import { LeaseFormComponent } from './leases/lease-form/lease-form.component';

@NgModule({
  declarations: [
    // Empty, as components are standalone
  ],
  imports: [
    CommonModule,
    LandlordRoutingModule,
    // 1. FORMS MODULES: Required for any <input> and reactive forms (PropertyForm)
    FormsModule, 
    ReactiveFormsModule,
    
    // 2. ANGULAR MATERIAL MODULES: Required for UI components
    LayoutModule, // Needed for BreakpointObserver used in PropertyListComponent
    MatCardModule,       // Dashboard Widgets, Property List Cards
    MatButtonModule,     // All buttons (Add, Edit, Delete, Login)
    MatIconModule,       // All icons (e.g., 'add', 'edit', task icons)
    MatDividerModule,    // Separators
    MatListModule,       // Urgent Tasks list
    MatChipsModule,      // Status chips (VACANT, OCCUPIED)

    
    
    // Data Table & Forms specific
    MatTableModule,      // PropertyListComponent desktop view
    MatPaginatorModule,  // Pagination
MatSortModule,       // Sorting
    MatFormFieldModule,  // Wrappers for inputs
    MatInputModule,      // Input fields
    MatSelectModule,     // Dropdown menus
    // Import standalone components
    LandlordDashboardComponent, // Import standalone component
    PropertyListComponent, // Import standalone component
    PropertyFormComponent, // Add standalone component
    LeaseListComponent, // Lease list component
    LeaseFormComponent // Lease form component
  ]
})
export class LandlordModule { }