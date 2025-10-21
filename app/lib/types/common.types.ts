/**
 * Common Types and Interfaces
 * 
 * Shared types used across multiple modules to avoid duplication
 * and ensure consistency.
 */

/**
 * Pagination Interface
 * Used for paginated API responses
 */
export interface Pagination {
  totalCount: number;
  totalPages: number;
  currentPage: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/**
 * Brand Interface
 * Common brand entity used across products, inventory, etc.
 */
export interface Brand {
  id: number;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Marketplace Interface
 */
export interface Marketplace {
  id: number;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Shipping Company Interface
 */
export interface ShippingCompany {
  id: number;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * API Response Base
 * Generic base structure for API responses
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  code?: string;
  timestamp?: string;
}

/**
 * Paginated Response
 * Generic paginated API response
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
  message?: string;
  timestamp?: string;
}

/**
 * Bulk Operation Summary
 * Used for bulk create/update operations
 */
export interface BulkOperationSummary {
  total: number;
  successful: number;
  failed: number;
  skipped?: number;
  duplicates?: number;
  errors?: number;
}

/**
 * Bulk Operation Result
 * Detailed result for bulk operations
 */
export interface BulkOperationResult<T = any> {
  message: string;
  summary: BulkOperationSummary;
  results: {
    successful?: T[];
    failed?: Array<{ row?: number; error: string; data?: any }>;
    duplicates?: Array<{ row?: number; error: string; data?: any }>;
  };
  timestamp?: string;
}

/**
 * Job Status
 * Background job processing status
 */
export interface JobStatus {
  id: string;
  type: 'product' | 'listing' | 'inventory';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  totalItems: number;
  processedItems: number;
  fileName?: string;
  fileSize?: string;
  startedAt: string;
  completedAt?: string;
  error?: string;
  userId?: string;
  username?: string;
}

/**
 * System Stats
 * System-wide statistics
 */
export interface SystemStats {
  total: number;
  processing: number;
  completed: number;
  failed: number;
  pending?: number;
  cancelled?: number;
}

/**
 * File Upload Progress
 */
export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

/**
 * Sort Order
 */
export type SortOrder = 'asc' | 'desc';

/**
 * User Role
 */
export type UserRole = 'ADMIN' | 'USER';

/**
 * Generic ID Type
 */
export type ID = number | string;

/**
 * Timestamp Strings
 */
export type TimestampString = string; // ISO 8601 format

/**
 * Generic Filter Options
 */
export interface FilterOptions {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: SortOrder;
  [key: string]: any; // Allow additional filter parameters
}

/**
 * Generic CRUD Operations Response Types
 */
export interface CreateResponse<T> {
  message: string;
  data: T;
  timestamp?: string;
}

export interface UpdateResponse<T> {
  message: string;
  data: T;
  timestamp?: string;
}

export interface DeleteResponse {
  message: string;
  timestamp?: string;
}

export interface GetResponse<T> {
  message?: string;
  data: T;
  timestamp?: string;
}

export interface ListResponse<T> {
  message?: string;
  data: T[];
  totalCount?: number;
  timestamp?: string;
}

