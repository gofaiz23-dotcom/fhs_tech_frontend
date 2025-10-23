/**
 * Library Index
 * 
 * Central export file for all library modules.
 * This provides a clean, organized way to import from the lib folder.
 * 
 * Usage:
 * ```
 * import { API_CONFIG, ApiError, useAuth } from '@/app/lib';
 * ```
 */

// ============================================================================
// Configuration
// ============================================================================
export { 
  API_CONFIG, 
  API_ENDPOINTS, 
  HTTP_STATUS, 
  ERROR_CODES,
  REQUEST_HEADERS,
  CONTENT_TYPES,
  STORAGE_KEYS,
} from './config/api.config';

// ============================================================================
// Common Types
// ============================================================================
export type {
  Pagination,
  Brand,
  Marketplace,
  ShippingCompany,
  ApiResponse,
  PaginatedResponse,
  BulkOperationSummary,
  BulkOperationResult,
  JobStatus,
  SystemStats,
  UploadProgress,
  SortOrder,
  UserRole,
  ID,
  TimestampString,
  FilterOptions,
  CreateResponse,
  UpdateResponse,
  DeleteResponse,
  GetResponse,
  ListResponse,
} from './types/common.types';

// ============================================================================
// Utilities
// ============================================================================
export {
  ApiError,
  parseApiError,
  buildQueryString,
  formatFileSize,
  formatDate,
  formatDateTime,
  getRelativeTime,
  debounce,
  throttle,
  retry,
  safeJsonParse,
  isValidEmail,
  truncate,
  capitalize,
  sleep,
} from './utils/api.utils';

export { cn } from './utils';

// ============================================================================
// Authentication
// ============================================================================
export {
  AuthService,
  AuthApiError,
  ensureValidToken,
  AuthProvider,
  useAuth,
  useUser,
  useIsAuthenticated,
  ProtectedRoute,
  withAuth,
  AdminRoute,
  useCanAccess,
} from './auth';

export type {
  User,
  UserProfile,
  NetworkType,
  Permission,
  AuthTokens,
  LoginRequest,
  RegisterRequest,
  LoginResponse,
  RegisterResponse,
  ProfileResponse,
  RefreshResponse,
  LogoutResponse,
  AuthError,
  AuthState,
  AuthAction,
} from './auth/types';

export { HttpClient } from './auth/httpClient';

// ============================================================================
// Admin
// ============================================================================
export { AdminService } from './admin/api';
export type { 
  AdminUser,
  DetailedUser,
  UserWithHistory,
  LoginSession,
  LoginStats,
  AccessPermission,
  AccessSummary,
  BasicUsersResponse,
  UsersWithHistoryResponse,
  AllUsersResponse,
  SingleUserResponse,
  UpdateUserResponse,
  UpdateEmailRequest,
  UpdatePasswordRequest,
  UpdateRoleRequest,
} from './admin/types';

// ============================================================================
// Brands
// ============================================================================
export { BrandsService, BrandsApiError, BrandsUtils } from './brands/api';
export type {
  BrandResponse,
  BrandFilters,
  CreateBrandRequest,
  UpdateBrandRequest,
  CreateBrandResponse,
  UpdateBrandResponse,
  DeleteBrandResponse,
} from './brands/api';

// ============================================================================
// Marketplaces
// ============================================================================
export { MarketplacesService } from './marketplaces/api';

// ============================================================================
// Shipping
// ============================================================================
export { ShippingService } from './shipping/api';

// ============================================================================
// Products
// ============================================================================
export { ProductsService } from './products/api';
export type {
  Product,
  ProductAttributes,
  ProductsResponse,
  ProductsFilters,
} from './products/api';

// ============================================================================
// Listings
// ============================================================================
export { ListingsService } from './listings/api';
export type {
  Listing,
  ListingsResponse,
  ListingsFilters,
  ImageTemplateData,
  ImageTemplateResponse,
  BulkImageUploadResponse,
} from './listings/api';

// ============================================================================
// Inventory
// ============================================================================
export { InventoryService } from './inventory/api';
export type {
  InventoryItem,
  InventoryResponse,
  UpdateInventoryRequest,
  BulkUpdateInventoryRequest,
  BulkUpdateInventoryResponse,
  BulkUpdateInventoryJobResponse,
} from './inventory/api';

// ============================================================================
// Status
// ============================================================================
export { statusApi } from './status/api';
export type { StatusResponse } from './status/api';

// ============================================================================
// Settings
// ============================================================================
export { 
  getSettings, 
  updateSettings, 
  getBrands, 
  updateBrandMapping 
} from './settings/api';

export type {
  Setting,
  InventoryConfig,
  SettingsResponse,
  BrandMapping,
  BrandsResponse,
  // UpdateBrandResponse,
} from './settings/api';

// ============================================================================
// Stores (Zustand State Management)
// ============================================================================
export { useAuthStore } from './stores/authStore';
export { useAdminStore } from './stores/adminStore';
export { usePermissionsStore } from './stores/permissionsStore';
export { useUsersStore } from './stores/usersStore';
export { useActivityStore } from './stores/activityStore';
export { useRetentionStore } from './stores/retentionStore';
export { useSalesChannelsStore } from './stores/salesChannelsStore';
export { useWarehousesStore } from './stores/warehousesStore';

// ============================================================================
// Activity Logger
// ============================================================================
export { activityLogger } from './activity-logger';

// ============================================================================
// Access Control
// ============================================================================
export { 
  AccessControlService,
  AccessControlUtils,
  AccessControlApiError,
} from './access-control';

