"use client";

import React from 'react';
import SettingsLayout from "../_components/SettingsLayout";
import { Store, Plus, Edit, Trash2, Loader2, AlertCircle, RefreshCw, Upload, FileText, Download, Info, Search } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { MarketplacesService, MarketplacesUtils, type Marketplace } from '../../lib/marketplaces/api';
import { Button } from '../../components/ui/button';
import UnifiedAddNew from '../../components/UnifiedAddNew';
import DeleteConfirmationModal from '../../components/DeleteConfirmationModal';

export default function MarketplacesPage() {
  const { state: authState, isAdmin } = useAuth();
  
  // API data state
  const [marketplaces, setMarketplaces] = React.useState<Marketplace[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  
  // UI state
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [showEditModal, setShowEditModal] = React.useState(false);
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [showBulkModal, setShowBulkModal] = React.useState(false);
  const [showUploadModal, setShowUploadModal] = React.useState(false);
  const [selectedMarketplace, setSelectedMarketplace] = React.useState<Marketplace | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [uploadFile, setUploadFile] = React.useState<File | null>(null);
  const [bulkMarketplaces, setBulkMarketplaces] = React.useState<Array<{name: string, description: string}>>([]);
  const [bulkResults, setBulkResults] = React.useState<any>(null);
  
  // Form state
  const [formData, setFormData] = React.useState({
    name: '',
    description: ''
  });

  // Search state
  const [searchTerm, setSearchTerm] = React.useState('');

  // Load marketplaces from API
  const loadMarketplaces = React.useCallback(async () => {
    if (!authState.accessToken) {
      setError('No access token available');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await MarketplacesService.getAllMarketplaces(authState.accessToken);
      console.log('🔍 Marketplaces response:', response);
      setMarketplaces(response.marketplaces);
    } catch (error: any) {
      console.error('Failed to load marketplaces:', error);
      
      // Provide more specific error messages based on error type
      let errorMessage = 'Failed to load marketplaces';
      
      if (error.message?.includes('Session expired') || error.message?.includes('Token expired') || error.message?.includes('Token refresh failed')) {
        // Handle token expiration by redirecting to login
        window.location.href = '/login';
        return;
      } else if (error.message?.includes('Authentication required')) {
        errorMessage = 'Your session has expired. Please log in again.';
      } else if (error.message?.includes('Access denied')) {
        errorMessage = 'You do not have permission to view marketplaces.';
      } else {
        errorMessage = error.message || 'Failed to load marketplaces';
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [authState.accessToken]);

  // Load marketplaces on component mount
  React.useEffect(() => {
    if (authState.isAuthenticated && authState.accessToken && !authState.isLoading) {
      loadMarketplaces();
    }
  }, [loadMarketplaces, authState.isAuthenticated, authState.accessToken, authState.isLoading]);

  // Create marketplace
  const handleCreateMarketplace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authState.accessToken || !isAdmin()) return;

    try {
      setIsSubmitting(true);
      await MarketplacesService.createMarketplace(formData, authState.accessToken);
      setShowCreateModal(false);
      setFormData({ name: '', description: '' });
      loadMarketplaces(); // Refresh the list
    } catch (error: any) {
      console.error('Failed to create marketplace:', error);
      setError(error.message || 'Failed to create marketplace');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update marketplace
  const handleUpdateMarketplace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authState.accessToken || !isAdmin() || !selectedMarketplace) return;

    try {
      setIsSubmitting(true);
      await MarketplacesService.updateMarketplace(selectedMarketplace.id, formData, authState.accessToken);
      setShowEditModal(false);
      setSelectedMarketplace(null);
      setFormData({ name: '', description: '' });
      loadMarketplaces(); // Refresh the list
    } catch (error: any) {
      console.error('Failed to update marketplace:', error);
      setError(error.message || 'Failed to update marketplace');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete marketplace
  const handleDeleteMarketplace = async () => {
    if (!authState.accessToken || !isAdmin() || !selectedMarketplace) return;

    try {
      setIsSubmitting(true);
      await MarketplacesService.deleteMarketplace(selectedMarketplace.id, authState.accessToken);
      setShowDeleteModal(false);
      setSelectedMarketplace(null);
      loadMarketplaces(); // Refresh the list
    } catch (error: any) {
      console.error('Failed to delete marketplace:', error);
      setError(error.message || 'Failed to delete marketplace');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open edit modal
  const openEditModal = (marketplace: Marketplace) => {
    setSelectedMarketplace(marketplace);
    setFormData({
      name: marketplace.name,
      description: marketplace.description
    });
    setShowEditModal(true);
  };

  // Open delete modal
  const openDeleteModal = (marketplace: Marketplace) => {
    setSelectedMarketplace(marketplace);
    setShowDeleteModal(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({ name: '', description: '' });
    setSelectedMarketplace(null);
  };

  // Add marketplace to bulk list
  const addBulkMarketplace = () => {
    if (formData.name.trim()) {
      setBulkMarketplaces([...bulkMarketplaces, { name: formData.name.trim(), description: formData.description.trim() }]);
      setFormData({ name: '', description: '' });
    }
  };

  // Remove marketplace from bulk list
  const removeBulkMarketplace = (index: number) => {
    setBulkMarketplaces(bulkMarketplaces.filter((_, i) => i !== index));
  };

  // Create multiple marketplaces
  const handleBulkCreate = async () => {
    if (!authState.accessToken || !isAdmin() || bulkMarketplaces.length === 0) return;

    try {
      setIsSubmitting(true);
      const response = await MarketplacesService.createMultipleMarketplaces({ marketplaces: bulkMarketplaces }, authState.accessToken);
      setBulkResults(response);
      setShowBulkModal(false);
      setBulkMarketplaces([]);
      loadMarketplaces(); // Refresh the list
    } catch (error: any) {
      console.error('Failed to create marketplaces:', error);
      setError(error.message || 'Failed to create marketplaces');
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
      
      const response = await MarketplacesService.uploadMarketplacesFromFile(uploadFile, authState.accessToken);
      console.log('✅ Upload successful:', response);
      setBulkResults(response);
      setShowUploadModal(false);
      setUploadFile(null);
      loadMarketplaces(); // Refresh the list
    } catch (error: any) {
      console.error('❌ Failed to upload marketplaces:', error);
      setError(error.message || 'Failed to upload marketplaces');
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
    const csvContent = "name,description\nAmazon,Global e-commerce platform\nFlipkart,Indian e-commerce company\nMyntra,Fashion e-commerce platform";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'marketplaces_sample.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Filter marketplaces based on search term
  const filteredMarketplaces = marketplaces.filter(marketplace =>
    marketplace.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    marketplace.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <SettingsLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Marketplaces</h2>
            <p className="text-sm text-gray-600 mt-1">
              Manage your marketplace integrations and connections
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={loadMarketplaces}
              disabled={isLoading}
              variant="outline"
              size="sm"
              title="Refresh marketplaces"
            >
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
              Refresh
            </Button>
            {isAdmin() && (
              <UnifiedAddNew
                platformType="marketplace"
                onAddMarketplace={() => setShowCreateModal(true)}
                onBulkAddMarketplace={() => setShowBulkModal(true)}
                onImportMarketplace={() => setShowUploadModal(true)}
              />
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search marketplaces..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
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
            <Loader2 size={32} className="animate-spin mx-auto mb-4 text-blue-600" />
            <div className="text-gray-600">Loading marketplaces...</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMarketplaces.map((marketplace) => (
              <div key={marketplace.id} className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${MarketplacesUtils.getMarketplaceColor(marketplace.name)}`}>
                      <Store className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{marketplace.name}</h3>
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        Active
                      </span>
                    </div>
                  </div>
                  {isAdmin() && (
                    <div className="flex gap-1">
                      <button 
                        onClick={() => openEditModal(marketplace)}
                        className="p-1 hover:bg-gray-100 rounded"
                        title="Edit marketplace"
                      >
                        <Edit size={16} className="text-gray-500" />
                      </button>
                      <button 
                        onClick={() => openDeleteModal(marketplace)}
                        className="p-1 hover:bg-red-100 rounded"
                        title="Delete marketplace"
                      >
                        <Trash2 size={16} className="text-red-500" />
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm text-gray-600">
                    {marketplace.description || 'No description'}
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Created: {MarketplacesUtils.formatDate(marketplace.createdAt)}</span>
                    <span>{MarketplacesUtils.getRelativeTime(marketplace.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))}
            
            {filteredMarketplaces.length === 0 && !isLoading && (
              <div className="col-span-full text-center py-12">
                <Store size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No marketplaces found</h3>
                <p className="text-gray-600">
                  {searchTerm 
                    ? 'No marketplaces match your search criteria.' 
                    : isAdmin() 
                      ? 'Get started by adding your first marketplace.' 
                      : 'No marketplaces are available to you.'
                  }
                </p>
              </div>
            )}
          </div>
        )}

        {/* Create Marketplace Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Marketplace</h3>
              <form onSubmit={handleCreateMarketplace} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Marketplace Name</label>
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
                  <Button
                    type="button"
                    onClick={() => {setShowCreateModal(false); resetForm();}}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    variant="default"
                  >
                    {isSubmitting ? 'Creating...' : 'Create Marketplace'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Marketplace Modal */}
        {showEditModal && selectedMarketplace && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Marketplace</h3>
              <form onSubmit={handleUpdateMarketplace} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Marketplace Name</label>
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
                  <Button
                    type="button"
                    onClick={() => {setShowEditModal(false); resetForm();}}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    variant="default"
                  >
                    {isSubmitting ? 'Updating...' : 'Update Marketplace'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Marketplace Modal */}
        <DeleteConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedMarketplace(null);
          }}
          onConfirm={handleDeleteMarketplace}
          title="Delete Marketplace"
          itemName={selectedMarketplace?.name || ''}
          itemType="Marketplace"
          confirmationText={selectedMarketplace?.name || ''}
          isDeleting={isSubmitting}
          warningMessage="This will permanently delete the marketplace and all associated data."
          additionalInfo={selectedMarketplace ? [
            { label: 'Description', value: selectedMarketplace.description },
            { label: 'ID', value: selectedMarketplace.id.toString() }
          ] : []}
        />

        {/* Bulk Create Modal */}
        {showBulkModal && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Bulk Add Marketplaces</h3>
              
              {/* Add Marketplace Form */}
              <div className="border rounded-lg p-4 mb-4">
                <h4 className="font-medium text-gray-900 mb-3">Add Marketplace to List</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Marketplace Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Enter marketplace name"
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
                  onClick={addBulkMarketplace}
                  disabled={!formData.name.trim()}
                  className="mt-3 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
                >
                  Add to List
                </button>
              </div>

              {/* Marketplaces List */}
              {bulkMarketplaces.length > 0 && (
                <div className="border rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-gray-900 mb-3">Marketplaces to Create ({bulkMarketplaces.length})</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {bulkMarketplaces.map((marketplace, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <div>
                          <span className="font-medium">{marketplace.name}</span>
                          {marketplace.description && (
                            <span className="text-sm text-gray-600 ml-2">- {marketplace.description}</span>
                          )}
                        </div>
                        <button
                          onClick={() => removeBulkMarketplace(index)}
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
                  onClick={() => {setShowBulkModal(false); setBulkMarketplaces([]); resetForm();}}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkCreate}
                  disabled={isSubmitting || bulkMarketplaces.length === 0}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : `Create ${bulkMarketplaces.length} Marketplaces`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* File Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Import Marketplaces from File</h3>
              
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

              {/* Created Marketplaces */}
              {bulkResults.results.created.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Successfully Created</h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {bulkResults.results.created.map((marketplace: Marketplace, index: number) => (
                      <div key={index} className="flex items-center justify-between bg-green-50 p-2 rounded">
                        <span className="text-green-800">{marketplace.name}</span>
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
