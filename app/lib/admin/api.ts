/**
 * Admin API Service
 * 
 * This service handles all admin-specific API calls for user management,
 * including fetching users, updating user details, and managing permissions.
 * All endpoints require admin authentication.
 */

// Note: AuthService dependency removed - tokens will be passed directly
import {
  BasicUsersResponse,
  UsersWithHistoryResponse,
  AllUsersResponse,
  SingleUserResponse,
  UpdateUserResponse,
  UpdateEmailRequest,
  UpdatePasswordRequest,
  UpdateRoleRequest,
  AdminApiErrorResponse,
} from './types';
import { AuthService, ensureValidToken } from '../auth/api';
import { HttpClient } from '../auth/httpClient';

// Base API configuration
const API_BASE_URL = 'https://fhs-tech-backend.onrender.com/api';
const ADMIN_ENDPOINTS = {
  USERS_BASIC: `${API_BASE_URL}/admin/users/basic`,
  USERS_HISTORY: `${API_BASE_URL}/admin/users/history`,
  USERS_ACCESS: `${API_BASE_URL}/admin/users/access`, // Updated endpoint name
  USER_DETAIL: (id: number) => `${API_BASE_URL}/admin/users/${id}`,
  UPDATE_EMAIL: (id: number) => `${API_BASE_URL}/admin/users/${id}/email`,
  UPDATE_PASSWORD: (id: number) => `${API_BASE_URL}/admin/users/${id}/password`,
  UPDATE_ROLE: (id: number) => `${API_BASE_URL}/admin/users/${id}/role`,
  UPDATE_USERNAME: (id: number) => `${API_BASE_URL}/admin/users/${id}/username`,
  DELETE_USER: (id: number) => `${API_BASE_URL}/admin/users/${id}/delete`,
  // Toggle access endpoints
  TOGGLE_BRAND_ACCESS: (userId: number, brandId: number) => `${API_BASE_URL}/users/${userId}/brands/${brandId}/toggle`,
  TOGGLE_MARKETPLACE_ACCESS: (userId: number, marketplaceId: number) => `${API_BASE_URL}/users/${userId}/marketplaces/${marketplaceId}/toggle`,
  TOGGLE_SHIPPING_ACCESS: (userId: number, shippingId: number) => `${API_BASE_URL}/users/${userId}/shipping/${shippingId}/toggle`,
  // Available items endpoints
  AVAILABLE_BRANDS: `${API_BASE_URL}/brands`,
  AVAILABLE_MARKETPLACES: `${API_BASE_URL}/marketplaces`,
  AVAILABLE_SHIPPING: `${API_BASE_URL}/shipping`,
} as const;

/**
 * Custom error class for admin API-specific errors
 */
export class AdminApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string
  ) {
    super(message);
    this.name = 'AdminApiError';
  }
}

/**
 * Generic admin API request handler with authentication and automatic token refresh
 * 
 * @param url - The endpoint URL
 * @param options - Fetch options
 * @param accessToken - Current access token (will be refreshed if expired)
 * @returns Promise with parsed JSON response
 */
async function adminApiRequest<T>(url: string, options: RequestInit = {}, accessToken?: string): Promise<T> {
  try {
    if (!accessToken) {
      throw new AdminApiError('Admin authentication required', 401, 'NO_TOKEN');
    }

    // Ensure token is valid and refresh if needed
    const validToken = await ensureValidToken(accessToken);
    if (!validToken) {
      throw new AdminApiError('Token expired and refresh failed', 401, 'TOKEN_EXPIRED');
    }

    // Convert full URL to endpoint path for HttpClient
    const endpoint = url.replace(API_BASE_URL, '');
    
    // Use HttpClient with authenticated request (handles token refresh automatically)
    return await HttpClient.request<T>(endpoint, {
      ...options,
      headers: {
        'Authorization': `Bearer ${validToken}`,
        ...options.headers,
      },
    });
  } catch (error) {
    if (error instanceof AdminApiError) {
      throw error;
    }
    
    // Handle network or other errors
    throw new AdminApiError(
      'Network error or server unavailable',
      0,
      'NETWORK_ERROR'
    );
  }
}

/**
 * Admin User Management Service
 */
export class AdminService {
  /**
   * Get all users with basic details only (email, role)
   * 
   * @param accessToken - Admin access token
   * @returns Promise<BasicUsersResponse> - Users with basic information
   */
  static async getUsersBasic(accessToken: string): Promise<BasicUsersResponse> {
    return adminApiRequest<BasicUsersResponse>(ADMIN_ENDPOINTS.USERS_BASIC, {
      method: 'GET',
    }, accessToken);
  }

  /**
   * Get all users with their complete login history and statistics
   * 
   * @param accessToken - Admin access token
   * @returns Promise<UsersWithHistoryResponse> - Users with login history
   */
  static async getUsersWithHistory(accessToken: string, monthsBack: number = 6): Promise<UsersWithHistoryResponse> {
    // Calculate date range for the specified number of months back
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - monthsBack);
    
    const params = new URLSearchParams({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });
    
    const url = `${ADMIN_ENDPOINTS.USERS_HISTORY}?${params.toString()}`;
    
    return adminApiRequest<UsersWithHistoryResponse>(url, {
      method: 'GET',
    }, accessToken);
  }


  /**
   * Get all users with complete access details (brands, marketplaces, shipping)
   * 
   * @param accessToken - Admin access token
   * @returns Promise<AllUsersResponse> - Users with full access information
   */
  static async getAllUsers(accessToken: string): Promise<AllUsersResponse> {
    return adminApiRequest<AllUsersResponse>(ADMIN_ENDPOINTS.USERS_ACCESS, {
      method: 'GET',
    }, accessToken);
  }

  /**
   * Get all users with complete access details (alias for getAllUsers)
   * 
   * @param accessToken - Admin access token
   * @returns Promise<AllUsersResponse> - Users with full access information
   */
  static async getAllUsersWithAccess(accessToken: string): Promise<AllUsersResponse> {
    return this.getAllUsers(accessToken);
  }

  /**
   * Get detailed information for a specific user by ID
   * 
   * @param userId - The user ID to fetch
   * @param accessToken - Admin access token
   * @returns Promise<SingleUserResponse> - Detailed user information
   */
  static async getUserById(userId: number, accessToken: string): Promise<SingleUserResponse> {
    return adminApiRequest<SingleUserResponse>(ADMIN_ENDPOINTS.USER_DETAIL(userId), {
      method: 'GET',
    }, accessToken);
  }

  /**
   * Update a user's email address
   * 
   * @param userId - The user ID to update
   * @param email - New email address
   * @param accessToken - Admin access token
   * @returns Promise<UpdateUserResponse> - Updated user information
   */
  static async updateUserEmail(userId: number, email: string, accessToken: string): Promise<UpdateUserResponse> {
    const requestData: UpdateEmailRequest = { email };
    
    return adminApiRequest<UpdateUserResponse>(ADMIN_ENDPOINTS.UPDATE_EMAIL(userId), {
      method: 'PUT',
      body: JSON.stringify(requestData),
    }, accessToken);
  }

  /**
   * Update a user's password
   * 
   * @param userId - The user ID to update
   * @param password - New password
   * @param accessToken - Admin access token
   * @returns Promise<UpdateUserResponse> - Updated user information
   */
  static async updateUserPassword(userId: number, password: string, accessToken: string): Promise<UpdateUserResponse> {
    const requestData: UpdatePasswordRequest = { password };
    
    return adminApiRequest<UpdateUserResponse>(ADMIN_ENDPOINTS.UPDATE_PASSWORD(userId), {
      method: 'PUT',
      body: JSON.stringify(requestData),
    }, accessToken);
  }

  /**
   * Update a user's role (USER or ADMIN)
   * 
   * @param userId - The user ID to update
   * @param role - New role (USER or ADMIN)
   * @param accessToken - Admin access token
   * @returns Promise<UpdateUserResponse> - Updated user information
   */
  static async updateUserRole(userId: number, role: 'ADMIN' | 'USER', accessToken: string): Promise<UpdateUserResponse> {
    const requestData: UpdateRoleRequest = { role };
    
    return adminApiRequest<UpdateUserResponse>(ADMIN_ENDPOINTS.UPDATE_ROLE(userId), {
      method: 'PUT',
      body: JSON.stringify(requestData),
    }, accessToken);
  }

  /**
   * Update user username
   * 
   * @param userId - User ID to update
   * @param username - New username
   * @param accessToken - Admin access token
   * @returns Promise<UpdateUserResponse> - Update result
   */
  static async updateUsername(userId: number, username: string, accessToken: string): Promise<UpdateUserResponse> {
    try {
      console.log('🔍 API: Updating username for user', userId, 'to', username);
      console.log('🔍 API: Endpoint:', ADMIN_ENDPOINTS.UPDATE_USERNAME(userId));
      console.log('🔍 API: Request body:', JSON.stringify({ username }));
      console.log('🔍 API: Access token (first 20 chars):', accessToken.substring(0, 20) + '...');
      
      // Test if endpoint is reachable first
      console.log('🔍 API: Testing endpoint reachability...');
      try {
        const testResponse = await HttpClient.request(ADMIN_ENDPOINTS.UPDATE_USERNAME(userId).replace(API_BASE_URL, ''), {
          method: 'OPTIONS', // Use OPTIONS to test connectivity without side effects
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          }
        });
        console.log('🔍 API: Test response status:', testResponse.status);
        console.log('🔍 API: Test response headers:', Object.fromEntries(testResponse.headers.entries()));
      } catch (testError) {
        console.log('🔍 API: Test request failed:', testError);
      }
      
      const result = await adminApiRequest<UpdateUserResponse>(ADMIN_ENDPOINTS.UPDATE_USERNAME(userId), {
        method: 'PUT',
        body: JSON.stringify({ username }),
      }, accessToken);
      
      console.log('✅ API: Username update successful:', result);
      return result;
    } catch (error: any) {
      console.error('❌ API: Username update failed:', error);
      console.error('❌ API: Error type:', typeof error);
      console.error('❌ API: Error constructor:', error.constructor.name);
      console.error('❌ API: Error keys:', Object.keys(error));
      console.error('❌ API: Full error object:', JSON.stringify(error, null, 2));
      console.error('❌ API: Error details:', {
        message: error.message,
        statusCode: error.statusCode,
        code: error.code,
        status: error.status,
        response: error.response
      });
      throw error;
    }
  }

  /**
   * Delete user
   * 
   * @param userId - User ID to delete
   * @param accessToken - Admin access token
   * @returns Promise<{ success: boolean; message: string }> - Delete result
   */
  static async deleteUser(userId: number, accessToken: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🔍 API: Deleting user', userId);
      console.log('🔍 API: Endpoint:', ADMIN_ENDPOINTS.DELETE_USER(userId));
      
      const result = await adminApiRequest<{ success: boolean; message: string }>(ADMIN_ENDPOINTS.DELETE_USER(userId), {
        method: 'DELETE',
      }, accessToken);
      
      console.log('✅ API: User deletion successful:', result);
      return result;
    } catch (error: any) {
      console.error('❌ API: User deletion failed:', error);
      console.error('❌ API: Error details:', {
        message: error.message,
        statusCode: error.statusCode,
        code: error.code
      });
      throw error;
    }
  }

  /**
   * Utility function to convert API user data to app format
   * 
   * This helps bridge the gap between API response format and the app's
   * existing user management format.
   * 
   * @param apiUser - User data from API
   * @returns Converted user data for app use
   */
  static convertApiUserToAppFormat(apiUser: any) {
    return {
      id: apiUser.id.toString(), // Convert to string for consistency
      username: apiUser.email.split('@')[0], // Extract username from email
      email: apiUser.email,
      password: '••••••••', // Hidden for security
      avatar: `bg-gradient-to-br from-${['indigo', 'rose', 'emerald', 'sky'][apiUser.id % 4]}-500 to-${['purple', 'orange', 'teal', 'indigo'][apiUser.id % 4]}-500`,
      role: apiUser.role.toLowerCase() as 'admin' | 'manager' | 'viewer',
      permissions: {
        brands: (apiUser.brandAccess || []).map((brand: any) => ({
          name: brand.name,
          enabled: brand.isActive,
        })),
        marketplaces: (apiUser.marketplaceAccess || []).map((marketplace: any) => ({
          name: marketplace.name,
          enabled: marketplace.isActive,
        })),
        shippingPlatforms: (apiUser.shippingAccess || []).map((shipping: any) => ({
          name: shipping.name,
          enabled: shipping.isActive,
        })),
      },
      // Additional fields from API
      createdAt: apiUser.createdAt,
      updatedAt: apiUser.updatedAt,
      loginStats: apiUser.loginStats,
      loginHistory: apiUser.loginHistory,
      accessSummary: apiUser.accessSummary,
    };
  }

  /**
   * Check if current user has admin privileges
   * 
   * @param accessToken - Access token to test
   * @returns boolean - True if user is admin
   */
  static async isCurrentUserAdmin(accessToken: string): Promise<boolean> {
    try {
      // Try to access admin endpoint - if it works, user is admin
      await AdminService.getUsersBasic(accessToken);
      return true;
    } catch (error) {
      if (error instanceof AdminApiError && error.statusCode === 403) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Get user statistics summary
   * 
   * @param accessToken - Admin access token
   * @returns Summary statistics for all users
   */
  static async getUserStatistics(accessToken: string) {
    try {
      const response = await AdminService.getAllUsers(accessToken);
      const users = response.users;
      
      return {
        totalUsers: users.length,
        activeUsers: users.filter(u => u.loginStats.currentSession?.isActive).length,
        adminUsers: users.filter(u => u.role === 'ADMIN').length,
        regularUsers: users.filter(u => u.role === 'USER').length,
        usersWithBrandAccess: users.filter(u => u.accessSummary.totalBrands > 0).length,
        usersWithMarketplaceAccess: users.filter(u => u.accessSummary.totalMarketplaces > 0).length,
        usersWithShippingAccess: users.filter(u => u.accessSummary.totalShippingCompanies > 0).length,
      };
    } catch (error) {
      console.error('Failed to get user statistics:', error);
      throw error;
    }
  }
}

/**
 * Utility functions for data formatting
 */
export class AdminUtils {
  /**
   * Format session duration from minutes to human-readable string
   * 
   * @param minutes - Duration in minutes
   * @returns Formatted duration string
   */
  static formatSessionDuration(minutes: number | null): string {
    if (!minutes) return 'N/A';
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  }

  /**
   * Format date to relative time (e.g., "2 hours ago")
   * 
   * @param dateString - ISO date string
   * @returns Relative time string
   */
  static formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  }

  /**
   * Get user status based on login activity
   * 
   * @param user - User with login stats
   * @returns Status object with color and text
   */
  static getUserStatus(user: any) {
    if (user.loginStats?.currentSession?.isActive) {
      return {
        status: 'online',
        color: 'bg-green-500',
        text: 'Online',
      };
    }
    
    if (user.loginStats?.lastLogin) {
      const lastLogin = new Date(user.loginStats.lastLogin);
      const hoursSinceLogin = (Date.now() - lastLogin.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceLogin < 24) {
        return {
          status: 'recent',
          color: 'bg-yellow-500',
          text: 'Recent',
        };
      }
    }
    
    return {
      status: 'offline',
      color: 'bg-gray-500',
      text: 'Offline',
    };
  }

  /**
   * Toggle brand access for a user
   * 
   * @param userId - User ID
   * @param brandId - Brand ID
   * @param accessToken - Admin access token
   * @returns Promise with toggle result
   */
  static async toggleBrandAccess(
    userId: number,
    brandId: number,
    accessToken: string
  ): Promise<{ message: string; access: any }> {
    return adminApiRequest<{ message: string; access: any }>(
      ADMIN_ENDPOINTS.TOGGLE_BRAND_ACCESS(userId, brandId),
      {
        method: 'POST',
      },
      accessToken
    );
  }

  /**
   * Toggle marketplace access for a user
   * 
   * @param userId - User ID
   * @param marketplaceId - Marketplace ID
   * @param accessToken - Admin access token
   * @returns Promise with toggle result
   */
  static async toggleMarketplaceAccess(
    userId: number,
    marketplaceId: number,
    accessToken: string
  ): Promise<{ message: string; access: any }> {
    return adminApiRequest<{ message: string; access: any }>(
      ADMIN_ENDPOINTS.TOGGLE_MARKETPLACE_ACCESS(userId, marketplaceId),
      {
        method: 'POST',
      },
      accessToken
    );
  }

  /**
   * Toggle shipping access for a user
   * 
   * @param userId - User ID
   * @param shippingId - Shipping Company ID
   * @param accessToken - Admin access token
   * @returns Promise with toggle result
   */
  static async toggleShippingAccess(
    userId: number,
    shippingId: number,
    accessToken: string
  ): Promise<{ message: string; access: any }> {
    return adminApiRequest<{ message: string; access: any }>(
      ADMIN_ENDPOINTS.TOGGLE_SHIPPING_ACCESS(userId, shippingId),
      {
        method: 'POST',
      },
      accessToken
    );
  }

  /**
   * Get all available brands
   * 
   * @param accessToken - Admin access token
   * @returns Promise with available brands
   */
  static async getAvailableBrands(accessToken: string): Promise<{ brands: any[] }> {
    return adminApiRequest<{ brands: any[] }>(
      ADMIN_ENDPOINTS.AVAILABLE_BRANDS,
      {
        method: 'GET',
      },
      accessToken
    );
  }

  /**
   * Get all available marketplaces
   * 
   * @param accessToken - Admin access token
   * @returns Promise with available marketplaces
   */
  static async getAvailableMarketplaces(accessToken: string): Promise<{ marketplaces: any[] }> {
    return adminApiRequest<{ marketplaces: any[] }>(
      ADMIN_ENDPOINTS.AVAILABLE_MARKETPLACES,
      {
        method: 'GET',
      },
      accessToken
    );
  }

  /**
   * Get all available shipping companies
   * 
   * @param accessToken - Admin access token
   * @returns Promise with available shipping companies
   */
  static async getAvailableShipping(accessToken: string): Promise<{ shippingCompanies: any[] }> {
    return adminApiRequest<{ shippingCompanies: any[] }>(
      ADMIN_ENDPOINTS.AVAILABLE_SHIPPING,
      {
        method: 'GET',
      },
      accessToken
    );
  }
}
