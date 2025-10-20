"use client";

import React from 'react';
import SettingsLayout from "../_components/SettingsLayout";
import { Package, Plus, Edit, Trash2, AlertCircle, RefreshCw, Upload, FileText, Download, Info, Search } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { BrandsService, BrandsUtils, type Brand } from '../../lib/brands/api';
import { Button } from '../../components/ui/button';
import UnifiedAddNew from '../../components/UnifiedAddNew';
import DeleteConfirmationModal from '../../components/DeleteConfirmationModal';

export default function BrandsPage() {
  const { state: authState, isAdmin } = useAuth();
  
  // API data state
  const [brands, setBrands] = React.useState<Brand[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  
  // UI state
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [showEditModal, setShowEditModal] = React.useState(false);
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [showBulkModal, setShowBulkModal] = React.useState(false);
  const [showUploadModal, setShowUploadModal] = React.useState(false);
  const [selectedBrand, setSelectedBrand] = React.useState<Brand | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [uploadFile, setUploadFile] = React.useState<File | null>(null);
  const [bulkBrands, setBulkBrands] = React.useState<Array<{name: string, description: string}>>([]);
  const [bulkResults, setBulkResults] = React.useState<any>(null);
  
  // Form state
  const [formData, setFormData] = React.useState({
    name: '',
    description: ''
  });

  // Search state
  const [searchTerm, setSearchTerm] = React.useState('');

  // Load brands from API
  const loadBrands = React.useCallback(async () => {
    if (!authState.accessToken) {
      setError('No access token available');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await BrandsService.getAllBrands(authState.accessToken);
      console.log('🔍 Brands response:', response);
      setBrands(response.brands);
    } catch (error: any) {
      console.error('Failed to load brands:', error);
      
      // Provide more specific error messages based on error type
      let errorMessage = 'Failed to load brands';
      
      if (error.message?.includes('Session expired') || error.message?.includes('Token expired') || error.message?.includes('Token refresh failed')) {
        // Handle token expiration by redirecting to login
        window.location.href = '/login';
        return;
      } else if (error.message?.includes('Authentication required')) {
        errorMessage = 'Your session has expired. Please log in again.';
      } else if (error.message?.includes('Access denied')) {
        errorMessage = 'You do not have permission to view brands.';
      } else {
        errorMessage = error.message || 'Failed to load brands';
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [authState.accessToken]);

  // Load brands on component mount
  React.useEffect(() => {
    if (authState.isAuthenticated && authState.accessToken && !authState.isLoading) {
      loadBrands();
    }
  }, [loadBrands, authState.isAuthenticated, authState.accessToken, authState.isLoading]);

  // Create brand
  const handleCreateBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authState.accessToken || !isAdmin()) return;

    try {
      setIsSubmitting(true);
      await BrandsService.createBrand(formData, authState.accessToken);
      setShowCreateModal(false);
      setFormData({ name: '', description: '' });
      loadBrands(); // Refresh the list
    } catch (error: any) {
      console.error('Failed to create brand:', error);
      setError(error.message || 'Failed to create brand');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update brand
  const handleUpdateBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authState.accessToken || !isAdmin() || !selectedBrand) return;

    try {
      setIsSubmitting(true);
      await BrandsService.updateBrand(selectedBrand.id, formData, authState.accessToken);
      setShowEditModal(false);
      setSelectedBrand(null);
      setFormData({ name: '', description: '' });
      loadBrands(); // Refresh the list
    } catch (error: any) {
      console.error('Failed to update brand:', error);
      setError(error.message || 'Failed to update brand');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete brand
  const handleDeleteBrand = async () => {
    if (!authState.accessToken || !isAdmin() || !selectedBrand) return;

    try {
      setIsSubmitting(true);
      await BrandsService.deleteBrand(selectedBrand.id, authState.accessToken);
      setShowDeleteModal(false);
      setSelectedBrand(null);
      loadBrands(); // Refresh the list
    } catch (error: any) {
      console.error('Failed to delete brand:', error);
      setError(error.message || 'Failed to delete brand');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open edit modal
  const openEditModal = (brand: Brand) => {
    setSelectedBrand(brand);
    setFormData({
      name: brand.name,
      description: brand.description
    });
    setShowEditModal(true);
  };

  // Open delete modal
  const openDeleteModal = (brand: Brand) => {
    setSelectedBrand(brand);
    setShowDeleteModal(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({ name: '', description: '' });
    setSelectedBrand(null);
  };

  // Add brand to bulk list
  const addBulkBrand = () => {
    if (formData.name.trim()) {
      setBulkBrands([...bulkBrands, { name: formData.name.trim(), description: formData.description.trim() }]);
      setFormData({ name: '', description: '' });
    }
  };

  // Remove brand from bulk list
  const removeBulkBrand = (index: number) => {
    setBulkBrands(bulkBrands.filter((_, i) => i !== index));
  };

  // Create multiple brands
  const handleBulkCreate = async () => {
    if (!authState.accessToken || !isAdmin() || bulkBrands.length === 0) return;

    try {
      setIsSubmitting(true);
      const response = await BrandsService.createMultipleBrands({ brands: bulkBrands }, authState.accessToken);
      setBulkResults(response);
      setShowBulkModal(false);
      setBulkBrands([]);
      loadBrands(); // Refresh the list
    } catch (error: any) {
      console.error('Failed to create brands:', error);
      setError(error.message || 'Failed to create brands');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle file upload
  const handleFileUpload = async () => {
    if (!authState.accessToken || !isAdmin() || !uploadFile) return;

    try {
      setIsSubmitting(true);
      console.log('📤 Uploading file:', {
        name: uploadFile.name,
        size: uploadFile.size,
        type: uploadFile.type,
        lastModified: uploadFile.lastModified
      });
      
      const response = await BrandsService.uploadBrandsFromFile(uploadFile, authState.accessToken);
      console.log('✅ Upload successful:', response);
      setBulkResults(response);
      setShowUploadModal(false);
      setUploadFile(null);
      loadBrands(); // Refresh the list
    } catch (error: any) {
      console.error('❌ Failed to upload brands:', error);
      setError(error.message || 'Failed to upload brands');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      
      if (!allowedTypes.includes(file.type) && !file.name.match(/\.(csv|xls|xlsx)$/i)) {
        setError('Please select a valid CSV or Excel file (.csv, .xls, .xlsx)');
        return;
      }
      
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      
      setUploadFile(file);
      setError(null);
    }
  };

  // Download sample CSV
  const downloadSampleCSV = () => {
    const csvContent = "name,description\nNike,Sports and athletic wear brand\nAdidas,German multinational corporation\nPuma,Athletic and casual footwear";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'brands_sample.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Filter brands based on search term
  const filteredBrands = brands.filter(brand =>
    brand.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    brand.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <SettingsLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Brands</h2>
            <p className="text-sm text-gray-600 mt-1">
              {filteredBrands.length} brand{filteredBrands.length !== 1 ? 's' : ''} total
              {searchTerm && ` (filtered from ${brands.length})`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="   Search brands..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-soft pl-10 pr-4 py-2 w-64"
              />
            </div>
            <Button
              onClick={loadBrands}
              disabled={isLoading}
              variant="outline"
              size="sm"
              title="Refresh brands"
            >
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
              <span className="hidden pl-1 sm:inline">Refresh</span>
            </Button>
            {isAdmin() && (
              <UnifiedAddNew
                platformType="brands"
                onAddBrand={() => setShowCreateModal(true)}
                onBulkAddBrand={() => setShowBulkModal(true)}
                onImportBrand={() => setShowUploadModal(true)}
              />
            )}
          </div>
        </div>


        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle size={20} className="text-red-500 flex-shrink-0" />
            <div>
              <div className="text-red-800 font-medium">Error</div>
              <div className="text-red-700 text-sm">{error}</div>
            </div>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="bg-white border rounded p-8 text-center">
            <div className="loader mx-auto mb-4"></div>
            <div className="text-gray-600">Loading brands...</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBrands.map((brand) => (
              <div key={brand.id} className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${BrandsUtils.getBrandColor(brand.name)}`}>
                      <Package className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{brand.name}</h3>
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        Active
                      </span>
                    </div>
                  </div>
                  {isAdmin() && (
                    <div className="flex gap-1">
                      <button 
                        onClick={() => openEditModal(brand)}
                        className="p-1 hover:bg-gray-100 rounded"
                        title="Edit brand"
                      >
                        <Edit size={16} className="text-gray-500" />
                      </button>
                      <button 
                        onClick={() => openDeleteModal(brand)}
                        className="p-1 hover:bg-red-100 rounded"
                        title="Delete brand"
                      >
                        <Trash2 size={16} className="text-red-500" />
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm text-gray-600">
                    {brand.description || 'No description'}
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Created: {BrandsUtils.formatDate(brand.createdAt)}</span>
                    <span>{BrandsUtils.getRelativeTime(brand.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))}
            
            {filteredBrands.length === 0 && !isLoading && (
              <div className="col-span-full text-center py-12">
                <Package size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No brands found</h3>
                <p className="text-gray-600">
                  {searchTerm 
                    ? 'No brands match your search criteria.' 
                    : isAdmin() 
                      ? 'Get started by adding your first brand.' 
                      : 'No brands are available to you.'
                  }
                </p>
              </div>
            )}
          </div>
        )}

        {/* Create Brand Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Brand</h3>
              <form onSubmit={handleCreateBrand} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Brand Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    rows={3}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => {setShowCreateModal(false); resetForm();}}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Creating...' : 'Create Brand'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Brand Modal */}
        {showEditModal && selectedBrand && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Brand</h3>
              <form onSubmit={handleUpdateBrand} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Brand Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    rows={3}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => {setShowEditModal(false); resetForm();}}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Updating...' : 'Update Brand'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Brand Modal */}
        <DeleteConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedBrand(null);
          }}
          onConfirm={handleDeleteBrand}
          title="Delete Brand"
          itemName={selectedBrand?.name || ''}
          itemType="Brand"
          confirmationText={selectedBrand?.name || ''}
          isDeleting={isSubmitting}
          warningMessage="This will permanently delete the brand and all associated data."
          additionalInfo={selectedBrand ? [
            { label: 'Description', value: selectedBrand.description },
            { label: 'ID', value: selectedBrand.id.toString() }
          ] : []}
        />

        {/* Bulk Create Modal */}
        {showBulkModal && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Bulk Add Brands</h3>
              
              {/* Add Brand Form */}
              <div className="border rounded-lg p-4 mb-4">
                <h4 className="font-medium text-gray-900 mb-3">Add Brand to List</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Brand Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Enter brand name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Enter description (optional)"
                    />
                  </div>
                </div>
                <button
                  onClick={addBulkBrand}
                  disabled={!formData.name.trim()}
                  className="mt-3 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
                >
                  Add to List
                </button>
              </div>

              {/* Brands List */}
              {bulkBrands.length > 0 && (
                <div className="border rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-gray-900 mb-3">Brands to Create ({bulkBrands.length})</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {bulkBrands.map((brand, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <div>
                          <span className="font-medium">{brand.name}</span>
                          {brand.description && (
                            <span className="text-sm text-gray-600 ml-2">- {brand.description}</span>
                          )}
                        </div>
                        <button
                          onClick={() => removeBulkBrand(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {setShowBulkModal(false); setBulkBrands([]); resetForm();}}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkCreate}
                  disabled={isSubmitting || bulkBrands.length === 0}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : `Create ${bulkBrands.length} Brands`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* File Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Import Brands from File</h3>
              
              {/* File Requirements */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <Info size={20} className="text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900 mb-2">File Requirements</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• <strong>Supported formats:</strong> CSV, Excel (.xls, .xlsx)</li>
                      <li>• <strong>File size limit:</strong> 10MB maximum</li>
                      <li>• <strong>Required columns:</strong> name (mandatory), description (optional)</li>
                      <li>• <strong>CSV format:</strong> First row should contain column headers</li>
                      <li>• <strong>Excel format:</strong> Column A = name, Column B = description</li>
                      <li>• <strong>Upload method:</strong> Files are uploaded using multipart/form-data</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Sample Download */}
              <div className="mb-4">
                <button
                  onClick={downloadSampleCSV}
                  className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 text-sm"
                >
                  <Download size={16} />
                  Download Sample CSV
                </button>
              </div>

              {/* File Upload */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept=".csv,.xls,.xlsx"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <Upload size={32} className="text-gray-400" />
                  <span className="text-gray-600">
                    {uploadFile ? uploadFile.name : 'Click to select file or drag and drop'}
                  </span>
                  <span className="text-sm text-gray-500">
                    CSV, Excel files up to 10MB
                  </span>
                </label>
              </div>

              <div className="flex gap-2 justify-end mt-6">
                <button
                  onClick={() => {setShowUploadModal(false); setUploadFile(null); setError(null);}}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFileUpload}
                  disabled={isSubmitting || !uploadFile}
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Uploading...' : 'Upload File'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Results Modal */}
        {bulkResults && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Bulk Operation Results</h3>
              
              {/* Summary */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-gray-900 mb-2">Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Total:</span>
                    <span className="ml-1 font-medium">{bulkResults.summary.total}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Created:</span>
                    <span className="ml-1 font-medium text-green-600">{bulkResults.summary.created}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Duplicates:</span>
                    <span className="ml-1 font-medium text-yellow-600">{bulkResults.summary.duplicates}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Errors:</span>
                    <span className="ml-1 font-medium text-red-600">{bulkResults.summary.errors}</span>
                  </div>
                </div>
              </div>

              {/* Created Brands */}
              {bulkResults.results.created.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Successfully Created</h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {bulkResults.results.created.map((brand: Brand, index: number) => (
                      <div key={index} className="flex items-center justify-between bg-green-50 p-2 rounded">
                        <span className="text-green-800">{brand.name}</span>
                        <span className="text-xs text-green-600">✓ Created</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Duplicates */}
              {bulkResults.results.duplicates.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Duplicates Found</h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {bulkResults.results.duplicates.map((dup: any, index: number) => (
                      <div key={index} className="flex items-center justify-between bg-yellow-50 p-2 rounded">
                        <span className="text-yellow-800">{dup.name}</span>
                        <span className="text-xs text-yellow-600">⚠ {dup.error}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Errors */}
              {bulkResults.results.errors.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Errors</h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {bulkResults.results.errors.map((error: any, index: number) => (
                      <div key={index} className="flex items-center justify-between bg-red-50 p-2 rounded">
                        <span className="text-red-800">Row {error.row}</span>
                        <span className="text-xs text-red-600">✗ {error.error}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={() => setBulkResults(null)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </SettingsLayout>
  );
}
