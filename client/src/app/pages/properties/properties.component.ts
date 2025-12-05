import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatToolbarModule } from '@angular/material/toolbar';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { PropertyApiService, Property } from '../../services/property-api.service';

@Component({
  selector: 'app-properties',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatToolbarModule,
    ReactiveFormsModule
  ],
  templateUrl: './properties.component.html',
  styleUrl: './properties.component.scss',
})
export class PropertiesComponent implements OnInit {
  private propertyService = inject(PropertyApiService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  properties = signal<Property[]>([]);
  isLoading = signal(false);
  error = signal<string | null>(null);

  searchForm = this.fb.group({
    search: [''],
    minRent: [''],
    maxRent: ['']
  });

  ngOnInit() {
    this.loadProperties();
  }

  loadProperties() {
    this.isLoading.set(true);
    this.error.set(null);

    const formValue = this.searchForm.value;
    const query = {
      search: formValue.search || undefined,
      minRent: formValue.minRent ? Number(formValue.minRent) : undefined,
      maxRent: formValue.maxRent ? Number(formValue.maxRent) : undefined,
    };

    this.propertyService.getVacantProperties(query).subscribe({
      next: (response) => {
        this.properties.set(response.data || []);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to load properties');
        this.isLoading.set(false);
      }
    });
  }

  onSearch() {
    this.loadProperties();
  }

  clearFilters() {
    this.searchForm.reset();
    this.loadProperties();
  }

  navigateToLogin() {
    this.router.navigate(['/login']);
  }

  getPropertyImage(property: Property): string {
    if (property.images && property.images.length > 0) {
      return property.images[0].url;
    }
    return 'https://via.placeholder.com/400x300?text=No+Image';
  }
}
