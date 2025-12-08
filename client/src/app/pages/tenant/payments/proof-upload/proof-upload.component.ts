import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '../../../../services/api.service';
import { IPayment, PaymentStatus } from '../../../../interfaces/models';
import { HttpEventType } from '@angular/common/http';

@Component({
  selector: 'app-proof-upload',
  templateUrl: './proof-upload.component.html',
  styleUrls: ['./proof-upload.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatSnackBarModule
  ]
})
export class ProofUploadComponent implements OnInit {
  paymentId: number = 0;
  payment: IPayment | null = null;
  isLoading = true;
  isUploading = false;
  uploadProgress = 0;
  
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  
  acceptedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
  maxFileSize = 10 * 1024 * 1024; // 10MB

  constructor(
    private apiService: ApiService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.paymentId = Number(this.route.snapshot.paramMap.get('id'));
    if (this.paymentId) {
      this.loadPayment();
    } else {
      this.snackBar.open('Invalid payment ID', 'Close', { duration: 3000 });
      this.router.navigate(['/tenant/payments']);
    }
  }

  loadPayment(): void {
    this.apiService.getPaymentById(this.paymentId).subscribe({
      next: (response) => {
        this.payment = response.data;
        this.isLoading = false;
        
        // If payment already has proof or is completed, redirect
        if (this.payment?.proofUrl) {
          this.snackBar.open('Proof already uploaded for this payment', 'View Payments', {
            duration: 3000
          });
        }
      },
      error: (err) => {
        console.error('Failed to load payment:', err);
        this.isLoading = false;
        this.snackBar.open('Failed to load payment details', 'Close', { duration: 3000 });
        this.router.navigate(['/tenant/payments']);
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    
    // Validate file type
    if (!this.acceptedTypes.includes(file.type)) {
      this.snackBar.open('Invalid file type. Please upload an image or PDF.', 'Close', {
        duration: 3000
      });
      return;
    }

    // Validate file size
    if (file.size > this.maxFileSize) {
      this.snackBar.open('File too large. Maximum size is 10MB.', 'Close', {
        duration: 3000
      });
      return;
    }

    this.selectedFile = file;
    
    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        this.previewUrl = reader.result as string;
      };
      reader.readAsDataURL(file);
    } else {
      this.previewUrl = null;
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();

    const files = event.dataTransfer?.files;
    if (files?.length) {
      const fakeEvent = { target: { files } } as unknown as Event;
      this.onFileSelected(fakeEvent);
    }
  }

  removeFile(): void {
    this.selectedFile = null;
    this.previewUrl = null;
  }

  async uploadProof(): Promise<void> {
    if (!this.selectedFile || !this.payment) return;

    this.isUploading = true;
    this.uploadProgress = 0;

    try {
      // Step 1: Get presigned URL
      const presignedResponse = await this.apiService.getPresignedUrl(this.payment.id, {
        filename: this.selectedFile.name,
        contentType: this.selectedFile.type
      }).toPromise();

      if (!presignedResponse?.data) {
        throw new Error('Failed to get upload URL');
      }

      this.uploadProgress = 30;

      // Step 2: Upload file to presigned URL
      await this.uploadToPresignedUrl(
        presignedResponse.data.presignedUrl,
        this.selectedFile
      );

      this.uploadProgress = 70;

      // Step 3: Update payment record with proof URL
      await this.apiService.updatePaymentProof(this.payment.id, {
        proofUrl: presignedResponse.data.publicUrl
      }).toPromise();

      this.uploadProgress = 100;

      this.snackBar.open('Proof uploaded successfully! Awaiting landlord approval.', 'View Payments', {
        duration: 5000
      }).onAction().subscribe(() => {
        this.router.navigate(['/tenant/payments']);
      });

      // Navigate after a short delay
      setTimeout(() => {
        this.router.navigate(['/tenant/payments']);
      }, 2000);

    } catch (error) {
      console.error('Upload failed:', error);
      this.snackBar.open('Failed to upload proof. Please try again.', 'Close', {
        duration: 3000
      });
    } finally {
      this.isUploading = false;
    }
  }

  private uploadToPresignedUrl(url: string, file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 40) + 30;
          this.uploadProgress = Math.min(progress, 70);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 400) {
          resolve();
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'));
      });

      xhr.open('PUT', url);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);
    });
  }

  getFileIcon(): string {
    if (!this.selectedFile) return 'upload_file';
    if (this.selectedFile.type.startsWith('image/')) return 'image';
    if (this.selectedFile.type === 'application/pdf') return 'picture_as_pdf';
    return 'description';
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
}
