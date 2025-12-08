import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';

export interface PropertyImage {
  id: number;
  url: string;
  propertyId: number;
  createdAt?: string;
}

export interface Landlord {
  id: number;
  name: string | null;
  email: string;
}

export interface Property {
  id: number;
  landlordId: number;
  title: string;
  description: string | null;
  address: string;
  monthlyRent: number;
  status: 'VACANT' | 'OCCUPIED';
  createdAt: string;
  updatedAt: string;
  images: PropertyImage[];
  landlord: Landlord;
}

export interface VacantPropertiesQuery {
  search?: string;
  minRent?: number;
  maxRent?: number;
  take?: number;
  skip?: number;
}

export interface PropertyResponse {
  success: boolean;
  message: string;
  data: Property[];
}

@Injectable({
  providedIn: 'root',
})
export class PropertyApiService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/properties`;

  private cleanParams(params: any): any {
    return Object.entries(params).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        acc[key] = value;
      }
      return acc;
    }, {} as any);
  }

  getVacantProperties(query?: VacantPropertiesQuery): Observable<PropertyResponse> {
    const cleanQuery = query ? this.cleanParams(query) : {};
    return this.http.get<PropertyResponse>(`${this.baseUrl}/vacant`, {
      params: cleanQuery,
    });
  }

  getPropertyById(id: number): Observable<{ success: boolean; message: string; data: Property }> {
    return this.http.get<{ success: boolean; message: string; data: Property }>(
      `${this.baseUrl}/${id}`
    );
  }

  createProperty(propertyData: any): Observable<{ success: boolean; message: string; data: Property }> {
    return this.http.post<{ success: boolean; message: string; data: Property }>(
      this.baseUrl,
      propertyData
    );
  }

  updateProperty(id: number, propertyData: any): Observable<{ success: boolean; message: string; data: Property }> {
    return this.http.put<{ success: boolean; message: string; data: Property }>(
      `${this.baseUrl}/${id}`,
      propertyData
    );
  }

  deleteProperty(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.baseUrl}/${id}`
    );
  }

  // Get presigned URL for image upload
  getPresignedUrl(
    propertyId: number,
    filename: string,
    contentType: string
  ): Observable<{ success: boolean; message: string; presignedUrl: string; url: string }> {
    return this.http.get<{ success: boolean; message: string; presignedUrl: string; url: string }>(
      `${this.baseUrl}/${propertyId}/images/presign`,
      {
        params: {
          filename,
          contentType
        }
      }
    );
  }

  // Upload image to S3 using presigned URL
  // Note: Use native fetch to avoid Angular interceptors adding auth headers
  uploadToS3(presignedUrl: string, file: File): Observable<any> {
    return new Observable(observer => {
      fetch(presignedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type
        }
      })
        .then(response => {
          if (response.ok) {
            observer.next(response);
            observer.complete();
          } else {
            observer.error(new Error(`Upload failed with status ${response.status}`));
          }
        })
        .catch(error => {
          observer.error(error);
        });
    });
  }

  // Save image URL to property
  addPropertyImages(
    propertyId: number,
    urls: string[]
  ): Observable<{ success: boolean; message: string; data: Property }> {
    return this.http.post<{ success: boolean; message: string; data: Property }>(
      `${this.baseUrl}/${propertyId}/images`,
      { urls }
    );
  }

  // Delete property image
  deletePropertyImage(
    propertyId: number,
    imageId: number
  ): Observable<{ success: boolean; message: string; data: Property }> {
    return this.http.delete<{ success: boolean; message: string; data: Property }>(
      `${this.baseUrl}/${propertyId}/images/${imageId}`
    );
  }
}
