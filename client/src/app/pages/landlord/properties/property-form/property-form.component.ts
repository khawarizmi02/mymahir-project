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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PropertyApiService } from '../../../../services/property-api.service';
import { PropertyStatus } from '../../../../interfaces/models';
import { forkJoin, of } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';

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
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './property-form.component.html',
  styleUrls: ['./property-form.component.scss']
})
export class PropertyFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private propertyApiService = inject(PropertyApiService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);

  form: FormGroup;
  isEditMode = signal(false);
  propertyId: number | null = null;
  isLoading = signal(false);
  isUploadingImages = signal(false);

  // Image handling
  selectedFiles: File[] = [];
  imagePreviews: string[] = [];
  existingImages: Array<{ id: number; url: string }> = [];

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
      status: [PropertyStatus.VACANT, Validators.required]
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
    this.propertyApiService.getPropertyById(id).subscribe({
      next: (response: any) => {
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
          status: prop.status
        });

        // Load existing images
        if (prop.images && Array.isArray(prop.images)) {
          this.existingImages = prop.images.map((img: any) => ({
            id: img.id,
            url: img.url
          }));
        }

        this.isLoading.set(false);
      },
      error: () => {
        this.snackBar.open('Error loading property', 'Close', { duration: 3000 });
        this.router.navigate(['/landlord/properties']);
      }
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const files = Array.from(input.files);

      // Validate file types
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      const invalidFiles = files.filter(f => !validTypes.includes(f.type));

      if (invalidFiles.length > 0) {
        this.snackBar.open('Only JPEG, PNG, and WebP images are allowed', 'Close', { duration: 3000 });
        return;
      }

      // Validate file sizes (max 5MB per file)
      const maxSize = 5 * 1024 * 1024; // 5MB
      const oversizedFiles = files.filter(f => f.size > maxSize);

      if (oversizedFiles.length > 0) {
        this.snackBar.open('Each image must be less than 5MB', 'Close', { duration: 3000 });
        return;
      }

      this.selectedFiles = [...this.selectedFiles, ...files];

      // Generate previews
      files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e: ProgressEvent<FileReader>) => {
          if (e.target?.result) {
            this.imagePreviews.push(e.target.result as string);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  }

  removePreview(index: number) {
    this.selectedFiles.splice(index, 1);
    this.imagePreviews.splice(index, 1);
  }

  removeExistingImage(imageId: number) {
    if (!this.propertyId) return;

    if (confirm('Are you sure you want to delete this image?')) {
      this.propertyApiService.deletePropertyImage(this.propertyId, imageId).subscribe({
        next: () => {
          this.existingImages = this.existingImages.filter(img => img.id !== imageId);
          this.snackBar.open('Image deleted successfully', 'Close', { duration: 2000 });
        },
        error: () => {
          this.snackBar.open('Failed to delete image', 'Close', { duration: 3000 });
        }
      });
    }
  }

  uploadImages(propertyId: number) {
    if (this.selectedFiles.length === 0) {
      return of(null);
    }

    this.isUploadingImages.set(true);

    const uploadObservables = this.selectedFiles.map(file => {
      const filename = `${Date.now()}-${file.name}`;
      const contentType = file.type;

      return this.propertyApiService.getPresignedUrl(propertyId, filename, contentType).pipe(
        switchMap(response => {
          return this.propertyApiService.uploadToS3(response.presignedUrl, file).pipe(
            switchMap(() => of(response.url)),
            catchError(() => {
              this.snackBar.open(`Failed to upload ${file.name}`, 'Close', { duration: 3000 });
              return of(null);
            })
          );
        }),
        catchError(() => {
          this.snackBar.open(`Failed to get upload URL for ${file.name}`, 'Close', { duration: 3000 });
          return of(null);
        })
      );
    });

    return forkJoin(uploadObservables).pipe(
      switchMap(urls => {
        const validUrls = urls.filter(url => url !== null) as string[];
        if (validUrls.length === 0) {
          return of(null);
        }
        return this.propertyApiService.addPropertyImages(propertyId, validUrls);
      }),
      catchError(() => {
        this.snackBar.open('Failed to save images', 'Close', { duration: 3000 });
        return of(null);
      })
    );
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
    ].filter(part => part && part.trim());

    const propertyData: any = {
      title: formValues.title,
      description: formValues.description || '',
      monthlyRent: Number(formValues.monthlyRent),
      status: formValues.status,
      address: addressParts.join(', ') || 'No address provided'
    };

    const request$ = this.isEditMode() && this.propertyId
      ? this.propertyApiService.updateProperty(this.propertyId, propertyData)
      : this.propertyApiService.createProperty(propertyData);

    request$.pipe(
      switchMap(response => {
        const propertyId = this.propertyId || response.data.id;
        // Upload images if any are selected
        return this.uploadImages(propertyId).pipe(
          switchMap(() => of(response))
        );
      })
    ).subscribe({
      next: () => {
        this.isUploadingImages.set(false);
        this.snackBar.open(
          `Property ${this.isEditMode() ? 'updated' : 'created'} successfully`,
          'Close',
          { duration: 3000 }
        );
        this.router.navigate(['/landlord/properties']);
      },
      error: () => {
        this.isUploadingImages.set(false);
        this.snackBar.open('Operation failed. Please try again.', 'Close', { duration: 3000 });
        this.isLoading.set(false);
      }
    });
  }
}
