/**
 * API Configuration
 * 
 * Centralized configuration for all API-related constants.
 * This makes it easy to change the base URL and other settings in one place.
 */

/**
 * API Base URL Configuration
 * 
 * Development: Uses local network IP address
 * Production: Should use environment variable
 */
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://192.168.0.22:5000/api',
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
} as const;

/**
 * API Endpoints
 * 
 * Centralized endpoint paths for better maintainability
 */
export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    PROFILE: '/auth/profile',
  },
  
  // Admin
  ADMIN: {
    USERS: '/admin/users',
    USER_BY_ID: (id: number) => `/admin/users/${id}`,
    PERMISSIONS: (id: number) => `/admin/users/${id}/permissions`,
    RESET_PASSWORD: (id: number) => `/admin/users/${id}/reset-password`,
  },
  
  // Brands
  BRANDS: {
    LIST: '/brands',
    BY_ID: (id: number) => `/brands/${id}`,
    UPLOAD: '/brands',
  },
  
  // Marketplaces
  MARKETPLACES: {
    LIST: '/marketplaces',
    BY_ID: (id: number) => `/marketplaces/${id}`,
  },
  
  // Shipping
  SHIPPING: {
    LIST: '/shipping',
    BY_ID: (id: number) => `/shipping/${id}`,
  },
  
  // Products
  PRODUCTS: {
    LIST: '/products',
    BY_ID: (id: number) => `/products/${id}`,
    STATUS: '/products/status',
    CANCEL: (jobId: string) => `/products/cancel/${jobId}`,
    CATEGORIES: '/products/categories',
    BRANDS: '/products/brands',
    GROUP_SKUS: '/products/group-skus',
    SUB_SKUS: '/products/sub-skus',
    COLLECTIONS: '/products/collections',
    SHIP_TYPES: '/products/ship-types',
    SINGLE_SET_ITEMS: '/products/single-set-items',
  },
  
  // Listings
  LISTINGS: {
    LIST: '/listings',
    BY_ID: (id: number) => `/listings/${id}`,
    STATUS: '/listings/status',
    CANCEL: (jobId: string) => `/listings/cancel/${jobId}`,
  },
  
  // Inventory
  INVENTORY: {
    LIST: '/inventory',
    BY_ID: (id: number) => `/inventory/${id}`,
    STATUS: '/inventory/status',
    CANCEL: (jobId: string) => `/inventory/cancel/${jobId}`,
    BULK_UPDATE: '/inventory/bulk/inventory/updates',
  },
  
  // Settings
  SETTINGS: {
    LIST: '/settings',
    BY_ID: (id: number) => `/settings/${id}`,
  },
  
  // Health
  HEALTH: '/health',
} as const;

/**
 * HTTP Status Codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

/**
 * Error Codes
 */
export const ERROR_CODES = {
  // Authentication
  NO_TOKEN: 'NO_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_REFRESH_FAILED: 'TOKEN_REFRESH_FAILED',
  REFRESH_TOKEN_MISSING: 'REFRESH_TOKEN_MISSING',
  REFRESH_TOKEN_EXPIRED: 'REFRESH_TOKEN_EXPIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  
  // Network
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
  INVALID_JSON: 'INVALID_JSON',
  
  // Rate Limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  
  // General
  UNKNOWN: 'UNKNOWN',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
} as const;

/**
 * Request Headers
 */
export const REQUEST_HEADERS = {
  CONTENT_TYPE: 'Content-Type',
  AUTHORIZATION: 'Authorization',
  ACCEPT: 'Accept',
} as const;

/**
 * Content Types
 */
export const CONTENT_TYPES = {
  JSON: 'application/json',
  FORM_DATA: 'multipart/form-data',
  URL_ENCODED: 'application/x-www-form-urlencoded',
} as const;

/**
 * Storage Keys for localStorage/sessionStorage
 */
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'fhsfbe625',
  USER_PREFERENCES: 'user_preferences',
  THEME: 'theme',
} as const;

