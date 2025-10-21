import { HttpClient } from '../auth/httpClient';
import type { JobStatus, SystemStats } from '../types/common.types';

export type { JobStatus };

export interface StatusResponse {
  success: boolean;
  jobs: JobStatus[];
  message?: string;
  systemStats?: SystemStats;
  timestamp?: string;
}

export const statusApi = {
  // Get products status
  async getProductsStatus(accessToken: string): Promise<StatusResponse> {
    try {
      const data = await HttpClient.get<{ 
        jobs: JobStatus[]; 
        message?: string;
        systemStats?: { total: number; processing: number; completed: number; failed: number };
        timestamp?: string;
      }>('/products/status', {}, accessToken);
      return {
        success: true,
        jobs: data.jobs || [],
        message: data.message,
        systemStats: data.systemStats,
        timestamp: data.timestamp
      };
    } catch (error) {
      console.error('Error fetching products status:', error);
      return {
        success: false,
        jobs: [],
        message: error instanceof Error ? error.message : 'Failed to fetch products status'
      };
    }
  },

  // Get listings status
  async getListingsStatus(accessToken: string): Promise<StatusResponse> {
    try {
      const data = await HttpClient.get<{ 
        jobs: JobStatus[]; 
        message?: string;
        systemStats?: { total: number; processing: number; completed: number; failed: number };
        timestamp?: string;
      }>('/listings/status', {}, accessToken);
      return {
        success: true,
        jobs: data.jobs || [],
        message: data.message,
        systemStats: data.systemStats,
        timestamp: data.timestamp
      };
    } catch (error) {
      console.error('Error fetching listings status:', error);
      return {
        success: false,
        jobs: [],
        message: error instanceof Error ? error.message : 'Failed to fetch listings status'
      };
    }
  },

  // Get inventory status
  async getInventoryStatus(accessToken: string): Promise<StatusResponse> {
    try {
      const data = await HttpClient.get<{ 
        jobs: JobStatus[]; 
        message?: string;
        systemStats?: { total: number; processing: number; completed: number; failed: number };
        timestamp?: string;
      }>('/inventory/status', {}, accessToken);
      return {
        success: true,
        jobs: data.jobs || [],
        message: data.message,
        systemStats: data.systemStats,
        timestamp: data.timestamp
      };
    } catch (error) {
      console.error('Error fetching inventory status:', error);
      return {
        success: false,
        jobs: [],
        message: error instanceof Error ? error.message : 'Failed to fetch inventory status'
      };
    }
  },

  // Get all status data
  async getAllStatus(accessToken: string): Promise<{
    products: JobStatus[];
    listings: JobStatus[];
    inventory: JobStatus[];
  }> {
    try {
      const [productsRes, listingsRes, inventoryRes] = await Promise.all([
        this.getProductsStatus(accessToken),
        this.getListingsStatus(accessToken),
        this.getInventoryStatus(accessToken)
      ]);

      return {
        products: productsRes.jobs,
        listings: listingsRes.jobs,
        inventory: inventoryRes.jobs
      };
    } catch (error) {
      console.error('Error fetching all status data:', error);
      return {
        products: [],
        listings: [],
        inventory: []
      };
    }
  },

  // Cancel a job
  async cancelJob(jobId: string, type: 'product' | 'listing' | 'inventory', accessToken: string): Promise<{ success: boolean; message?: string }> {
    try {
      const data = await HttpClient.delete<{ message: string }>(`/${type}s/cancel/${jobId}`, {}, accessToken);
      return {
        success: true,
        message: data.message
      };
    } catch (error) {
      console.error('Error cancelling job:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to cancel job'
      };
    }
  }
};
