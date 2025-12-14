// src/app/interfaces/models.ts

// --- ENUMS (Dropdown options / Fixed values) ---

export enum UserRole {
  LANDLORD = 'LANDLORD',
  TENANT = 'TENANT'
}

export enum PropertyStatus {
  VACANT = 'VACANT',
  OCCUPIED = 'OCCUPIED',
  MAINTENANCE = 'MAINTENANCE'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export enum MaintenanceStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED'
}

// --- INTERFACES (Data Structures) ---

export interface IUser {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  isEmailVerified: boolean;
}

// The structure of the response when you log in
export interface IAuthResponse {
  token: string;
  user: IUser;
}

export interface IProperty {
  id: number;
  landlordId: number;
  title: string;
  description?: string;
  address: string; // Combined address field from backend
  monthlyRent: string | number; // String or number to handle decimals
  status: PropertyStatus;
  imageUrl?: string; // Main display image
}

export interface ITenancy {
  id: number;
  propertyId: number;
  tenantId: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
}

export interface IDashboardMetrics {
  totalProperties: number;
  occupancyRate: number; // e.g., 85 (for 85%)
  outstandingRent: string; // e.g., "1250.00"
  activeMaintenance: number;
}

export interface IUrgentTask {
  id: number;
  title: string;
  type: 'MAINTENANCE' | 'PAYMENT' | 'LEASE';
  severity: 'HIGH' | 'MEDIUM';
  date: Date;
  routeLink: string; // Helper for navigation
}

export interface IDashboardSummary {
  metrics: IDashboardMetrics;
  urgentTasks: IUrgentTask[];
}

// --- TENANT DASHBOARD INTERFACES ---

export interface ITenantDashboardMetrics {
  currentRent: number;
  nextPaymentDue: string | null; // ISO date string
  leaseEndDate: string | null;
  openMaintenanceRequests: number;
}

export interface ITenantProperty {
  id: number;
  title: string;
  address: string;
  landlordName: string;
  landlordEmail: string;
  monthlyRent: number;
  leaseStart: string;
  leaseEnd: string;
}

export interface ITenantPayment {
  id: number;
  amount: number;
  status: PaymentStatus;
  paidAt: string | null;
  createdAt: string;
}

export interface IMaintenance {
  id: number;
  propertyId: number;
  tenantId: number;
  title: string;
  description?: string;
  status: MaintenanceStatus;
  photos?: string[]; // Array of S3 URLs
  createdAt: string;
  updatedAt: string;
  property?: {
    id: number;
    title: string;
    address: string;
  };
  tenant?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface ICreateMaintenanceRequest {
  propertyId: number;
  title: string;
  description?: string;
}

export interface ICreateMaintenanceResponse {
  success: boolean;
  message: string;
  data: IMaintenance;
}

export interface IUpdateMaintenanceStatusRequest {
  status: MaintenanceStatus;
}

export interface IUpdateMaintenanceStatusResponse {
  success: boolean;
  message: string;
  data: IMaintenance;
}

export interface IUploadMaintenancePhotoResponse {
  success: boolean;
  data: {
    photoUrl: string;
    photos: string[];
  };
}

export interface ITenantDashboardSummary {
  metrics: ITenantDashboardMetrics;
  property: ITenantProperty | null;
  recentPayments: ITenantPayment[];
  maintenanceRequests: IMaintenance[];
}

// --- INVITATION INTERFACES ---

export enum InvitationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED'
}

export interface ITenantInvitation {
  id: number;
  propertyId: number;
  landlordId: number;
  tenantEmail: string;
  tenantName?: string;
  leaseStart: string;
  leaseEnd: string;
  monthlyRent: number;
  depositAmount?: number;
  token: string;
  status: InvitationStatus;
  expiresAt: string;
  acceptedAt?: string;
  createdAt: string;
  property?: IProperty;
  landlord?: {
    id: number;
    name: string;
    email: string;
  };
  // Added for invitation acceptance flow
  existingUser?: boolean;
  existingUserHasPassword?: boolean;
}

export interface ICreateInvitationRequest {
  propertyId: number;
  tenantEmail: string;
  tenantName?: string;
  leaseStart: string;
  leaseEnd: string;
  monthlyRent: number;
  depositAmount?: number;
}

export interface ICreateInvitationResponse {
  success: boolean;
  message: string;
  data: {
    invitation: ITenantInvitation;
    invitationUrl: string;
    existingUser: boolean;
  };
}

export interface IAcceptInvitationRequest {
  password?: string; // Required if user doesn't exist
}

export interface IAcceptInvitationResponse {
  success: boolean;
  message: string;
  data: {
    userId: number;
    email: string;
    tenancyId: number;
  };
}

// --- PAYMENT INTERFACES ---

export enum PaymentMethod {
  MANUAL = 'MANUAL',
  ONLINE = 'ONLINE'
}

export interface IPayment {
  id: number;
  tenancyId: number;
  tenantId: number;
  amount: number;
  payBy: string; // ISO date string
  method: PaymentMethod;
  status: PaymentStatus;
  proofUrl?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
  // Populated relations
  tenant?: {
    id: number;
    name: string;
    email: string;
  };
  tenancy?: {
    id: number;
    property: {
      id: number;
      title: string;
      address: string;
    };
  };
}

export interface ICreatePaymentRequest {
  tenancyId: number;
  amount: number;
  currency: string;
  method: PaymentMethod;
  paidAt?: string; // ISO date string for when the payment was made
}

export interface ICreatePaymentResponse {
  success: boolean;
  message: string;
  data: {
    id: number;
    tenancyId: number;
    tenantId: number;
    amount: number;
    currency: string;
    method: string;
    status: string;
    createdAt: string;
  };
}

export interface IPresignedUrlRequest {
  filename: string;
  contentType: string;
}

export interface IPresignedUrlResponse {
  success: boolean;
  data: {
    presignedUrl: string;
    publicUrl: string;
  };
}

export interface IUpdateProofRequest {
  paymentId: number;
  proofUrl: string;
}

export interface IUpdateProofResponse {
  success: boolean;
  message: string;
  data: IPayment;
}

export interface IUpdatePaymentStatusRequest {
  status: PaymentStatus;
}

export interface IUpdatePaymentStatusResponse {
  success: boolean;
  message: string;
  data: IPayment;
}