import type { UserRole } from '../../config/constants.js';

export interface UserResponse {
  id: string;
  email: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface GetUsersQuery {
  page?: number;
  limit?: number;
  role?: UserRole;
}

export interface GetUsersResponse {
  success: true;
  data: {
    users: UserResponse[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface GetUserResponse {
  success: true;
  data: {
    user: UserResponse;
  };
}

export interface UpdateUserRequest {
  email?: string;
  role?: UserRole;
}

export interface UpdateUserResponse {
  success: true;
  data: {
    user: UserResponse;
  };
}

export interface DeleteUserResponse {
  success: true;
  data: {
    message: string;
  };
}
