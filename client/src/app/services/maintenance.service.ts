import { Injectable, signal, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { IMaintenance, MaintenanceStatus } from '../interfaces/models';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap, switchMap } from 'rxjs/operators';
import { AuthApiService } from './auth-api.service';

@Injectable({
  providedIn: 'root'
})
export class MaintenanceService {
  private apiUrl = `${environment.apiUrl}/v1`;
  
  constructor(private http: HttpClient, private authApi: AuthApiService) {}
  
  // Signals for reactive state
  maintenanceListSignal = signal<IMaintenance[]>([]);
  loadingSignal = signal(false);
  errorSignal = signal<string | null>(null);

  // Public getters for signals
  maintenanceList = this.maintenanceListSignal.asReadonly();
  loading = this.loadingSignal.asReadonly();
  error = this.errorSignal.asReadonly();

  /**
   * Extract tenant ID from JWT token
   */
  private getTenantIdFromToken(): number | null {
    const token = this.authApi.getToken() as string;
    if (!token) return null;

    try {
      // Decode JWT manually (without external library)
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const decoded = JSON.parse(jsonPayload);
      return decoded.sub || decoded.userId || decoded.id || null;
    } catch (error) {
      console.error('Failed to decode JWT:', error);
      return null;
    }
  }

  /**
   * Fetch maintenance requests for current tenant
   */
  getTenantMaintenanceRequests(): Observable<IMaintenance[]> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    const tenantId = this.getTenantIdFromToken();
    if (!tenantId) {
      this.errorSignal.set('Unable to identify current tenant');
      this.loadingSignal.set(false);
      return new Observable(observer => observer.error('Tenant ID not found'));
    }

    return this.http.get<{ success: boolean; data: IMaintenance[] }>(`${this.apiUrl}/maintenances/tenant/${tenantId}`).pipe(
      tap(
        (response: any) => {
          const maintenanceList = response?.data || [];
          this.maintenanceListSignal.set(maintenanceList);
          this.loadingSignal.set(false);
        },
        (error) => {
          this.errorSignal.set(error?.error?.message || 'Failed to fetch maintenance requests');
          this.loadingSignal.set(false);
        }
      )
    );
  }

  /**
   * Create a new maintenance request
   */
  createMaintenanceRequest(data: {
    propertyId: number;
    title: string;
    description?: string;
  }): Observable<IMaintenance> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.post<{ success: boolean; data: IMaintenance }>(`${this.apiUrl}/maintenances`, data).pipe(
      tap(
        (response: any) => {
          const newMaintenance = response?.data;
          // Add to list
          const currentList = this.maintenanceListSignal();
          this.maintenanceListSignal.set([newMaintenance, ...currentList]);
          this.loadingSignal.set(false);
        },
        (error) => {
          this.errorSignal.set(error?.error?.message || 'Failed to create maintenance request');
          this.loadingSignal.set(false);
        }
      )
    );
  }

  /**
   * Get presigned URL for photo upload
   */
  getMaintenancePhotoPresignedUrl(maintenanceId: number, filename: string, contentType: string): Observable<{ success: boolean; message: string; data: { presignedUrl: string; publicUrl: string } }> {
    console.log(filename)
    console.log(contentType)
    // const params = `filename=${encodeURIComponent(filename)}&contentType=${encodeURIComponent(contentType)}`;
    return this.http.get<{ success: boolean; message: string, data: { presignedUrl: string; publicUrl: string } }>(`${this.apiUrl}/maintenances/${maintenanceId}/photos/presign`, {
        params: {
          filename,
          contentType
        }
      });
  }

  /**
   * Upload file to presigned URL
   */
  uploadFileToPresignedUrl(presignedUrl: string, file: File): Observable<any> {
    return new Observable(observer => {
      fetch(presignedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type
        }
      })
        .then(async (response) => {
          if (response.ok) {
            observer.next(response);
            observer.complete();
          } else {
            const errorText = await response.text();
            throw new Error(`S3 upload failed: ${response.status} - ${errorText}`);
          }
        })
        .catch(error => {
          console.error('S3 upload error:', error);
          observer.error(error);
        });
    });
  }

  /**
   * Save maintenance photos (after uploading to S3)
   */
  saveMaintenancePhotos(maintenanceId: number, photoUrls: string[]): Observable<any> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.post<{ success: boolean; data: any }>(`${this.apiUrl}/maintenances/${maintenanceId}/photos`, { urls: photoUrls }).pipe(
      tap(
        (response: any) => {
          // Update the maintenance request in list
          const currentList = this.maintenanceListSignal();
          const updated = currentList.map(m =>
            m.id === maintenanceId
              ? { ...m, photos: response?.data?.photos || [] }
              : m
          );
          this.maintenanceListSignal.set(updated);
          this.loadingSignal.set(false);
        },
        (error) => {
          this.errorSignal.set(error?.error?.message || 'Failed to save photos');
          this.loadingSignal.set(false);
        }
      )
    );
  }

  /**
   * Complete photo upload flow: Get presigned URL -> Upload to S3 -> Save metadata
   */
  uploadMaintenancePhoto(maintenanceId: number, file: File): Observable<any> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    // Step 1: Get presigned URL -> Step 2: Upload to S3 -> Step 3: Save metadata
    return this.getMaintenancePhotoPresignedUrl(maintenanceId, file.name, file.type).pipe(
      switchMap((presignedResponse: any) => {
        const presignedUrl = presignedResponse?.data?.presignedUrl;
        const publicUrl = presignedResponse?.data?.publicUrl;

        if (!presignedUrl) {
          this.errorSignal.set('Failed to get presigned URL');
          this.loadingSignal.set(false);
          throw new Error('Presigned URL not received');
        }

        // Step 2: Upload file to presigned URL
        return this.uploadFileToPresignedUrl(presignedUrl, file).pipe(
          switchMap(() => {
            // Step 3: Save photo metadata after successful S3 upload
            return this.saveMaintenancePhotos(maintenanceId, [publicUrl]);
          })
        );
      }),
      tap(
        (response: any) => {
          this.loadingSignal.set(false);
        },
        (error) => {
          this.errorSignal.set(error?.error?.message || 'Failed to upload photo');
          this.loadingSignal.set(false);
        }
      )
    );
  }

  /**
   * Get single maintenance request by ID
   */
  getMaintenanceById(id: number): Observable<any> {
    return this.http.get<{ success: boolean; data: IMaintenance }>(`${this.apiUrl}/maintenances/${id}`);
  }

  /**
   * Delete maintenance request (tenant only)
   */
  deleteMaintenanceRequest(maintenanceId: number): Observable<any> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/maintenances/${maintenanceId}`).pipe(
      tap(
        (response: any) => {
          // Remove from list
          const currentList = this.maintenanceListSignal();
          this.maintenanceListSignal.set(
            currentList.filter(m => m.id !== maintenanceId)
          );
          this.loadingSignal.set(false);
        },
        (error) => {
          this.errorSignal.set(error?.error?.message || 'Failed to delete maintenance request');
          this.loadingSignal.set(false);
        }
      )
    );
  }

  /**
   * Get maintenance requests for a property (landlord)
   */
  getPropertyMaintenanceRequests(propertyId: number): Observable<IMaintenance[]> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.get<{ success: boolean; data: IMaintenance[] }>(`${this.apiUrl}/maintenances?propertyId=${propertyId}`).pipe(
      tap(
        (response: any) => {
          this.loadingSignal.set(false);
        },
        (error) => {
          this.errorSignal.set(error?.error?.message || 'Failed to fetch maintenance requests');
          this.loadingSignal.set(false);
        }
      )
    );
  }

  /**
   * Update maintenance status (landlord only)
   */
  updateMaintenanceStatus(maintenanceId: number, status: MaintenanceStatus): Observable<IMaintenance> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.put<{ success: boolean; data: IMaintenance }>(`${this.apiUrl}/maintenances/${maintenanceId}`, { status }).pipe(
      tap(
        (response: any) => {
          const updated = response?.data;
          // Update in list
          const currentList = this.maintenanceListSignal();
          this.maintenanceListSignal.set(
            currentList.map(m => m.id === maintenanceId ? updated : m)
          );
          this.loadingSignal.set(false);
        },
        (error) => {
          this.errorSignal.set(error?.error?.message || 'Failed to update maintenance status');
          this.loadingSignal.set(false);
        }
      )
    );
  }

  /**
   * Clear error message
   */
  clearError(): void {
    this.errorSignal.set(null);
  }
}
