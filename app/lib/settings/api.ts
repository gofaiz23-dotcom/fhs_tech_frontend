import httpClient from '../auth/httpClient';

// Types for Settings API
export interface InventoryConfig {
  minValue: number;
  maxValue?: number | null;
}

export interface Setting {
  id: number;
  inventoryConfig: InventoryConfig;
  createdAt: string;
  updatedAt: string;
}

export interface SettingsResponse {
  message: string;
  timestamp: string;
  settings: Setting;
}

export interface BrandMapping {
  originalBrand: string;
  customBrand: string;
  isChanged: boolean;
}

export interface BrandsResponse {
  message: string;
  timestamp: string;
  totalBrands: number;
  brands: BrandMapping[];
}

export interface UpdateBrandResponse {
  message: string;
  timestamp: string;
  originalBrand: string;
  customBrand: string;
  allMappings: Record<string, string>;
  note: string;
}

// API 1: Get all settings
export const getSettings = async (accessToken?: string): Promise<SettingsResponse> => {
  try {
    const response = await httpClient.get<SettingsResponse>('/settings', {}, accessToken);
    return response;
  } catch (error: unknown) {
    console.error('Error fetching settings:', error);
    throw error;
  }
};

// API 2: Update settings (Admin only)
export const updateSettings = async (
  inventoryConfig: InventoryConfig,
  accessToken?: string
): Promise<SettingsResponse> => {
  try {
    const response = await httpClient.put<SettingsResponse>(
      '/settings',
      { inventoryConfig },
      {},
      accessToken
    );
    return response;
  } catch (error: unknown) {
    console.error('Error updating settings:', error);
    throw error;
  }
};

// API 3: Get all brands from listings
export const getBrands = async (accessToken?: string): Promise<BrandsResponse> => {
  try {
    const response = await httpClient.get<BrandsResponse>('/settings/brands', {}, accessToken);
    return response;
  } catch (error: unknown) {
    console.error('Error fetching brands:', error);
    throw error;
  }
};

// API 4: Update brand mappings and apply to all listings (Admin only)
export const updateBrandMapping = async (
  originalBrand: string,
  customBrand: string,
  accessToken?: string
): Promise<UpdateBrandResponse> => {
  try {
    const response = await httpClient.put<UpdateBrandResponse>(
      '/settings/brands',
      {
        originalBrand,
        customBrand,
      },
      {},
      accessToken
    );
    return response;
  } catch (error: unknown) {
    console.error('Error updating brand mapping:', error);
    throw error;
  }
};

