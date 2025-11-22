export interface UserLogin {
  email: string;
  password: string;
}

export interface AuthRes {
  success: boolean;
  message: string;
  token: string;
}

export interface PinRequestDto {
  email: string;
  name?: string;
  role: 'LANDLORD' | 'TENANT';
}

export interface PinVerifyDto {
  email: string;
  pin: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    token: string;
    role: 'LANDLORD' | 'TENANT';
  };
}
