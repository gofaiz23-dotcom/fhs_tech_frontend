/**
 * Admin Module Index
 * 
 * This file provides a centralized export for all admin-related
 * functionality, making it easy to import what you need throughout the app.
 */

// Core admin service
export { AdminService, AdminApiError, AdminUtils } from './api';

// TypeScript types and interfaces
export type {
  AdminUser,
  LoginSession,
  CurrentSession,
  LoginStats,
  AccessPermission,
  AccessSummary,
  UserWithHistory,
  DetailedUser,
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
