import type { UserRole } from '../../config/constants.js';

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: true;
  data: {
    user: {
      id: string;
      email: string;
      role: UserRole;
    };
    accessToken: string;
  };
}

export interface RefreshResponse {
  success: true;
  data: {
    accessToken: string;
  };
}

export interface LogoutResponse {
  success: true;
  data: {
    message: string;
  };
}
