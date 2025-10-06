"use client";

import React, { useState, useEffect } from 'react';
import SettingsLayout from "../_components/SettingsLayout";
import { useAuth } from '../../lib/auth/context';
import { ShippingService } from '../../lib/shipping/api';
import { 
  ShippingCompany, 
  CreateShippingCompanyRequest,
  CreateMultipleShippingCompaniesRequest,
  BulkUploadResponse,
  FileUploadProgress,
  SUPPORTED_FILE_TYPES,
  POPULAR_SHIPPING_COMPANIES
} from '../../lib/shipping/types';
import { 
  Truck, 
  Plus, 
  Edit, 
  Trash2, 
  Upload, 
  Download, 
  Search, 
  Filter,
  AlertCircle,
  CheckCircle,
  X,
  Loader2,
  FileText
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import UnifiedAddNew from '../../components/UnifiedAddNew';
import DeleteConfirmationModal from '../../components/DeleteConfirmationModal';

interface ShippingCompanyFormData {
  name: string;
  description: string;
}

export default function ShippingPage() {
  const { state: { user, accessToken }, isAdmin } = useAuth();
  const [shippingCompanies, setShippingCompanies] = useState<ShippingCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [showBulkAddModal, setShowBulkAddModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<ShippingCompany | null>(null);
  const [formData, setFormData] = useState<ShippingCompanyFormData>({ name: '', description: '' });
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<FileUploadProgress | null>(null);
  const [uploadResult, setUploadResult] = useState<BulkUploadResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bulkCompanies, setBulkCompanies] = useState<CreateShippingCompanyRequest[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<ShippingCompany | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load shipping companies on component mount
  useEffect(() => {
    loadShippingCompanies();
  }, []);

  const loadShippingCompanies = async () => {
    if (!accessToken) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await ShippingService.getShippingCompanies(accessToken);
      setShippingCompanies(response.shippingCompanies);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load shipping companies');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCompany = async () => {
    if (!accessToken || !isAdmin()) return;
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      await ShippingService.createShippingCompany(formData, accessToken);
      await loadShippingCompanies();
      setShowAddModal(false);
      setFormData({ name: '', description: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add shipping company');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditCompany = async () => {
    if (!accessToken || !isAdmin() || !editingCompany) return;
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      await ShippingService.updateShippingCompany(editingCompany.id, formData, accessToken);
      await loadShippingCompanies();
      setEditingCompany(null);
      setFormData({ name: '', description: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update shipping company');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCompany = async () => {
    if (!accessToken || !isAdmin() || !companyToDelete) return;
    
    try {
      setIsDeleting(true);
      setError(null);
      await ShippingService.deleteShippingCompany(companyToDelete.id, accessToken);
      await loadShippingCompanies();
      setShowDeleteModal(false);
      setCompanyToDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete shipping company');
    } finally {
      setIsDeleting(false);
    }
  };

  const openDeleteModal = (company: ShippingCompany) => {
    setCompanyToDelete(company);
    setShowDeleteModal(true);
  };

  const handleBulkUpload = async () => {
    if (!accessToken || !isAdmin() || !uploadFile) return;
    
    try {
      setIsSubmitting(true);
      setError(null);
      setUploadResult(null);
      
      const result = await ShippingService.uploadShippingCompaniesFile(
        uploadFile,
        accessToken,
        (progress: FileUploadProgress) => setUploadProgress(progress)
      );
      
      setUploadResult(result);
      await loadShippingCompanies();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file');
    } finally {
      setIsSubmitting(false);
      setUploadProgress(null);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadFile(file);
      setError(null);
    }
  };

  const startEdit = (company: ShippingCompany) => {
    setEditingCompany(company);
    setFormData({ name: company.name, description: company.description });
  };

  const cancelEdit = () => {
    setEditingCompany(null);
    setFormData({ name: '', description: '' });
  };

  const openAddModal = () => {
    setShowAddModal(true);
    setFormData({ name: '', description: '' });
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setFormData({ name: '', description: '' });
  };

  const openBulkUploadModal = () => {
    setShowBulkUploadModal(true);
    setUploadFile(null);
    setUploadResult(null);
    setError(null);
  };

  const closeBulkUploadModal = () => {
    setShowBulkUploadModal(false);
    setUploadFile(null);
    setUploadResult(null);
    setUploadProgress(null);
  };

  const downloadTemplate = () => {
    ShippingService.downloadCSVTemplate();
  };

  const handleBulkAdd = async () => {
    if (!accessToken || !isAdmin() || bulkCompanies.length === 0) return;
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      await ShippingService.createMultipleShippingCompanies(
        { shippingCompanies: bulkCompanies },
        accessToken
      );
      await loadShippingCompanies();
      setShowBulkAddModal(false);
      setBulkCompanies([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add shipping companies');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addBulkCompany = () => {
    setBulkCompanies([...bulkCompanies, { name: '', description: '' }]);
  };

  const removeBulkCompany = (index: number) => {
    setBulkCompanies(bulkCompanies.filter((_, i) => i !== index));
  };

  const updateBulkCompany = (index: number, field: 'name' | 'description', value: string) => {
    const updated = [...bulkCompanies];
    updated[index] = { ...updated[index], [field]: value };
    setBulkCompanies(updated);
  };

  const addPopularCompanies = () => {
    setBulkCompanies([...bulkCompanies, ...POPULAR_SHIPPING_COMPANIES.slice(0, 3)]);
  };

  const filteredCompanies = shippingCompanies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isAdminUser = isAdmin();

  return (
    <SettingsLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Shipping Platforms</h2>
            <p className="text-sm text-gray-600 mt-1">
              Manage your shipping platform integrations
            </p>
          </div>
          {isAdminUser && (
            <UnifiedAddNew
              platformType="shipping"
              onAddShipping={openAddModal}
              onBulkAddShipping={() => setShowBulkAddModal(true)}
              onImportShipping={openBulkUploadModal}
            />
          )}
        </div>

        {/* Search and Filter */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search shipping companies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
            <AlertCircle className="text-red-500" size={20} />
            <span className="text-red-700">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-indigo-600" size={32} />
            <span className="ml-2 text-gray-600">Loading shipping companies...</span>
          </div>
        )}

        {/* Shipping Companies Grid */}
        {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCompanies.map((company) => (
              <div key={company.id} className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-500 flex items-center justify-center">
                    <Truck className="w-5 h-5 text-white" />
                  </div>
                  <div>
                      <h3 className="font-semibold text-gray-900">{company.name}</h3>
                      <p className="text-sm text-gray-600">{company.description}</p>
                    </div>
                  </div>
                  {isAdminUser && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => startEdit(company)}
                        className="p-1 hover:bg-gray-100 rounded"
                        title="Edit"
                      >
                        <Edit size={16} className="text-gray-500" />
                      </button>
                      <button
                        onClick={() => openDeleteModal(company)}
                        className="p-1 hover:bg-red-100 rounded"
                        title="Delete"
                      >
                        <Trash2 size={16} className="text-red-500" />
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Created:</span>
                    <span className="font-medium">
                      {new Date(company.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Updated:</span>
                    <span className="font-medium">
                      {new Date(company.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredCompanies.length === 0 && (
          <div className="text-center py-12">
            <Truck className="mx-auto text-gray-400" size={48} />
            <h3 className="mt-2 text-lg font-medium text-gray-900">No shipping companies found</h3>
            <p className="mt-1 text-gray-500">
              {searchTerm ? 'Try adjusting your search terms' : 'Get started by adding your first shipping company'}
            </p>
            {isAdminUser && !searchTerm && (
              <button
                onClick={openAddModal}
                className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded"
              >
                Add Shipping Company
                  </button>
            )}
          </div>
        )}

        {/* Add/Edit Modal */}
        {(showAddModal || editingCompany) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold mb-4">
                {editingCompany ? 'Edit Shipping Company' : 'Add Shipping Company'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., FedEx"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., International courier delivery services"
                    rows={3}
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={editingCompany ? handleEditCompany : handleAddCompany}
                  disabled={!formData.name || isSubmitting}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-4 py-2 rounded flex items-center justify-center gap-2"
                >
                  {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                  {editingCompany ? 'Update' : 'Add'} Company
                </button>
                <button
                  onClick={editingCompany ? cancelEdit : closeAddModal}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Upload Modal */}
        {showBulkUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4">
              <h3 className="text-lg font-semibold mb-4">Bulk Upload Shipping Companies</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload File (CSV, XLS, XLSX)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      accept=".csv,.xls,.xlsx"
                      onChange={handleFileChange}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer flex flex-col items-center gap-2"
                    >
                      <Upload className="text-gray-400" size={32} />
                      <span className="text-sm text-gray-600">
                        {uploadFile ? uploadFile.name : 'Click to select file'}
                      </span>
                      <span className="text-xs text-gray-500">
                        Max size: 10MB. Supported: CSV, XLS, XLSX
                      </span>
                    </label>
                  </div>
                </div>

                {uploadFile && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText size={16} className="text-gray-500" />
                      <span className="text-sm font-medium">{uploadFile.name}</span>
                      <span className="text-xs text-gray-500">
                        ({ShippingService.formatFileSize(uploadFile.size)})
                      </span>
                    </div>
                    {uploadProgress && (
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress.percentage}%` }}
                        />
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={downloadTemplate}
                    className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
                  >
                    <Download size={16} />
                    Download Template
                  </button>
                </div>

                {uploadResult && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="text-green-500" size={16} />
                      <span className="font-medium text-green-800">Upload Complete</span>
                    </div>
                    <div className="text-sm text-green-700">
                      <p>Total: {uploadResult.summary.total}</p>
                      <p>Created: {uploadResult.summary.created}</p>
                      <p>Duplicates: {uploadResult.summary.duplicates}</p>
                      <p>Errors: {uploadResult.summary.errors}</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleBulkUpload}
                  disabled={!uploadFile || isSubmitting}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded flex items-center justify-center gap-2"
                >
                  {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                  Upload File
                </button>
                <button
                  onClick={closeBulkUploadModal}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Add Modal */}
        {showBulkAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4">Bulk Add Shipping Companies</h3>
              
              <div className="space-y-4">
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={addBulkCompany}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded flex items-center gap-2"
                  >
                    <Plus size={16} />
                    Add Company
                  </button>
                  <button
                    onClick={addPopularCompanies}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded flex items-center gap-2"
                  >
                    <Download size={16} />
                    Add Popular Companies
                  </button>
                </div>

                {bulkCompanies.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Truck className="mx-auto mb-2" size={32} />
                    <p>No companies added yet. Click "Add Company" to get started.</p>
                  </div>
                )}

                {bulkCompanies.map((company, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">Company {index + 1}</h4>
                      <button
                        onClick={() => removeBulkCompany(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Company Name *
                        </label>
                        <input
                          type="text"
                          value={company.name}
                          onChange={(e) => updateBulkCompany(index, 'name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="e.g., FedEx"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <input
                          type="text"
                          value={company.description}
                          onChange={(e) => updateBulkCompany(index, 'description', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="e.g., International courier delivery services"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleBulkAdd}
                  disabled={bulkCompanies.length === 0 || bulkCompanies.some(c => !c.name) || isSubmitting}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-4 py-2 rounded flex items-center justify-center gap-2"
                >
                  {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                  Add {bulkCompanies.length} Companies
                </button>
                <button
                  onClick={() => {
                    setShowBulkAddModal(false);
                    setBulkCompanies([]);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Shipping Company Modal */}
        <DeleteConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setCompanyToDelete(null);
          }}
          onConfirm={handleDeleteCompany}
          title="Delete Shipping Company"
          itemName={companyToDelete?.name || ''}
          itemType="Shipping Company"
          confirmationText={companyToDelete?.name || ''}
          isDeleting={isDeleting}
          warningMessage="This will permanently delete the shipping company and all associated data."
          additionalInfo={companyToDelete ? [
            { label: 'Description', value: companyToDelete.description },
            { label: 'ID', value: companyToDelete.id.toString() }
          ] : []}
        />
      </div>
    </SettingsLayout>
  );
}
