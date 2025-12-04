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
  IAcceptInvitationResponse
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
  
// Add other methods here (e.g., getPayments, etc.)
}