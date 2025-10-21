"use client";

import React from 'react';
import SettingsLayout from "../_components/SettingsLayout";
import { Settings as SettingsIcon, Package, AlertCircle, RefreshCw, Save, Edit, Check, X, Search } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { getSettings, updateSettings, getBrands, updateBrandMapping, type BrandMapping, type InventoryConfig } from '../../lib/settings/api';
import { Button } from '../../components/ui/button';

export default function GeneralSettingsPage() {
  const { state: authState, isAdmin } = useAuth();
  
  // Settings state
  const [inventoryConfig, setInventoryConfig] = React.useState<InventoryConfig>({ minValue: 5, maxValue: null });
  const [originalInventoryConfig, setOriginalInventoryConfig] = React.useState<InventoryConfig>({ minValue: 5, maxValue: null });
  const [settingsLoading, setSettingsLoading] = React.useState(true);
  const [settingsError, setSettingsError] = React.useState<string | null>(null);
  const [isUpdatingSettings, setIsUpdatingSettings] = React.useState(false);
  
  // Brands state
  const [brands, setBrands] = React.useState<BrandMapping[]>([]);
  const [brandsLoading, setBrandsLoading] = React.useState(true);
  const [brandsError, setBrandsError] = React.useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [editingBrand, setEditingBrand] = React.useState<string | null>(null);
  const [editValue, setEditValue] = React.useState('');
  const [searchTerm, setSearchTerm] = React.useState('');

  // Load general settings
  const loadSettings = React.useCallback(async () => {
    if (!authState.accessToken) {
      setSettingsError('No access token available');
      setSettingsLoading(false);
      return;
    }

    try {
      setSettingsLoading(true);
      setSettingsError(null);
      
      const response = await getSettings(authState.accessToken);
      setInventoryConfig(response.settings.inventoryConfig);
      setOriginalInventoryConfig(response.settings.inventoryConfig);
    } catch (error: any) {
      console.error('Failed to load settings:', error);
      
      if (error.message?.includes('Session expired') || error.message?.includes('Token expired')) {
        window.location.href = '/login';
        return;
      }
      
      setSettingsError(error.message || 'Failed to load settings');
    } finally {
      setSettingsLoading(false);
    }
  }, [authState.accessToken]);

  // Load brands
  const loadBrands = React.useCallback(async () => {
    if (!authState.accessToken) {
      setBrandsError('No access token available');
      setBrandsLoading(false);
      return;
    }

    try {
      setBrandsLoading(true);
      setBrandsError(null);
      
      const response = await getBrands(authState.accessToken);
      setBrands(response.brands || []);
    } catch (error: any) {
      console.error('Failed to load brands:', error);
      
      if (error.message?.includes('Session expired') || error.message?.includes('Token expired')) {
        window.location.href = '/login';
        return;
      }
      
      setBrandsError(error.message || 'Failed to load brands');
    } finally {
      setBrandsLoading(false);
    }
  }, [authState.accessToken]);

  // Load data on component mount
  React.useEffect(() => {
    if (authState.isAuthenticated && authState.accessToken && !authState.isLoading) {
      loadSettings();
      loadBrands();
    }
  }, [loadSettings, loadBrands, authState.isAuthenticated, authState.accessToken, authState.isLoading]);

  // Update general settings
  const handleUpdateSettings = async () => {
    if (!isAdmin()) {
      setSettingsError('Only admins can update settings');
      return;
    }

    if (!authState.accessToken) {
      setSettingsError('No access token available');
      return;
    }

    try {
      setIsUpdatingSettings(true);
      setSettingsError(null);
      
      await updateSettings(inventoryConfig, authState.accessToken);
      setOriginalInventoryConfig(inventoryConfig);
      setSettingsError(null);
      
      // Show success message briefly
      const successDiv = document.getElementById('settings-success');
      if (successDiv) {
        successDiv.classList.remove('hidden');
        setTimeout(() => successDiv.classList.add('hidden'), 3000);
      }
    } catch (error: any) {
      console.error('Failed to update settings:', error);
      setSettingsError(error.message || 'Failed to update settings');
    } finally {
      setIsUpdatingSettings(false);
    }
  };

  // Update brand mapping
  const handleUpdateBrandMapping = async (originalBrand: string, customBrand: string) => {
    if (!isAdmin()) {
      setBrandsError('Only admins can update brand mappings');
      return;
    }

    if (!authState.accessToken) {
      setBrandsError('No access token available');
      return;
    }

    try {
      setBrandsError(null);
      
      const response = await updateBrandMapping(originalBrand, customBrand, authState.accessToken);
      console.log('Brand mapping updated:', response);
      
      // Refresh brands list
      await loadBrands();
      setEditingBrand(null);
      
      // Show success message
      const successDiv = document.getElementById('brands-success');
      if (successDiv) {
        const messageSpan = successDiv.querySelector('span');
        if (messageSpan) {
          messageSpan.textContent = response.note || `Brand mapping updated: "${originalBrand}" → "${customBrand}"`;
        }
        successDiv.classList.remove('hidden');
        setTimeout(() => successDiv.classList.add('hidden'), 5000);
      }
    } catch (error: any) {
      console.error('Failed to update brand mapping:', error);
      setBrandsError(error.message || 'Failed to update brand mapping');
    }
  };

  // Start editing a brand
  const startEditingBrand = (brand: BrandMapping) => {
    setEditingBrand(brand.originalBrand);
    setEditValue(brand.customBrand);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingBrand(null);
    setEditValue('');
  };

  // Save edited brand
  const saveEditedBrand = async (originalBrand: string) => {
    if (editValue.trim() === '') {
      setBrandsError('Custom brand name cannot be empty');
      return;
    }
    
    await handleUpdateBrandMapping(originalBrand, editValue.trim());
  };

  // Refresh brands
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadBrands();
    setIsRefreshing(false);
  };

  // Filter brands based on search term
  const filteredBrands = brands.filter(brand =>
    brand.originalBrand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    brand.customBrand.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Count changed brands
  const changedBrandsCount = brands.filter(b => b.isChanged).length;

  // Check if settings have changed
  const settingsChanged = JSON.stringify(inventoryConfig) !== JSON.stringify(originalInventoryConfig);

  return (
    <SettingsLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
              <SettingsIcon size={28} className="text-indigo-600" />
              General Settings
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Manage inventory configuration and brand name mappings
            </p>
          </div>
        </div>

        {/* Section 1: Inventory Configuration */}
        <div className="bg-white border rounded-lg shadow-sm">
          <div className="border-b p-4">
            <h3 className="text-lg font-semibold text-gray-900">Inventory Configuration</h3>
            <p className="text-sm text-gray-600 mt-1">Configure minimum inventory thresholds</p>
          </div>
          
          <div className="p-6">
            {settingsLoading ? (
              <div className="text-center py-8">
                <div className="loader mx-auto mb-4"></div>
                <div className="text-gray-600">Loading settings...</div>
              </div>
            ) : settingsError ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                <AlertCircle size={20} className="text-red-500 flex-shrink-0" />
                <div>
                  <div className="text-red-800 font-medium">Error</div>
                  <div className="text-red-700 text-sm">{settingsError}</div>
                </div>
                <button
                  onClick={() => setSettingsError(null)}
                  className="ml-auto text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </div>
            ) : (
              <>
                <div id="settings-success" className="hidden bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3 mb-4">
                  <Check size={20} className="text-green-500 flex-shrink-0" />
                  <div className="text-green-800 font-medium">Settings updated successfully!</div>
                </div>

                <div className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Inventory Value
                    </label>
                    <input
                      type="number"
                      value={inventoryConfig.minValue}
                      onChange={(e) => setInventoryConfig({ ...inventoryConfig, minValue: Number(e.target.value) })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Enter minimum value"
                      disabled={!isAdmin()}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Set the minimum inventory threshold for alerts
                    </p>
                  </div>

                  {isAdmin() && settingsChanged && (
                    <Button
                      onClick={handleUpdateSettings}
                      disabled={isUpdatingSettings}
                      variant="default"
                      className="w-full"
                    >
                      <Save size={16} className="mr-2" />
                      {isUpdatingSettings ? 'Updating...' : 'Save Changes'}
                    </Button>
                  )}

                  {!isAdmin() && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                      <AlertCircle size={16} className="inline mr-2" />
                      Only administrators can modify settings
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Section 2: Brand Name Mappings */}
        <div className="bg-white border rounded-lg shadow-sm">
          <div className="border-b p-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Package size={20} className="text-indigo-600" />
                Brand Name Mappings
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Map original brand names to custom brand names. Changes apply to all listings.
              </p>
            </div>
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing}
              variant="outline"
              size="sm"
            >
              <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            </Button>
          </div>
          
          <div className="p-6">
            {brandsLoading ? (
              <div className="text-center py-8">
                <div className="loader mx-auto mb-4"></div>
                <div className="text-gray-600">Loading brands...</div>
              </div>
            ) : brandsError ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                <AlertCircle size={20} className="text-red-500 flex-shrink-0" />
                <div>
                  <div className="text-red-800 font-medium">Error</div>
                  <div className="text-red-700 text-sm">{brandsError}</div>
                </div>
                <button
                  onClick={() => setBrandsError(null)}
                  className="ml-auto text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </div>
            ) : (
              <>
                <div id="brands-success" className="hidden bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3 mb-4">
                  <Check size={20} className="text-green-500 flex-shrink-0" />
                  <span className="text-green-800 font-medium"></span>
                </div>

                {/* Search Bar */}
                <div className="mb-4">
                  <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                      placeholder="Search brands..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {filteredBrands.length} brand{filteredBrands.length !== 1 ? 's' : ''} 
                    {searchTerm && ` (filtered from ${brands.length})`}
                    {!searchTerm && ` • ${changedBrandsCount} modified`}
                  </p>
                </div>

                {/* Brands Table */}
                {filteredBrands.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Original Brand
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Custom Brand
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            {isAdmin() && (
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                              </th>
                            )}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredBrands.map((brand, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {brand.originalBrand}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {editingBrand === brand.originalBrand ? (
                                  <input
                                    type="text"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    className="w-full border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        saveEditedBrand(brand.originalBrand);
                                      } else if (e.key === 'Escape') {
                                        cancelEditing();
                                      }
                                    }}
                                    autoFocus
                                  />
                                ) : (
                                  <span className={brand.isChanged ? 'text-indigo-600 font-medium' : 'text-gray-900'}>
                                    {brand.customBrand}
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {brand.isChanged ? (
                                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800">
                                    Modified
                                  </span>
                                ) : (
                                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                                    Original
                                  </span>
                                )}
                              </td>
                              {isAdmin() && (
                                <td className="px-4 py-3 text-sm">
                                  {editingBrand === brand.originalBrand ? (
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => saveEditedBrand(brand.originalBrand)}
                                        className="p-1 hover:bg-green-100 rounded text-green-600"
                                        title="Save"
                                      >
                                        <Check size={16} />
                                      </button>
                                      <button
                                        onClick={cancelEditing}
                                        className="p-1 hover:bg-red-100 rounded text-red-600"
                                        title="Cancel"
                                      >
                                        <X size={16} />
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => startEditingBrand(brand)}
                                      className="p-1 hover:bg-gray-100 rounded text-gray-600"
                                      title="Edit brand mapping"
                                    >
                                      <Edit size={16} />
                                    </button>
                                  )}
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Package size={48} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No brands found</h3>
                    <p className="text-gray-600">
                      {searchTerm 
                        ? 'No brands match your search criteria.' 
                        : 'No brand mappings are available.'}
                    </p>
                  </div>
                )}

                {!isAdmin() && brands.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800 mt-4">
                    <AlertCircle size={16} className="inline mr-2" />
                    Only administrators can modify brand mappings
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </SettingsLayout>
  );
}

