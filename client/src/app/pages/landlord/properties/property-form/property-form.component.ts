import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiService } from '../../../../services/api.service';
import { PropertyStatus } from '../../../../interfaces/models';

@Component({
  selector: 'app-property-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatCardModule,
    MatIconModule
  ],
  templateUrl: './property-form.component.html',
  styleUrls: ['./property-form.component.scss']
})
export class PropertyFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private apiService = inject(ApiService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);

  form: FormGroup;
  isEditMode = signal(false);
  propertyId: number | null = null;
  isLoading = signal(false);
  
  // Dropdown options
  statusOptions = Object.values(PropertyStatus);

  constructor() {
    this.form = this.fb.group({
      title: ['', Validators.required],
      addressLine1: ['', Validators.required],
      city: ['', Validators.required],
      zipCode: ['', Validators.required],
      monthlyRent: [0, [Validators.required, Validators.min(0)]],
      description: [''],
      status: [PropertyStatus.VACANT, Validators.required],
      imageUrl: [''] // Simple URL input for now
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.propertyId = +id;
      this.loadProperty(this.propertyId);
    }
  }

  loadProperty(id: number) {
    this.isLoading.set(true);
    this.apiService.getPropertyById(id).subscribe({
      next: (response: any) => {
        // Handle wrapped response: { success, data: {...} }
        const prop = response?.data || response;
        
        // Parse address back into separate fields if needed
        let addressLine1 = prop.addressLine1 || '';
        let city = prop.city || '';
        let zipCode = prop.zipCode || '';
        
        // If backend only provides combined address, try to use it
        if (!addressLine1 && prop.address) {
          addressLine1 = prop.address;
        }
        
        this.form.patchValue({
          title: prop.title,
          addressLine1: addressLine1,
          city: city,
          zipCode: zipCode,
          monthlyRent: prop.monthlyRent,
          description: prop.description,
          status: prop.status,
          imageUrl: prop.imageUrl || ''
        });
        this.isLoading.set(false);
      },
      error: (err) => {
        this.snackBar.open('Error loading property', 'Close', { duration: 3000 });
        this.router.navigate(['/landlord/properties']);
      }
    });
  }

  onSubmit() {
    if (this.form.invalid) return;
    
    this.isLoading.set(true);
    const formValues = this.form.value;
    
    // Combine address fields into single address for backend
    const addressParts = [
      formValues.addressLine1,
      formValues.city,
      formValues.zipCode
    ].filter(part => part && part.trim()); // Remove empty parts
    
    const propertyData: any = {
      title: formValues.title,
      description: formValues.description || '',
      monthlyRent: Number(formValues.monthlyRent),
      status: formValues.status,
      address: addressParts.join(', ') || 'No address provided'
    };
    
    // Only include imageUrl if provided
    if (formValues.imageUrl) {
      propertyData.imageUrl = formValues.imageUrl;
    }
    
    console.log('Submitting property data:', propertyData);

    const request$ = this.isEditMode() && this.propertyId
      ? this.apiService.updateProperty(this.propertyId, propertyData)
      : this.apiService.createProperty(propertyData);

    request$.subscribe({
      next: () => {
        this.snackBar.open(
          `Property ${this.isEditMode() ? 'updated' : 'created'} successfully`, 
          'Close', 
          { duration: 3000 }
        );
        this.router.navigate(['/landlord/properties']);
      },
      error: (err) => {
        console.error(err);
        this.snackBar.open('Operation failed. Please try again.', 'Close', { duration: 3000 });
        this.isLoading.set(false);
      }
    });
  }
}
