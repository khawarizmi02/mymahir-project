// // src/app/services/api.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { 
  IDashboardSummary, 
  IProperty, 
  ITenantDashboardSummary,
  ITenantInvitation,
  ICreateInvitationRequest,
  ICreateInvitationResponse,
  IAcceptInvitationRequest,
  IAcceptInvitationResponse,
  IPayment,
  ICreatePaymentRequest,
  ICreatePaymentResponse,
  IPresignedUrlRequest,
  IPresignedUrlResponse,
  IUpdateProofRequest,
  IUpdateProofResponse,
  IUpdatePaymentStatusRequest,
  IUpdatePaymentStatusResponse
} from '../interfaces/models';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = `${environment.apiUrl}/v1`; // Assuming your base is /api/v1

  constructor(private http: HttpClient) {}

  // --- Dashboard Endpoints ---
  
  getLandlordDashboardSummary(): Observable<IDashboardSummary> {
    // This calls the backend endpoint that gathers all metrics for the landlord
    return this.http.get<IDashboardSummary>(`${this.apiUrl}/landlord/dashboard`);
  }

  // --- Property Endpoints (Used in PropertyListComponent) ---
  
  getLandlordProperties(): Observable<IProperty[]> {
    // GET /api/v1/properties
    // Assumes backend filters by landlordId using the JWT
    return this.http.get<IProperty[]>(`${this.apiUrl}/properties`);
  }

  getPropertyById(id: number): Observable<IProperty> {
    // GET /api/v1/properties/:id
    return this.http.get<IProperty>(`${this.apiUrl}/properties/${id}`);
  }

  createProperty(property: IProperty): Observable<IProperty> {
    // POST /api/v1/properties
    return this.http.post<IProperty>(`${this.apiUrl}/properties`, property);
  }

  updateProperty(id: number, property: IProperty): Observable<IProperty> {
    // PUT /api/v1/properties/:id
    return this.http.put<IProperty>(`${this.apiUrl}/properties/${id}`, property);
  }

  deleteProperty(id: number): Observable<void> {
    // DELETE /api/v1/properties/:id
    return this.http.delete<void>(`${this.apiUrl}/properties/${id}`);
  }

  // --- Tenant Dashboard Endpoints ---
  
  getTenantDashboardSummary(): Observable<ITenantDashboardSummary> {
    // This calls the backend endpoint that gathers all metrics for the tenant
    return this.http.get<ITenantDashboardSummary>(`${this.apiUrl}/tenant/dashboard`);
  }

  // --- Invitation Endpoints ---

  // Landlord: Create a new tenant invitation
  createInvitation(data: ICreateInvitationRequest): Observable<ICreateInvitationResponse> {
    return this.http.post<ICreateInvitationResponse>(`${this.apiUrl}/invitations`, data);
  }

  // Landlord: Get all invitations
  getLandlordInvitations(): Observable<{ success: boolean; data: ITenantInvitation[] }> {
    return this.http.get<{ success: boolean; data: ITenantInvitation[] }>(`${this.apiUrl}/invitations`);
  }

  // Landlord: Cancel an invitation
  cancelInvitation(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/invitations/${id}`);
  }

  // Landlord: Resend an invitation
  resendInvitation(id: number): Observable<ICreateInvitationResponse> {
    return this.http.post<ICreateInvitationResponse>(`${this.apiUrl}/invitations/${id}/resend`, {});
  }

  // Public: Get invitation details by token
  getInvitationByToken(token: string): Observable<{ success: boolean; data: ITenantInvitation }> {
    return this.http.get<{ success: boolean; data: ITenantInvitation }>(`${this.apiUrl}/invitations/${token}`);
  }

  // Public: Accept invitation
  acceptInvitation(token: string, data: IAcceptInvitationRequest): Observable<IAcceptInvitationResponse> {
    return this.http.post<IAcceptInvitationResponse>(`${this.apiUrl}/invitations/${token}/accept`, data);
  }

  // --- Generic HTTP Methods ---

  get<T>(endpoint: string): Observable<T> {
    return this.http.get<T>(`${this.apiUrl}${endpoint}`);
  }

  post<T>(endpoint: string, data: unknown): Observable<T> {
    return this.http.post<T>(`${this.apiUrl}${endpoint}`, data);
  }

  // --- Tenant Endpoints ---

  getAvailableProperties(): Observable<{ success: boolean; data: unknown[] }> {
    return this.http.get<{ success: boolean; data: unknown[] }>(`${this.apiUrl}/tenant/properties`);
  }

  // --- Payment Endpoints ---

  // Step 1: Tenant creates a payment record
  createPayment(data: ICreatePaymentRequest): Observable<ICreatePaymentResponse> {
    return this.http.post<ICreatePaymentResponse>(`${this.apiUrl}/payments`, data);
  }

  // Step 2: Get presigned URL for proof upload
  getPresignedUrl(paymentId: number, data: IPresignedUrlRequest): Observable<IPresignedUrlResponse> {
    return this.http.post<IPresignedUrlResponse>(`${this.apiUrl}/payments/${paymentId}/proof/presigned`, data);
  }

  // Step 3: Upload file directly to storage (returns just HTTP status)
  uploadProofFile(presignedUrl: string, file: File): Observable<void> {
    return this.http.put<void>(presignedUrl, file, {
      headers: { 'Content-Type': file.type }
    });
  }

  // Step 4: Update payment record with proof URL
  updatePaymentProof(paymentId: number, data: { proofUrl: string }): Observable<IUpdateProofResponse> {
    return this.http.put<IUpdateProofResponse>(`${this.apiUrl}/payments/${paymentId}/proof`, data);
  }

  // Step 5: Landlord updates payment status
  updatePaymentStatus(paymentId: number, data: IUpdatePaymentStatusRequest): Observable<IUpdatePaymentStatusResponse> {
    return this.http.put<IUpdatePaymentStatusResponse>(`${this.apiUrl}/payments/${paymentId}/status`, data);
  }

  // Get all payments (filtered by role on backend)
  getPayments(): Observable<{ success: boolean; data: IPayment[] }> {
    return this.http.get<{ success: boolean; data: IPayment[] }>(`${this.apiUrl}/payments`);
  }

  // Get all payments for tenant
  getTenantPayments(): Observable<{ success: boolean; data: IPayment[] }> {
    return this.http.get<{ success: boolean; data: IPayment[] }>(`${this.apiUrl}/payments`);
  }

  // Get all payments for landlord (across all properties)
  getLandlordPayments(): Observable<{ success: boolean; data: IPayment[] }> {
    return this.http.get<{ success: boolean; data: IPayment[] }>(`${this.apiUrl}/payments`);
  }

  // Get payment by ID
  getPaymentById(paymentId: number): Observable<{ success: boolean; data: IPayment }> {
    return this.http.get<{ success: boolean; data: IPayment }>(`${this.apiUrl}/payments/${paymentId}`);
  }

  // Get tenant's tenancies (active and upcoming) for dashboard
  getTenantTenancies(): Observable<{ success: boolean; data: any[] }> {
    return this.http.get<{ success: boolean; data: any[] }>(`${this.apiUrl}/tenant/tenancies`);
  }

  // --- Maintenance Endpoints ---

  // Tenant: Get own maintenance requests
  getTenantMaintenanceRequests(): Observable<{ success: boolean; data: any[] }> {
    return this.http.get<{ success: boolean; data: any[] }>(`${this.apiUrl}/maintenances`);
  }

  // Tenant: Create a new maintenance request
  createMaintenanceRequest(data: { propertyId: number; title: string; description?: string }): Observable<{ success: boolean; data: any }> {
    return this.http.post<{ success: boolean; data: any }>(`${this.apiUrl}/maintenances`, data);
  }

  // Tenant/Landlord: Get maintenance request by ID
  getMaintenanceById(maintenanceId: number): Observable<{ success: boolean; data: any }> {
    return this.http.get<{ success: boolean; data: any }>(`${this.apiUrl}/maintenances/${maintenanceId}`);
  }

  // Landlord: Get maintenance requests for a property
  getPropertyMaintenanceRequests(propertyId: number): Observable<{ success: boolean; data: any[] }> {
    return this.http.get<{ success: boolean; data: any[] }>(`${this.apiUrl}/maintenances/property/${propertyId}`);
  }

  // Landlord: Update maintenance status
  updateMaintenanceStatus(maintenanceId: number, status: string): Observable<{ success: boolean; data: any }> {
    return this.http.put<{ success: boolean; data: any }>(`${this.apiUrl}/maintenances/${maintenanceId}`, { status });
  }

  // Landlord: Delete maintenance request
  deleteMaintenanceRequest(maintenanceId: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/maintenances/${maintenanceId}`);
  }

  // Tenant: Get presigned URL for photo upload
  getMaintenancePhotoPresignedUrl(maintenanceId: number, fileName: string, fileType: string): Observable<{ success: boolean; data: any }> {
    return this.http.get<{ success: boolean; data: any }>(`${this.apiUrl}/maintenances/${maintenanceId}/photos/presign?fileName=${fileName}&fileType=${fileType}`);
  }

  // Tenant: Upload maintenance photo
  uploadMaintenancePhoto(maintenanceId: number, file: File): Observable<{ success: boolean; data: any }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ success: boolean; data: any }>(`${this.apiUrl}/maintenances/${maintenanceId}/photos`, formData);
  }

  // --- Stripe Payment Endpoints ---

  // Tenant: Create payment intent
  createPaymentIntent(data: { tenancyId: number; amount: number; currency?: string; method?: string }): Observable<{ success: boolean; data: any }> {
    return this.http.post<{ success: boolean; data: any }>(`${this.apiUrl}/payments/stripe/intent`, data);
  }

  // Tenant: Confirm payment
  confirmPayment(data: { paymentIntentId: string; tenancyId: number }): Observable<{ success: boolean; data: any }> {
    return this.http.post<{ success: boolean; data: any }>(`${this.apiUrl}/payments/stripe/confirm`, data);
  }

  // Tenant: Get payment intent status
  getPaymentIntentStatus(paymentIntentId: string): Observable<{ success: boolean; data: any }> {
    return this.http.get<{ success: boolean; data: any }>(`${this.apiUrl}/payments/stripe/${paymentIntentId}`);
  }

  // Get current tenant's tenancy info
  getTenancyInfo(): Observable<{ success: boolean; data: any }> {
    return this.http.get<{ success: boolean; data: any }>(`${this.apiUrl}/tenant/tenancy`);
  }

  // Get payment history for current tenant
  getPaymentHistory(): Observable<{ success: boolean; data: any[] }> {
    return this.http.get<{ success: boolean; data: any[] }>(`${this.apiUrl}/payments/history`);
  }
}