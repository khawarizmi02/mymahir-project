import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MaintenanceService } from '../../../../services/maintenance.service';
import { ApiService } from '../../../../services/api.service';
import { IProperty } from '../../../../interfaces/models';

@Component({
  selector: 'app-maintenance-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatSelectModule,
  ],
  templateUrl: './maintenance-form.component.html',
  styleUrls: ['./maintenance-form.component.scss'],
})
export class MaintenanceFormComponent implements OnInit {
  maintenanceForm: FormGroup;
  properties: IProperty[] = [];
  selectedPhotos: any[] = [];

  constructor(
    private fb: FormBuilder,
    public maintenanceService: MaintenanceService,
    private apiService: ApiService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.maintenanceForm = this.fb.group({
      propertyId: ['', Validators.required],
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
    });
  }

  ngOnInit(): void {
    this.loadProperties();
  }

  goBack(): void {
    this.router.navigate(['/tenant/maintenance']);
  }

  /**
   * Load tenant's properties from their active tenancies
   */
  private loadProperties(): void {
    this.apiService.getTenantTenancies().subscribe({
      next: (response: any) => {
        // Extract properties from tenancies
        const tenancies = response?.data || [];
        console.log(tenancies);
        this.properties = tenancies.map((tenancy: any) => ({
          id: tenancy.propertyId || tenancy.id,
          address: tenancy.property?.address || `Property ${tenancy.propertyId}`,
          title: tenancy.propertyTitle || tenancy.propertyAddress || 'Rental Property',
        }));

        if (this.properties.length > 0) {
          this.maintenanceForm.patchValue({ propertyId: this.properties[0].id });
        }

        console.log(this.properties);
      },
      error: (error: any) => {
        this.snackBar.open('Failed to load your properties', 'Close', { duration: 3000 });
        console.error('Error loading tenant tenancies:', error);
      },
    });
  }

  /**
   * Handle photo selection
   */
  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files || []) as File[];

    // Limit to 3 photos
    const availableSlots = 3 - this.selectedPhotos.length;
    const filesToAdd = files.slice(0, availableSlots);

    filesToAdd.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.selectedPhotos.push({
          file,
          preview: e.target?.result as string,
        });
      };
      reader.readAsDataURL(file);
    });

    if (files.length > availableSlots) {
      this.snackBar.open('Maximum 3 photos allowed', 'Close', { duration: 3000 });
    }

    // Reset input
    input.value = '';
  }

  /**
   * Remove photo from selection
   */
  removePhoto(index: number): void {
    this.selectedPhotos.splice(index, 1);
  }

  /**
   * Submit maintenance request
   */
  onSubmit(): void {
    if (this.maintenanceForm.invalid) {
      this.snackBar.open('Please fill in all required fields', 'Close', { duration: 3000 });
      return;
    }

    const formData = this.maintenanceForm.value;

    console.log(formData);

    this.maintenanceService.createMaintenanceRequest(formData).subscribe({
      next: (response: any) => {
        const maintenanceId = response?.data?.id;
        this.snackBar.open('Maintenance request created!', 'Close', { duration: 2000 });

        // Upload photos if any
        if (this.selectedPhotos.length > 0 && maintenanceId) {
          this.uploadPhotos(maintenanceId);
        } else {
          // Redirect to maintenance list after short delay
          setTimeout(() => {
            this.router.navigate(['/tenant/maintenance']);
          }, 1000);
        }
      },
      error: (error) => {
        console.error('Error creating maintenance request:', error);
      },
    });
  }

  /**
   * Upload photos to maintenance request
   */
  private uploadPhotos(maintenanceId: number): void {
    let uploadedCount = 0;
    const allPhotoUrls: string[] = [];

    this.selectedPhotos.forEach((photo, index) => {
      this.maintenanceService
        .getMaintenancePhotoPresignedUrl(maintenanceId, photo.file.name, photo.file.type)
        .subscribe({
          next: (presignedResponse: any) => {
            const presignedUrl = presignedResponse?.data?.presignedUrl;
            const publicUrl = presignedResponse?.data?.publicUrl;

            if (!presignedUrl) {
              this.snackBar.open('Failed to get presigned URL', 'Close', { duration: 3000 });
              return;
            }

            // Upload to S3
            this.maintenanceService.uploadFileToPresignedUrl(presignedUrl, photo.file).subscribe({
              next: () => {
                // Collect the URL
                allPhotoUrls.push(publicUrl);
                uploadedCount++;

                // Once all photos are uploaded, save all URLs together
                if (uploadedCount === this.selectedPhotos.length) {
                  this.maintenanceService
                    .saveMaintenancePhotos(maintenanceId, allPhotoUrls)
                    .subscribe({
                      next: () => {
                        this.snackBar.open('All photos uploaded successfully!', 'Close', {
                          duration: 2000,
                        });
                        setTimeout(() => {
                          this.router.navigate(['/tenant/maintenance']);
                        }, 1000);
                      },
                      error: (error) => {
                        console.error('Error saving photos:', error);
                        this.snackBar.open('Failed to save photos', 'Close', { duration: 3000 });
                      },
                    });
                }
              },
              error: (error) => {
                console.error('Error uploading photo to S3:', error);
                this.snackBar.open('Failed to upload photo to S3', 'Close', { duration: 3000 });
              },
            });
          },
          error: (error) => {
            console.error('Error getting presigned URL:', error);
            this.snackBar.open('Failed to get upload URL', 'Close', { duration: 3000 });
          },
        });
    });
  }

  /**
   * Cancel form
   */
  onCancel(): void {
    this.router.navigate(['/tenant/maintenance']);
  }
}
