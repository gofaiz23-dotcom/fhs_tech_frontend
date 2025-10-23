/**
 * Authentication Error Handler
 * Centralized handling of authentication errors across the application
 */

import { toast } from '../hooks/use-toast'

export interface AuthError {
  code: string
  message: string
  status?: number
}

/**
 * Handles authentication errors by showing appropriate messages and redirecting to login
 * @param error - The authentication error
 * @param customMessage - Optional custom error message
 */
export const handleAuthError = (error: AuthError, customMessage?: string) => {
  console.error('🔐 Authentication error:', error)
  
  // Check if it's an authentication-related error
  if (error.code === 'REFRESH_TOKEN_EXPIRED' || 
      error.code === 'REFRESH_TOKEN_MISSING' ||
      error.code === 'ACCESS_TOKEN_EXPIRED' ||
      error.status === 401) {
    
    // Show user-friendly message
    toast({
      variant: "destructive",
      title: "Session Expired",
      description: customMessage || "Your session has expired. Please log in again.",
    })
    
    // Clear authentication data
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
      
      // Redirect to login page
      window.location.href = '/login'
    }
    
    return true // Indicates this was an auth error
  }
  
  return false // Not an auth error
}

/**
 * Wraps API calls with authentication error handling
 * @param apiCall - The API function to call
 * @param errorMessage - Custom error message for non-auth errors
 */
export const withAuthErrorHandling = async <T>(
  apiCall: () => Promise<T>,
  errorMessage: string = 'An error occurred'
): Promise<T> => {
  try {
    return await apiCall()
  } catch (error: any) {
    // Try to handle as auth error first
    if (handleAuthError(error, errorMessage)) {
      throw error // Re-throw to stop execution
    }
    
    // Handle other errors
    toast({
      variant: "destructive",
      title: "Error",
      description: error.message || errorMessage,
    })
    
    throw error
  }
}

/**
 * Checks if an error is an authentication error
 * @param error - The error to check
 */
export const isAuthError = (error: any): boolean => {
  return error.code === 'REFRESH_TOKEN_EXPIRED' || 
         error.code === 'REFRESH_TOKEN_MISSING' ||
         error.code === 'ACCESS_TOKEN_EXPIRED' ||
         error.status === 401
}
