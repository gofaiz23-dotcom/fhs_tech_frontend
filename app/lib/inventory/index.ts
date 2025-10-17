/**
 * Inventory API Module
 * 
 * Central export point for inventory-related functionality
 */

// Core inventory service
export { InventoryService } from './api';

// TypeScript types and interfaces
export type {
  Brand,
  Listing,
  InventoryItem,
  Pagination,
  InventoryResponse,
  UpdateInventoryRequest,
  BulkUpdateInventoryRequest,
  BulkUpdateInventoryResponse,
  BulkUpdateInventoryJobResponse,
} from './api';

