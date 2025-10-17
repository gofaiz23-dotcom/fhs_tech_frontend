/**
 * Login History API Service
 * 
 * This service handles all login history and user analytics API calls.
 * All endpoints require admin authentication with Bearer token.
 * 
 * API Base URL: https://fhs-tech-backend.onrender.com/api
 * 
 * Available Endpoints:
 * - GET /api/admin/users - Get all users with login statistics
 * - GET /api/admin/users/:id - Get detailed user login history
 * 
 * Authentication: Bearer token required in Authorization header
 */

// Base API configuration
// API Server: https://fhs-tech-backend.onrender.com
// Base Path: /api
const API_BASE_URL = 'http://192.168.0.23:5000/api';

/**
 * Custom error class for login history API-specific errors
 */
export class LoginHistoryApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string
  ) {
    super(message);
    this.name = 'LoginHistoryApiError';
  }
}

  /**
   * Generic API request handler with authentication
   */
  async function loginHistoryApiRequest<T>(url: string, options: RequestInit = {}, accessToken?: string): Promise<T> {
    try {
      console.log('🌐 LoginHistory API: Making request to:', url);
      console.log('🌐 LoginHistory API: Request options:', {
        method: options.method,
        headers: options.headers,
        hasBody: !!options.body,
        hasToken: !!accessToken
      });

      if (!accessToken) {
        console.error('❌ LoginHistory API: No access token provided');
        throw new LoginHistoryApiError('Authentication required', 401, 'NO_TOKEN');
      }

      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          ...options.headers,
        },
        credentials: 'include',
      });

      console.log('🌐 LoginHistory API: Response status:', response.status);
      console.log('🌐 LoginHistory API: Response headers:', Object.fromEntries(response.headers.entries()));

      let data;
      try {
        data = await response.json();
        console.log('🌐 LoginHistory API: Response data:', data);
      } catch (parseError) {
        console.warn('⚠️ LoginHistory API: Failed to parse response as JSON:', parseError);
        data = { error: 'Invalid response format' };
      }

      if (!response.ok) {
        console.error('❌ LoginHistory API: Request failed:', {
          status: response.status,
          statusText: response.statusText,
          url: url,
          error: data?.error || 'Unknown error',
          code: data?.code || 'UNKNOWN'
        });
        
        // Handle different types of errors with more specific messages
        let errorMessage = data?.error || `API error: ${response.statusText}`;
        
        if (response.status === 404) {
          if (data?.error?.includes('Route not found') || data?.error?.includes('route')) {
            errorMessage = 'User not found or the requested endpoint is not available';
          } else {
            errorMessage = data?.error || 'User not found';
          }
        } else if (response.status === 401) {
          errorMessage = data?.error || 'Authentication required - please log in again';
        } else if (response.status === 403) {
          errorMessage = data?.error || 'Access denied - insufficient permissions';
        } else if (response.status >= 500) {
          errorMessage = data?.error || 'Server error - please try again later';
        }
        
        throw new LoginHistoryApiError(
          errorMessage,
          response.status,
          data?.code?.toString()
        );
      }

      console.log('✅ LoginHistory API: Request successful');
      return data as T;
    } catch (error) {
      console.error('❌ LoginHistory API: Network/parsing error:', error);
      
      if (error instanceof LoginHistoryApiError) {
        throw error;
      }
      
      // Handle network or other errors
      throw new LoginHistoryApiError(
        `Network error or server unavailable: ${error instanceof Error ? error.message : 'Unknown error'}`,
        0,
        'NETWORK_ERROR'
      );
    }
  }

export interface LoginHistoryEntry {
  id: number;
  loginTime: string;
  logoutTime: string | null;
  sessionDuration: number | null;
  ipAddress: string;
  networkType: string;
  userAgent: string;
  createdAt: string;
}

export interface UserLoginStats {
  id: number;
  email: string;
  role: string;
  createdAt: string;
  totalLoginHours: number;
  totalSessions: number;
  lastLogin: string | null;
  currentSession: {
    loginTime: string;
    isActive: boolean;
    ipAddress: string;
    networkType: string;
    currentDuration: number;
  } | null;
}

export interface DetailedUserLoginHistory {
  id: number;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  brandAccess: Array<{
    id: number;
    name: string;
    description: string;
    isActive: boolean;
    grantedAt: string;
  }>;
  marketplaceAccess: Array<{
    id: number;
    name: string;
    description: string;
    isActive: boolean;
    grantedAt: string;
  }>;
  shippingAccess: Array<{
    id: number;
    name: string;
    description: string;
    isActive: boolean;
    grantedAt: string;
  }>;
  loginHistory: LoginHistoryEntry[];
}

export class LoginHistoryService {
  /**
   * Test server connectivity and endpoint availability
   */
  static async testServerConnectivity(): Promise<{
    isReachable: boolean;
    status: number;
    error?: string;
    endpoints?: {
      users: boolean;
      userDetails: boolean;
    };
  }> {
    try {
      console.log('🔍 Testing server connectivity to:', API_BASE_URL);
      
      // Test basic server connectivity
      const healthResponse = await fetch(`${API_BASE_URL.replace('/api', '')}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('🔍 Health check response:', healthResponse.status);
      
      return {
        isReachable: healthResponse.ok,
        status: healthResponse.status,
      };
    } catch (error) {
      console.error('🔍 Server connectivity test failed:', error);
      return {
        isReachable: false,
        status: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get all users with login statistics (Admin only)
   * 
   * Endpoint: GET /api/admin/users
   * Description: Get comprehensive user list with login analytics (Admin only)
   */
  static async getAllUsersWithLoginStats(accessToken: string): Promise<{
    message: string;
    users: UserLoginStats[];
  }> {
    console.log('🔍 Fetching users with login statistics from: /api/admin/users');
    
    return loginHistoryApiRequest(`${API_BASE_URL}/admin/users`, {
      method: 'GET',
    }, accessToken);
  }

  /**
   * Get detailed user login history (Admin only)
   * 
   * Endpoint: GET /api/admin/users/:id
   * Description: Get detailed login history for a specific user (Admin only)
   */
  static async getUserLoginHistory(
    userId: number, 
    accessToken: string
  ): Promise<{
    message: string;
    user: DetailedUserLoginHistory;
  }> {
    console.log(`🔍 Fetching user details for ID ${userId} from: /api/admin/users/${userId}`);
    
    // Validate userId before making the request
    if (!userId || userId <= 0) {
      throw new LoginHistoryApiError(
        'Invalid user ID provided',
        400,
        'INVALID_USER_ID'
      );
    }
    
    return loginHistoryApiRequest(`${API_BASE_URL}/admin/users/${userId}`, {
      method: 'GET',
    }, accessToken);
  }

  /**
   * Get network type from browser
   */
  static getNetworkType(): string {
    if (typeof window === 'undefined') return 'unknown';
    
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection;
    
    if (connection) {
      return connection.effectiveType || 'unknown';
    }
    
    return 'unknown';
  }

  /**
   * Format session duration in minutes to hours and minutes
   */
  static formatSessionDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${remainingMinutes}m`;
  }

  /**
   * Format total login hours
   */
  static formatTotalHours(hours: number): string {
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    
    if (wholeHours > 0) {
      return `${wholeHours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  /**
   * Calculate current session duration in minutes
   */
  static calculateCurrentDuration(loginTime: string): number {
    const login = new Date(loginTime);
    const now = new Date();
    return Math.floor((now.getTime() - login.getTime()) / (1000 * 60));
  }

  /**
   * Get relative time string
   */
  static getRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  }

  /**
   * Get network type icon
   */
  static getNetworkIcon(networkType: string): string {
    switch (networkType.toLowerCase()) {
      case 'wifi':
        return '📶';
      case '4g':
      case '3g':
      case '2g':
        return '📱';
      case 'ethernet':
        return '🔌';
      default:
        return '🌐';
    }
  }

  /**
   * Get network type color
   */
  static getNetworkColor(networkType: string): string {
    switch (networkType.toLowerCase()) {
      case 'wifi':
        return 'text-green-600';
      case '4g':
        return 'text-blue-600';
      case '3g':
        return 'text-yellow-600';
      case '2g':
        return 'text-red-600';
      case 'ethernet':
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  }
}
