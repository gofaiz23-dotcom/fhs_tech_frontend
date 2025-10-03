/**
 * Admin API Type Definitions
 * 
 * This file contains all TypeScript types and interfaces for admin-specific
 * operations including user management and detailed user information.
 */

// Base admin user interface
export interface AdminUser {
  id: number;
  username: string;
  email: string;
  role: 'ADMIN' | 'USER';
  createdAt: string;
  updatedAt: string;
}

// Login session information
export interface LoginSession {
  id: number;
  loginTime: string;
  logoutTime: string | null;
  sessionDuration: number | null; // in minutes
  ipAddress: string;
  networkType: 'wifi' | 'cellular' | 'ethernet' | 'unknown';
  userAgent: string;
  isActive: boolean;
  createdAt: string;
}

// Current session details
export interface CurrentSession {
  loginTime: string;
  ipAddress: string;
  networkType: string;
  isActive: boolean;
}

// Login statistics
export interface LoginStats {
  totalSessions: number;
  totalLoginHours: number;
  lastLogin: string;
  currentSession: CurrentSession | null;
}

// Access permission for brands/marketplaces/shipping
export interface AccessPermission {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  grantedAt: string;
}


// Access summary for all permissions
export interface AccessSummary {
  totalBrands: number;
  totalMarketplaces: number;
  totalShippingCompanies: number;
  hasAnyAccess: boolean;
}

// Extended user with login history
export interface UserWithHistory extends AdminUser {
  loginStats: LoginStats;
  loginHistory: LoginSession[];
}


// Complete user details with all information
export interface DetailedUser extends AdminUser {
  loginStats: LoginStats;
  loginHistory: LoginSession[];
  brandAccess: AccessPermission[];
  marketplaceAccess: AccessPermission[];
  shippingAccess: AccessPermission[];
  accessSummary: AccessSummary;
}

// API Response types
export interface BasicUsersResponse {
  message: string;
  count: number;
  users: AdminUser[];
}

export interface UsersWithHistoryResponse {
  message: string;
  count: number;
  users: UserWithHistory[];
}


export interface AllUsersResponse {
  message: string;
  count: number;
  users: DetailedUser[];
}

export interface SingleUserResponse {
  message: string;
  user: DetailedUser;
}

export interface UpdateUserResponse {
  message: string;
  user: AdminUser;
}

// Update request types
export interface UpdateEmailRequest {
  email: string;
}

export interface UpdatePasswordRequest {
  password: string;
}

export interface UpdateRoleRequest {
  role: 'ADMIN' | 'USER';
}

// Error response interface
export interface AdminApiErrorResponse {
  error: string;
  code?: number;
}
