/**
 * Shipping Companies API Service
 * 
 * Complete CRUD operations for shipping company management with support for
 * single company, multiple companies, and bulk file upload (CSV/Excel).
 * Includes admin-only operations and proper error handling.
 */

import {
  ShippingCompany,
  CreateShippingCompanyRequest,
  CreateMultipleShippingCompaniesRequest,
  UpdateShippingCompanyRequest,
  ShippingCompaniesResponse,
  SingleShippingCompanyResponse,
  BulkUploadResponse,
  ShippingApiError,
  FileUploadProgress,
  SUPPORTED_FILE_TYPES
} from './types';

const BASE_URL = 'http://192.168.0.23:5000/api';

/**
 * Shipping Companies API Service Class
 * 
 * Handles all shipping company operations including CRUD, bulk upload,
 * and file validation with proper error handling and progress tracking.
 */
export class ShippingService {
  private static async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    accessToken: string
  ): Promise<T> {
    const url = `${BASE_URL}${endpoint}`;
    
    const defaultHeaders: HeadersInit = {
      'Authorization': `Bearer ${accessToken}`,
    };

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData: ShippingApiError = await response.json().catch(() => ({
          error: `HTTP ${response.status}: ${response.statusText}`,
          code: response.status
        }));
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error occurred');
    }
  }

  /**
   * Get all shipping companies
   * 
   * @param accessToken - User's access token
   * @returns Promise<ShippingCompaniesResponse>
   */
  static async getShippingCompanies(accessToken: string): Promise<ShippingCompaniesResponse> {
    return this.makeRequest<ShippingCompaniesResponse>('/shipping', {
      method: 'GET',
    }, accessToken);
  }

  /**
   * Get specific shipping company by ID
   * 
   * @param id - Shipping company ID
   * @param accessToken - User's access token
   * @returns Promise<SingleShippingCompanyResponse>
   */
  static async getShippingCompany(
    id: number, 
    accessToken: string
  ): Promise<SingleShippingCompanyResponse> {
    return this.makeRequest<SingleShippingCompanyResponse>(`/shipping/${id}`, {
      method: 'GET',
    }, accessToken);
  }

  /**
   * Create a single shipping company
   * 
   * @param data - Shipping company data
   * @param accessToken - User's access token (admin required)
   * @returns Promise<SingleShippingCompanyResponse>
   */
  static async createShippingCompany(
    data: CreateShippingCompanyRequest,
    accessToken: string
  ): Promise<SingleShippingCompanyResponse> {
    return this.makeRequest<SingleShippingCompanyResponse>('/shipping', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }, accessToken);
  }

  /**
   * Create multiple shipping companies
   * 
   * @param data - Multiple shipping companies data
   * @param accessToken - User's access token (admin required)
   * @returns Promise<BulkUploadResponse>
   */
  static async createMultipleShippingCompanies(
    data: CreateMultipleShippingCompaniesRequest,
    accessToken: string
  ): Promise<BulkUploadResponse> {
    return this.makeRequest<BulkUploadResponse>('/shipping', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }, accessToken);
  }

  /**
   * Upload shipping companies from file (CSV/Excel)
   * 
   * @param file - File to upload
   * @param accessToken - User's access token (admin required)
   * @param onProgress - Progress callback
   * @returns Promise<BulkUploadResponse>
   */
  static async uploadShippingCompaniesFile(
    file: File,
    accessToken: string,
    onProgress?: (progress: FileUploadProgress) => void
  ): Promise<BulkUploadResponse> {
    // Validate file type and size
    this.validateFile(file);

    const formData = new FormData();
    formData.append('file', file);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const progress: FileUploadProgress = {
            loaded: event.loaded,
            total: event.total,
            percentage: Math.round((event.loaded / event.total) * 100)
          };
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (error) {
            reject(new Error('Invalid response format'));
          }
        } else {
          try {
            const errorData = JSON.parse(xhr.responseText);
            reject(new Error(errorData.error || `Upload failed with status ${xhr.status}`));
          } catch {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload was aborted'));
      });

      xhr.open('POST', `${BASE_URL}/shipping`);
      xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
      xhr.send(formData);
    });
  }

  /**
   * Update shipping company
   * 
   * @param id - Shipping company ID
   * @param data - Updated shipping company data
   * @param accessToken - User's access token (admin required)
   * @returns Promise<SingleShippingCompanyResponse>
   */
  static async updateShippingCompany(
    id: number,
    data: UpdateShippingCompanyRequest,
    accessToken: string
  ): Promise<SingleShippingCompanyResponse> {
    return this.makeRequest<SingleShippingCompanyResponse>(`/shipping/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }, accessToken);
  }

  /**
   * Delete shipping company
   * 
   * @param id - Shipping company ID
   * @param accessToken - User's access token (admin required)
   * @returns Promise<{ message: string }>
   */
  static async deleteShippingCompany(
    id: number,
    accessToken: string
  ): Promise<{ message: string }> {
    return this.makeRequest<{ message: string }>(`/shipping/${id}`, {
      method: 'DELETE',
    }, accessToken);
  }

  /**
   * Validate file before upload
   * 
   * @param file - File to validate
   * @throws Error if file is invalid
   */
  private static validateFile(file: File): void {
    // Check file size
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error('File size exceeds 10MB limit');
    }

    // Check file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    const supportedType = SUPPORTED_FILE_TYPES.find(type => type.extension === fileExtension);
    
    if (!supportedType) {
      throw new Error(`Unsupported file type. Supported types: ${SUPPORTED_FILE_TYPES.map(t => t.extension).join(', ')}`);
    }

    // Check MIME type
    if (supportedType.mimeType && !file.type.includes(supportedType.mimeType.split('/')[1])) {
      console.warn('MIME type mismatch, but file extension is supported');
    }
  }

  /**
   * Get file upload progress
   * 
   * @param event - Progress event
   * @returns FileUploadProgress
   */
  static getUploadProgress(event: ProgressEvent): FileUploadProgress {
    return {
      loaded: event.loaded,
      total: event.total,
      percentage: event.lengthComputable ? Math.round((event.loaded / event.total) * 100) : 0
    };
  }

  /**
   * Format file size for display
   * 
   * @param bytes - File size in bytes
   * @returns Formatted file size string
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Generate CSV template for shipping companies
   * 
   * @returns CSV content string
   */
  static generateCSVTemplate(): string {
    const headers = ['name', 'description'];
    const sampleData = [
      ['FedEx', 'International courier delivery services'],
      ['DHL', 'German logistics company'],
      ['UPS', 'American multinational shipping company']
    ];

    const csvContent = [
      headers.join(','),
      ...sampleData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csvContent;
  }

  /**
   * Download CSV template
   */
  static downloadCSVTemplate(): void {
    const csvContent = this.generateCSVTemplate();
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'shipping_companies_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}

// Export individual functions for convenience
export const {
  getShippingCompanies,
  getShippingCompany,
  createShippingCompany,
  createMultipleShippingCompanies,
  uploadShippingCompaniesFile,
  updateShippingCompany,
  deleteShippingCompany,
  downloadCSVTemplate,
  formatFileSize
} = ShippingService;
