/**
 * Shipping Company Types
 * 
 * Type definitions for shipping company management including
 * CRUD operations, bulk upload, and API responses.
 */

export interface ShippingCompany {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateShippingCompanyRequest {
  name: string;
  description: string;
}

export interface CreateMultipleShippingCompaniesRequest {
  shippingCompanies: CreateShippingCompanyRequest[];
}

export interface UpdateShippingCompanyRequest {
  name?: string;
  description?: string;
}

export interface ShippingCompaniesResponse {
  message: string;
  shippingCompanies: ShippingCompany[];
}

export interface SingleShippingCompanyResponse {
  message: string;
  shippingCompany: ShippingCompany;
}

export interface BulkUploadResponse {
  message: string;
  summary: {
    total: number;
    created: number;
    duplicates: number;
    errors: number;
  };
  results: {
    created: ShippingCompany[];
    duplicates: Array<{
      name: string;
      error: string;
    }>;
    errors: Array<{
      row: number;
      error: string;
    }>;
  };
}

export interface ShippingCompanyFormData {
  name: string;
  description: string;
}

export interface BulkUploadFormData {
  file: File;
}

export interface ShippingCompanyFilters {
  search?: string;
  sortBy?: 'name' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface ShippingCompanyStats {
  total: number;
  active: number;
  inactive: number;
  recentlyAdded: number;
}

// Error types
export interface ShippingApiError {
  error: string;
  details?: string;
  code?: number;
}

// File upload types
export interface FileUploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface SupportedFileType {
  extension: string;
  mimeType: string;
  maxSize: number; // in bytes
}

export const SUPPORTED_FILE_TYPES: SupportedFileType[] = [
  {
    extension: '.csv',
    mimeType: 'text/csv',
    maxSize: 10 * 1024 * 1024, // 10MB
  },
  {
    extension: '.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    maxSize: 10 * 1024 * 1024, // 10MB
  },
  {
    extension: '.xls',
    mimeType: 'application/vnd.ms-excel',
    maxSize: 10 * 1024 * 1024, // 10MB
  },
];

// Popular shipping companies for reference
export const POPULAR_SHIPPING_COMPANIES: CreateShippingCompanyRequest[] = [
  {
    name: 'FedEx',
    description: 'International courier delivery services'
  },
  {
    name: 'DHL',
    description: 'German logistics company'
  },
  {
    name: 'UPS',
    description: 'American multinational shipping company'
  },
  {
    name: 'USPS',
    description: 'United States Postal Service'
  },
  {
    name: 'Blue Dart',
    description: 'Indian courier delivery company'
  },
  {
    name: 'DTDC',
    description: 'Indian courier and cargo company'
  },
  {
    name: 'Delhivery',
    description: 'Indian logistics and supply chain company'
  },
  {
    name: 'Ecom Express',
    description: 'Indian e-commerce logistics company'
  },
  {
    name: 'TNT',
    description: 'Dutch courier delivery services'
  },
  {
    name: 'Aramex',
    description: 'Emirati multinational logistics company'
  }
];
