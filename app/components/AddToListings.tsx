"use client"

import React, { memo, useCallback, useMemo, useState, useEffect, useRef } from 'react'
import { X, Package2, Plus, Maximize2, Image as ImageIcon, AlertCircle, CheckCircle, Loader2, Upload, Link, Edit3, Trash2 } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Product } from '../lib/products/api'

// Validation utilities
const validateSku = (sku: string): { isValid: boolean; error?: string } => {
  if (!sku.trim()) {
    return { isValid: false, error: 'SKU is required' }
  }
  if (!/^[A-Z0-9-]+$/.test(sku)) {
    return { isValid: false, error: 'SKU must contain only A-Z, 0-9, and dashes' }
  }
  if (!sku.includes('-')) {
    return { isValid: false, error: 'SKU must contain at least one dash (-)' }
  }
  return { isValid: true }
}

const validateNumericField = (value: number, fieldName: string, isPreFilled: boolean = false): { isValid: boolean; error?: string } => {
  if (isNaN(value)) {
    return { isValid: false, error: `${fieldName} must be a valid number` }
  }
  
  // For pre-filled fields, allow 0 values
  if (isPreFilled) {
    if (value < 0) {
      return { isValid: false, error: `${fieldName} cannot be negative` }
    }
    return { isValid: true }
  }
  
  // For user-entered fields, 0 is not acceptable
  if (value <= 0) {
    return { isValid: false, error: `${fieldName} must be a positive number` }
  }
  
  return { isValid: true }
}

const validateRequiredField = (value: any, fieldName: string, isPreFilled: boolean = false): { isValid: boolean; error?: string } => {
  // Handle different data types
  if (typeof value === 'string') {
    if (!value.trim()) {
      return { isValid: false, error: `${fieldName} is required` }
    }
  } else if (typeof value === 'number') {
    // For both pre-filled and user-entered fields, 0 is not acceptable
    if (value === 0 || isNaN(value)) {
      return { isValid: false, error: `${fieldName} is required` }
    }
  } else if (value === null || value === undefined || value === '') {
    return { isValid: false, error: `${fieldName} is required` }
  }
  return { isValid: true }
}


// Helper function to determine if a field is pre-filled
const isFieldPreFilled = (listing: any, field: string): boolean => {
  // Check if the field has an original value or if it's part of pre-filled data
  if (field === 'Sku' && listing.originalGroupSku) {
    return true
  }
  
  // Check if the field has a value that wasn't entered by the user
  // This could be expanded based on your data structure
  if (listing[field] !== undefined && listing[field] !== null && listing[field] !== '') {
    // If the field has a value and it's not empty, consider it pre-filled
    // You might want to add more specific logic here based on your data structure
    return true
  }
  
  return false
}

// Form validation hook
const useFormValidation = (listingsData: any[]) => {
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [isValid, setIsValid] = useState(false)

  const validateListing = useCallback((listing: any, index: number) => {
    const errors: Record<string, string> = {}
    
    // Validate SKU fields
    const customSkuValidation = validateSku(listing.customSku || '')
    if (!customSkuValidation.isValid) {
      errors[`${index}-customSku`] = customSkuValidation.error!
    }
    
    const isGroupSkuPreFilled = isFieldPreFilled(listing, 'Sku')
    const groupSkuValidation = validateRequiredField(listing.Sku || '', 'Group SKU', isGroupSkuPreFilled)
    if (!groupSkuValidation.isValid) {
      errors[`${index}-Sku`] = groupSkuValidation.error!
    }
    
    // Validate required text fields
    const requiredFields = [
      'brandName', 'category', 'collectionName', 'title', 'description'
    ]
    
    requiredFields.forEach(field => {
      const isPreFilled = isFieldPreFilled(listing, field)
      const validation = validateRequiredField(listing[field] || '', field, isPreFilled)
      if (!validation.isValid) {
        errors[`${index}-${field}`] = validation.error!
      }
    })
    
    // Validate numeric fields
    const numericFields = [
      'brandRealPrice', 'brandMiscellaneous', 'msrp', 'shippingPrice',
      'commissionPrice', 'profitMarginPrice', 'ecommerceMiscellaneous'
    ]
    
    numericFields.forEach(field => {
      const value = parseFloat(listing[field]) || 0
      const isPreFilled = isFieldPreFilled(listing, field)
      const validation = validateNumericField(value, field, isPreFilled)
      if (!validation.isValid) {
        errors[`${index}-${field}`] = validation.error!
      }
    })
    
    // Validate attributes
    const requiredAttributes = [
      'color', 'style', 'material', 'origin', 'weight', 'volume',
      'shippingLength', 'shippingWidth', 'shippingHeight', 'productDimension',
      'shortDescription', 'fullDescription'
    ]
    
    requiredAttributes.forEach(attr => {
      const value = listing.attributes?.[attr] || ''
      const isPreFilled = isFieldPreFilled(listing.attributes, attr)
      const validation = validateRequiredField(value, attr, isPreFilled)
      if (!validation.isValid) {
        errors[`${index}-attributes.${attr}`] = validation.error!
      }
    })
    
    // Validate sub SKUs
    if (listing.subSkus && listing.subSkus.length > 0) {
      listing.subSkus.forEach((subSku: any, subIndex: number) => {
        const skuValidation = validateRequiredField(subSku.sku || '', `Sub SKU ${subIndex + 1}`)
        if (!skuValidation.isValid) {
          errors[`${index}-subSku-${subIndex}`] = skuValidation.error!
        }
      })
    }
    
    return errors
  }, [])

  useEffect(() => {
    const allErrors: Record<string, string> = {}
    let hasErrors = false
    
    listingsData.forEach((listing, index) => {
      const listingErrors = validateListing(listing, index)
      Object.assign(allErrors, listingErrors)
      if (Object.keys(listingErrors).length > 0) {
        hasErrors = true
      }
    })
    
    setValidationErrors(allErrors)
    setIsValid(!hasErrors)
  }, [listingsData, validateListing])

  return { validationErrors, isValid, validateListing }
}

// Error display component
const FieldError = memo(({ error }: { error?: string }) => {
  if (!error) return null
  
  return (
    <div className="flex items-center gap-1 mt-1 text-red-600 dark:text-red-400 text-xs">
      <AlertCircle className="h-3 w-3" />
      <span>{error}</span>
    </div>
  )
})

// Memoized sub-components for better performance
const CombinationCard = memo(({ 
  combo, 
  isSelected, 
  onSelect 
}: { 
  combo: any
  isSelected: boolean
  onSelect: (id: number) => void 
}) => (
  <div
    onClick={() => onSelect(combo.id)}
    className={`cursor-pointer border-2 rounded-lg p-4 transition-all ${
      isSelected
        ? 'border-violet-500 bg-violet-100 dark:bg-violet-900/40 shadow-lg'
        : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-violet-300 dark:hover:border-violet-600 hover:shadow-md'
    }`}
  >
    <div className="flex items-center gap-2 mb-2">
      <Badge variant="outline" className="text-xs">
        {combo.productCount} Products
      </Badge>
    </div>
    <p className="text-sm font-medium text-gray-900 dark:text-slate-100 line-clamp-2 mb-2">
      {combo.title}
    </p>
    <div className="space-y-1 text-xs text-gray-600 dark:text-slate-400">
      <p><span className="font-medium">Group SKU:</span> {combo.groupSku}</p>
      <p><span className="font-medium">Sub SKUs:</span> {combo.subSkus.length}</p>
      <p><span className="font-medium">Total MSRP:</span> ${combo.msrp?.toFixed(2) || '0.00'}</p>
    </div>
    <div className="mt-3 pt-3 border-t dark:border-slate-700">
      <p className="text-xs text-gray-500 dark:text-slate-500">
        Includes: {combo.products.map((p: Product) => p.title).join(', ')}
      </p>
    </div>
  </div>
))

const ProductImage = memo(({ 
  imageUrl, 
  title, 
  onPreview,
  onEdit
}: { 
  imageUrl: string | null
  title: string
  onPreview: () => void
  onEdit: () => void
}) => {
  if (!imageUrl) {
    return (
      <div className="relative group w-24 h-24 bg-gray-100 dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600 flex items-center justify-center">
        <ImageIcon className="h-8 w-8 text-gray-400" />
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity rounded-lg flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 bg-white/90 hover:bg-white text-gray-900"
              onClick={onEdit}
              title="Add image"
            >
              <Upload className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative group">
      <img 
        src={imageUrl} 
        alt={title}
        className="w-24 h-24 object-cover rounded-lg border border-gray-200 dark:border-slate-600 cursor-pointer"
        onClick={onPreview}
        onError={(e) => {
          e.currentTarget.src = '/placeholder-image.png'
        }}
      />
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity rounded-lg flex items-center justify-center">
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 bg-white/90 hover:bg-white text-gray-900"
            onClick={onPreview}
            title="Full screen view"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 bg-white/90 hover:bg-white text-gray-900"
            onClick={onEdit}
            title="Edit image"
          >
            <Edit3 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
})

// Image Upload/Edit Modal Component
const ImageEditModal = memo(({ 
  isOpen, 
  onClose, 
  imageUrl, 
  onSave, 
  title 
}: { 
  isOpen: boolean
  onClose: () => void
  imageUrl: string | null
  onSave: (url: string) => void
  title: string
}) => {
  const [editMode, setEditMode] = useState<'link' | 'upload'>('link')
  const [url, setUrl] = useState(imageUrl || '')
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setUrl(imageUrl || '')
      setFile(null)
    }
  }, [isOpen, imageUrl])

  const handleSave = useCallback(async () => {
    if (editMode === 'link' && url.trim()) {
      onSave(url.trim())
      onClose()
    } else if (editMode === 'upload' && file) {
      setIsUploading(true)
      try {
        // Here you would implement file upload logic
        // For now, we'll create a local URL
        const localUrl = URL.createObjectURL(file)
        onSave(localUrl)
        onClose()
      } catch (error) {
        console.error('Upload failed:', error)
      } finally {
        setIsUploading(false)
      }
    }
  }, [editMode, url, file, onSave, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
            Edit {title}
          </h3>
          <Button onClick={onClose} variant="ghost" size="sm">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant={editMode === 'link' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setEditMode('link')}
              className="flex items-center gap-2"
            >
              <Link className="h-4 w-4" />
              Link
            </Button>
            <Button
              variant={editMode === 'upload' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setEditMode('upload')}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Upload
            </Button>
          </div>

          {editMode === 'link' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                Image URL
              </label>
              <Input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter image URL"
                className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                Upload Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-gray-500 dark:text-slate-400
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-violet-50 file:text-violet-700
                  hover:file:bg-violet-100
                  dark:file:bg-violet-900/20 dark:file:text-violet-300"
              />
            </div>
          )}

          {url && editMode === 'link' && (
            <div className="mt-2">
              <img 
                src={url} 
                alt="Preview" 
                className="w-32 h-32 object-cover rounded-lg border border-gray-200 dark:border-slate-600"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button onClick={onClose} variant="outline">
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={(!url.trim() && editMode === 'link') || (!file && editMode === 'upload') || isUploading}
          >
            {isUploading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </div>
            ) : (
              'Save'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
})

// Gallery Image Manager Component
const GalleryImageManager = memo(({ 
  listing, 
  listingIndex, 
  updateListingData,
  getProxiedImageUrl,
  onImagePreview
}: { 
  listing: any
  listingIndex: number
  updateListingData: (index: number, field: string, value: any) => void
  getProxiedImageUrl: (url: string | null) => string | null
  onImagePreview: (url: string, title: string) => void
}) => {
  const [editingImageIndex, setEditingImageIndex] = useState<number | null>(null)
  const [editingImageType, setEditingImageType] = useState<'main' | 'gallery'>('main')
  const [editingImageUrl, setEditingImageUrl] = useState<string | null>(null)

  const galleryImages = listing.galleryImages || []
  const subSkus = listing.subSkus || []
  
  // Map sub SKUs to gallery images (first N images for N sub SKUs)
  const mappedImages = useMemo(() => {
    const mapped = []
    for (let i = 0; i < subSkus.length; i++) {
      mapped.push({
        subSku: subSkus[i]?.sku || '',
        imageUrl: galleryImages[i] || null,
        index: i
      })
    }
    return mapped
  }, [subSkus, galleryImages])

  const handleEditImage = useCallback((type: 'main' | 'gallery', index?: number) => {
    setEditingImageType(type)
    if (type === 'main') {
      setEditingImageUrl(listing.mainImageUrl)
      setEditingImageIndex(null)
    } else {
      setEditingImageUrl(galleryImages[index || 0] || null)
      setEditingImageIndex(index || 0)
    }
  }, [listing.mainImageUrl, galleryImages])

  const handleSaveImage = useCallback((url: string) => {
    if (editingImageType === 'main') {
      updateListingData(listingIndex, 'mainImageUrl', url)
    } else if (editingImageIndex !== null) {
      const newGalleryImages = [...galleryImages]
      
      // If editingImageIndex is beyond current array length, add new image
      if (editingImageIndex >= newGalleryImages.length) {
        // Add new image to the end
        newGalleryImages.push(url)
      } else {
        // Update existing image
        newGalleryImages[editingImageIndex] = url
      }
      
      updateListingData(listingIndex, 'galleryImages', newGalleryImages)
    }
    setEditingImageIndex(null)
    setEditingImageUrl(null)
  }, [editingImageType, editingImageIndex, galleryImages, listingIndex, updateListingData])


  const handleRemoveImage = useCallback((index: number) => {
    const newGalleryImages = [...galleryImages]
    newGalleryImages.splice(index, 1)
    updateListingData(listingIndex, 'galleryImages', newGalleryImages)
  }, [galleryImages, listingIndex, updateListingData])

  const handleImagePreview = useCallback((url: string, title: string) => {
    onImagePreview(url, title)
  }, [onImagePreview])

  // Get only mapped gallery images (first N images for N sub SKUs)
  const getAllImages = useMemo(() => {
    const images = []
    
    // Add main image
    if (listing.mainImageUrl) {
      images.push({
        id: 'main',
        type: 'main',
        subSku: 'Main Image',
        imageUrl: listing.mainImageUrl,
        index: 0,
        imageIndex: 0,
        subSkuIndex: -1
      })
    }
    
    // Track which sub SKUs we've already mapped to avoid duplicates and count them
    const mappedSubSkus = new Map()
    
    // Count occurrences of each sub SKU
    subSkus.forEach((subSku: any) => {
      const skuKey = subSku.sku || `Sub SKU ${subSkus.indexOf(subSku) + 1}`
      mappedSubSkus.set(skuKey, (mappedSubSkus.get(skuKey) || 0) + 1)
    })
    
    // Add only mapped gallery images (one per unique sub SKU)
    const processedSkus = new Set()
    subSkus.forEach((subSku: any, subSkuIndex: number) => {
      const skuKey = subSku.sku || `Sub SKU ${subSkuIndex + 1}`
      
      // Only map if we haven't processed this sub SKU before
      if (!processedSkus.has(skuKey)) {
        processedSkus.add(skuKey)
        const mappedImageUrl = galleryImages[subSkuIndex] || null
        const count = mappedSubSkus.get(skuKey) || 1
        
        images.push({
          id: `gallery-${subSkuIndex}`,
          type: 'gallery',
          subSku: count > 1 ? `${skuKey} (${count})` : skuKey,
          imageUrl: mappedImageUrl,
          subSkuIndex: subSkuIndex,
          imageIndex: subSkuIndex,
          index: subSkuIndex
        })
      }
    })
    
    return images
  }, [listing.mainImageUrl, subSkus, galleryImages])


  return (
    <div className="space-y-4">
      {/* All Images Section */}
      <div className="border  rounded-lg p-4">
        
        
       
        
         {/* Gallery Images Upload Section */}
         <div className="  dark:border-slate-700">
           <div>
             <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
               Add Gallery Images
             </label>
             
             {/* Image Upload Section */}
             <div className="space-y-4">
               {/* File Upload */}
               <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                   Upload Images
                 </label>
                 <Input
                   type="file"
                   accept="image/*"
                   multiple
                   onChange={(e) => {
                     const files = Array.from(e.target.files || [])
                     if (files.length > 0) {
                       // Store files for later upload
                       const currentFiles = listing.uploadedFiles || []
                       const newFiles = [...currentFiles, ...files]
                       updateListingData(listingIndex, 'uploadedFiles', newFiles)
                       
                       // Also create preview URLs
                       const newUrls = files.map(file => URL.createObjectURL(file))
                       const updatedGalleryImages = [...galleryImages, ...newUrls]
                       updateListingData(listingIndex, 'galleryImages', updatedGalleryImages)
                     }
                   }}
                   className="mb-2"
                 />
                 <p className="text-xs text-gray-500 dark:text-slate-400">
                   Select multiple images to upload
                 </p>
               </div>
               
               {/* URL Input with Preview */}
               <div>
                 <div className="flex items-center justify-between mb-2">
                   <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                     Add Image URLs
                   </label>
                   
                 </div>
                 
                 {/* Dynamic URL Fields */}
                 <div className="space-y-3">
                   {(listing.imageUrls || []).map((urlItem: any, urlIndex: number) => (
                     <div key={urlIndex} className="flex gap-2 items-start">
                       <div className="flex-1">
                         <Input
                           placeholder="Enter image URL"
                           value={urlItem.url || ''}
                           onChange={(e) => {
                             const newUrls = [...(listing.imageUrls || [])]
                             newUrls[urlIndex] = { ...urlItem, url: e.target.value }
                             updateListingData(listingIndex, 'imageUrls', newUrls)
                           }}
                           onKeyPress={(e) => {
                             if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                               const newImages = [...galleryImages, e.currentTarget.value.trim()]
                               updateListingData(listingIndex, 'galleryImages', newImages)
                               // Clear this URL field
                               const newUrls = [...(listing.imageUrls || [])]
                               newUrls[urlIndex] = { url: '', preview: null }
                               updateListingData(listingIndex, 'imageUrls', newUrls)
                             }
                           }}
                           className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                         />
                       </div>
                       
                       {/* Image Preview */}
                       <div className="w-16 h-16 flex-shrink-0">
                         {urlItem.preview ? (
                           <img
                             src={urlItem.preview}
                             alt="URL Preview"
                             className="w-full h-full object-cover rounded-lg border border-gray-200 dark:border-slate-600"
                             onError={(e) => {
                               const newUrls = [...(listing.imageUrls || [])]
                               newUrls[urlIndex] = { ...urlItem, preview: null }
                               updateListingData(listingIndex, 'imageUrls', newUrls)
                             }}
                           />
                         ) : urlItem.url ? (
                           <div className="w-full h-full bg-gray-100 dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600 flex items-center justify-center">
                             <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                           </div>
                         ) : (
                           <div className="w-full h-full bg-gray-50 dark:bg-slate-800 rounded-lg border border-dashed border-gray-300 dark:border-slate-600 flex items-center justify-center">
                             <ImageIcon className="h-4 w-4 text-gray-400" />
                           </div>
                         )}
                       </div>
                       
                       {/* Add to Gallery Button */}
                       <Button
                         type="button"
                         onClick={() => {
                           const url = urlItem.url?.trim()
                           if (url) {
                             const newImages = [...galleryImages, url]
                             updateListingData(listingIndex, 'galleryImages', newImages)
                             // Clear this URL field
                             const newUrls = [...(listing.imageUrls || [])]
                             newUrls[urlIndex] = { url: '', preview: null }
                             updateListingData(listingIndex, 'imageUrls', newUrls)
                           }
                         }}
                         variant="outline"
                         size="sm"
                         disabled={!urlItem.url?.trim()}
                         className="flex-shrink-0"
                       >
                         <Plus className="w-4 h-4" />
                       </Button>
                       
                       {/* Remove Field Button */}
                       <Button
                         type="button"
                         onClick={() => {
                           const newUrls = (listing.imageUrls || []).filter((_: any, i: number) => i !== urlIndex)
                           updateListingData(listingIndex, 'imageUrls', newUrls)
                         }}
                         variant="destructive"
                         size="sm"
                         className="flex-shrink-0"
                       >
                         <X className="w-4 h-4" />
                       </Button>
                     </div>
                   ))}
                   
                   {/* Add First Field Button */}
                   {(!listing.imageUrls || listing.imageUrls.length === 0) && (
                     <Button
                       type="button"
                       variant="outline"
                       onClick={() => {
                         updateListingData(listingIndex, 'imageUrls', [{ url: '', preview: null }])
                       }}
                       className="w-full"
                     >
                       <Plus className="w-4 h-4 mr-2" />
                       Add Image URL Field
                     </Button>
                   )}
                 </div>
                 
                 <p className="text-xs text-gray-500 dark:text-slate-400 mt-2">
                   Enter image URLs and click + to add to gallery. Images will be previewed automatically.
                 </p>
               </div>
               
               {/* Current Gallery Images Preview */}
               {galleryImages.length > 0 && (
                 <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                     Current Gallery Images ({galleryImages.length})
                   </label>
                   <div className="grid grid-cols-4 gap-2">
                     {galleryImages.map((img: string, idx: number) => (
                       <div key={idx} className="relative group">
                         <img
                           src={img}
                           alt={`Gallery ${idx + 1}`}
                           className="w-full h-20 object-cover rounded-lg border border-gray-200 dark:border-slate-600"
                           onError={(e) => {
                             e.currentTarget.style.display = 'none'
                           }}
                         />
                         <Button
                           type="button"
                           size="sm"
                           variant="destructive"
                           className="absolute -top-2 -right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                           onClick={() => {
                             const newImages = galleryImages.filter((_: string, i: number) => i !== idx)
                             updateListingData(listingIndex, 'galleryImages', newImages)
                           }}
                         >
                           ×
                         </Button>
                       </div>
                     ))}
                   </div>
                 </div>
               )}
             </div>
           </div>
         </div>
      </div>

      {/* Image Edit Modal */}
      <ImageEditModal
        isOpen={editingImageUrl !== null}
        onClose={() => {
          setEditingImageUrl(null)
          setEditingImageIndex(null)
        }}
        imageUrl={editingImageUrl}
        onSave={handleSaveImage}
        title={editingImageType === 'main' ? 'Main Image' : 
               editingImageIndex !== null && editingImageIndex >= galleryImages.length ? 'Add New Gallery Image' : 
               `Gallery Image ${(editingImageIndex || 0) + 1}`}
      />
    </div>
  )
})

const SubSkuManager = memo(({ 
  listing, 
  listingIndex, 
  updateListingData 
}: { 
  listing: any
  listingIndex: number
  updateListingData: (index: number, field: string, value: any) => void 
}) => {
  const handleAddSubSku = useCallback(() => {
    updateListingData(listingIndex, 'subSkus', [
      ...listing.subSkus,
      { sku: '', quantity: 1, isCustom: true }
    ])
  }, [listingIndex, listing.subSkus, updateListingData])

  const handleAddDuplicate = useCallback((sku: string) => {
    updateListingData(listingIndex, 'subSkus', [
      ...listing.subSkus,
      { sku, quantity: 1, isCustom: false }
    ])
  }, [listingIndex, listing.subSkus, updateListingData])

  const handleRemoveInstance = useCallback((sku: string) => {
    const newSubSkus = [...listing.subSkus]
    const lastIndex = newSubSkus.map((s: any, idx: number) => 
      s.sku === sku ? idx : -1
    ).filter((idx: number) => idx !== -1).pop()
    
    if (lastIndex !== undefined) {
      newSubSkus.splice(lastIndex, 1)
      updateListingData(listingIndex, 'subSkus', newSubSkus)
    }
  }, [listingIndex, listing.subSkus, updateListingData])

  const handleSkuChange = useCallback((sku: string, indices: number[]) => {
    const newSubSkus = [...listing.subSkus]
    indices.forEach(idx => {
      newSubSkus[idx].sku = sku
    })
    updateListingData(listingIndex, 'subSkus', newSubSkus)
  }, [listingIndex, listing.subSkus, updateListingData])

  // Group identical SKUs for better UX
  const skuGroups = useMemo(() => {
    const groups = new Map()
    listing.subSkus.forEach((subSku: any, index: number) => {
      if (!groups.has(subSku.sku)) {
        groups.set(subSku.sku, {
          sku: subSku.sku,
          count: 0,
          isCustom: subSku.isCustom,
          indices: []
        })
      }
      const group = groups.get(subSku.sku)
      group.count++
      group.indices.push(index)
    })
    return Array.from(groups.values())
  }, [listing.subSkus])

  if (!listing.subSkus || listing.subSkus.length === 0) return null

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Half - Sub SKU Management */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
            Sub SKUs <span className="text-red-500">*</span>
          </label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleAddSubSku}
            className="flex items-center gap-1"
          >
            <Plus className="h-3 w-3" />
            Add Sub SKU
          </Button>
        </div>
        <div className="space-y-3">
          {skuGroups.map((group: any, groupIndex: number) => (
            <div key={`${listingIndex}-${group.sku}-${groupIndex}`} className="flex items-center gap-2">
              <div className="flex-1 relative">
                <Input
                  type="text"
                  value={Array(group.count).fill(group.sku).join(', ')}
                  onChange={(e) => handleSkuChange(e.target.value.trim(), group.indices)}
                  placeholder={`Sub SKU ${groupIndex + 1}`}
                  className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600 pr-28"
                  required
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-1 rounded text-xs font-semibold">
                  {group.count}
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handleAddDuplicate(group.sku)}
                className="h-10 w-10 p-0"
                title="Add one more instance"
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handleRemoveInstance(group.sku)}
                className="h-10 w-10 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                title="Remove one instance"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 dark:text-slate-400 mt-2">
          [+] adds one more instance of the SKU, [X] removes one instance of the SKU. "Add Sub SKU" button adds a new blank SKU field.
        </p>
      </div>

      
    </div>
  )
})

const DimensionCalculator = memo(({ 
  listing, 
  listingIndex, 
  updateListingData 
}: { 
  listing: any
  listingIndex: number
  updateListingData: (index: number, field: string, value: any) => void 
}) => {
  const calculateDimension = useCallback((length: number, width: number, height: number) => {
    if (length > 0 && width > 0 && height > 0) {
      return `${length}" × ${width}" × ${height}"`
    }
    return ''
  }, [])

  const handleDimensionChange = useCallback((field: string, value: number) => {
    updateListingData(listingIndex, `attributes.${field}`, value)
    
    const { shippingLength, shippingWidth, shippingHeight } = listing.attributes
    const newDimension = calculateDimension(
      field === 'shippingLength' ? value : shippingLength || 0,
      field === 'shippingWidth' ? value : shippingWidth || 0,
      field === 'shippingHeight' ? value : shippingHeight || 0
    )
    
    if (newDimension) {
      updateListingData(listingIndex, 'attributes.productDimension', newDimension)
    }
  }, [listingIndex, listing.attributes, updateListingData, calculateDimension])

  return (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
          Shipping Length (in) <span className="text-red-500">*</span>
        </label>
        <Input
          type="number"
          min="0"
          step="0.01"
          value={listing.attributes.shippingLength}
          onChange={(e) => handleDimensionChange('shippingLength', Math.max(0, parseFloat(e.target.value) || 0))}
          className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
          Shipping Width (in) <span className="text-red-500">*</span>
        </label>
        <Input
          type="number"
          min="0"
          step="0.01"
          value={listing.attributes.shippingWidth}
          onChange={(e) => handleDimensionChange('shippingWidth', Math.max(0, parseFloat(e.target.value) || 0))}
          className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
          Shipping Height (in) <span className="text-red-500">*</span>
        </label>
        <Input
          type="number"
          min="0"
          step="0.01"
          value={listing.attributes.shippingHeight}
          onChange={(e) => handleDimensionChange('shippingHeight', Math.max(0, parseFloat(e.target.value) || 0))}
          className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
          required
        />
      </div>
    </>
  )
})

const ListingForm = memo(({ 
  listing, 
  listingIndex, 
  updateListingData, 
  getProxiedImageUrl, 
  onImagePreview,
  validationErrors
}: { 
  listing: any
  listingIndex: number
  updateListingData: (index: number, field: string, value: any) => void
  getProxiedImageUrl: (url: string | null) => string | null
  onImagePreview: (url: string, title: string) => void
  validationErrors: Record<string, string>
}) => {
  const galleryImages = listing.galleryImages || []
  
  // Auto-load image previews when URLs are entered
  useEffect(() => {
    if (listing.imageUrls) {
      listing.imageUrls.forEach((urlItem: any, index: number) => {
        if (urlItem.url && !urlItem.preview && !urlItem.loading) {
          // Mark as loading
          const newUrls = [...listing.imageUrls]
          newUrls[index] = { ...urlItem, loading: true }
          updateListingData(listingIndex, 'imageUrls', newUrls)
          
          // Create image element to test if URL is valid
          const img = new Image()
          img.onload = () => {
            const updatedUrls = [...listing.imageUrls]
            updatedUrls[index] = { ...urlItem, preview: urlItem.url, loading: false }
            updateListingData(listingIndex, 'imageUrls', updatedUrls)
          }
          img.onerror = () => {
            const updatedUrls = [...listing.imageUrls]
            updatedUrls[index] = { ...urlItem, preview: null, loading: false }
            updateListingData(listingIndex, 'imageUrls', updatedUrls)
          }
          img.src = urlItem.url
        }
      })
    }
  }, [listing.imageUrls, listingIndex, updateListingData])
  const handleImagePreview = useCallback(() => {
    const imageUrl = getProxiedImageUrl(listing.mainImageUrl) || listing.mainImageUrl
    if (imageUrl) {
      onImagePreview(imageUrl, listing.title)
    }
  }, [listing.mainImageUrl, listing.title, getProxiedImageUrl, onImagePreview])

  const [showImageEditModal, setShowImageEditModal] = useState(false)
  const [editingImageType, setEditingImageType] = useState<'main' | 'gallery' | null>(null)
  const [editingImageIndex, setEditingImageIndex] = useState<number | null>(null)

  const handleEditImage = useCallback((type: 'main' | 'gallery', index?: number) => {
    setEditingImageType(type)
    setEditingImageIndex(index || null)
    setShowImageEditModal(true)
  }, [])

  const handleSaveImage = useCallback((newUrl: string) => {
    if (editingImageType === 'main') {
      updateListingData(listingIndex, 'mainImageUrl', newUrl)
    } else if (editingImageType === 'gallery' && editingImageIndex !== null) {
      const newGalleryImages = [...galleryImages]
      newGalleryImages[editingImageIndex] = newUrl
      updateListingData(listingIndex, 'galleryImages', newGalleryImages)
    }
    setShowImageEditModal(false)
  }, [editingImageType, editingImageIndex, listingIndex, updateListingData, galleryImages])

  const getCurrentImageUrl = useCallback(() => {
    if (editingImageType === 'main') {
      return listing.mainImageUrl
    } else if (editingImageType === 'gallery' && editingImageIndex !== null) {
      return galleryImages[editingImageIndex]
    }
    return null
  }, [editingImageType, editingImageIndex, listing.mainImageUrl, galleryImages])

  const handleSkuValidation = useCallback((value: string) => {
    const validPattern = /^[A-Z0-9-]*$/
    if (validPattern.test(value)) {
      updateListingData(listingIndex, 'customSku', value)
    }
  }, [listingIndex, updateListingData])

  const handleNumericInput = useCallback((field: string, value: string) => {
    const numValue = Math.max(0, parseFloat(value) || 0)
    updateListingData(listingIndex, field, numValue)
  }, [listingIndex, updateListingData])

  return (
    <div className="border dark:border-slate-700 rounded-lg p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Product Header */}
      <div className="flex flex-col sm:flex-row items-start gap-4 pb-4 border-b dark:border-slate-700">
        <ProductImage
          imageUrl={getProxiedImageUrl(listing.mainImageUrl)}
          title={listing.title}
          onPreview={handleImagePreview}
          onEdit={() => handleEditImage('main')}
        />
        <div className="flex-1 w-full">
          <h3 className="text-base sm:text-lg text-black dark:text-slate-400 mt-1 line-clamp-2">
            {listing.title}
          </h3>
          <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">
            {listing.mainImageUrl ? 'Click to preview, hover to edit' : 'Hover to add image'}
          </p>
          
          {/* Gallery Images Overlay Display */}
          {galleryImages.length > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <div className="flex -space-x-2">
                {galleryImages.slice(0, 4).map((img: string, idx: number) => (
                  <div
                    key={idx}
                    className="relative w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 overflow-hidden shadow-sm cursor-pointer hover:scale-110 transition-transform"
                    style={{ zIndex: 4 - idx }}
                    onClick={() => {
                      // Open all gallery images in full screen preview
                      onImagePreview(galleryImages, `${listing.title} - Gallery Images`)
                    }}
                    title="Click to view all gallery images"
                  >
                    <img
                      src={getProxiedImageUrl(img) || img}
                      alt={`Gallery ${idx + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  </div>
                ))}
                {galleryImages.length > 4 && (
                  <div 
                    className="relative w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 bg-gray-100 dark:bg-slate-700 flex items-center justify-center shadow-sm cursor-pointer hover:scale-110 transition-transform"
                    onClick={() => {
                      // Open all gallery images in full screen preview
                      onImagePreview(galleryImages, `${listing.title} - Gallery Images`)
                    }}
                    title="Click to view all gallery images"
                  >
                    <span className="text-xs font-medium text-gray-600 dark:text-slate-300">
                      +{galleryImages.length - 4}
                    </span>
                  </div>
                )}
              </div>
              <span className="text-xs text-gray-500 dark:text-slate-400">
                {galleryImages.length} image{galleryImages.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      </div>
      
      {/* SKU Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
            Custom SKU Prefix <span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            value={listing.customSku}
            onChange={(e) => handleSkuValidation(e.target.value)}
            placeholder="Enter prefix (A-Z, 0-9, - only)"
            className={`dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600 ${
              validationErrors[`${listingIndex}-customSku`] ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
            }`}
            required
          />
          <FieldError error={validationErrors[`${listingIndex}-customSku`]} />
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
            Only capital letters (A-Z), numbers (0-9), and dash (-) allowed. At least one dash (-) required.
          </p>
          {listing.customSku && !validationErrors[`${listingIndex}-customSku`] && (
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              Final SKU: {listing.customSku}{listing.Sku}
            </p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
            Group SKU <span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            value={listing.Sku}
            onChange={(e) => updateListingData(listingIndex, 'Sku', e.target.value)}
            placeholder="Group SKU"
            className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
            required
          />
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
            {listing.originalGroupSku ? (
              <>
                <span className="font-medium text-violet-600 dark:text-violet-400">{listing.originalGroupSku}</span> is protected. You can add characters before it.
              </>
            ) : (
              'Enter or extend the Group SKU'
            )}
          </p>
        </div>
      </div>
      
      {/* Sub SKUs */}
      <SubSkuManager
        listing={listing}
        listingIndex={listingIndex}
        updateListingData={updateListingData}
      />
      
      {/* Gallery Image Management */}
      <GalleryImageManager
        listing={listing}
        listingIndex={listingIndex}
        updateListingData={updateListingData}
        getProxiedImageUrl={getProxiedImageUrl}
        onImagePreview={onImagePreview}
      />
      
      {/* Basic Information */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
            Brand Name <span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            value={listing.brandName}
            onChange={(e) => updateListingData(listingIndex, 'brandName', e.target.value)}
            className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
            Category <span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            value={listing.category}
            onChange={(e) => updateListingData(listingIndex, 'category', e.target.value)}
            className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
            Collection Name <span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            value={listing.collectionName}
            onChange={(e) => updateListingData(listingIndex, 'collectionName', e.target.value)}
            className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
            required
          />
        </div>
      </div>
      
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
          Title <span className="text-red-500">*</span>
        </label>
        <Input
          type="text"
          value={listing.title}
          onChange={(e) => updateListingData(listingIndex, 'title', e.target.value)}
          className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
          required
        />
      </div>
      
      
      
      {/* Pricing Information */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
            Brand Real Price <span className="text-red-500">*</span>
          </label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={listing.brandRealPrice}
            onChange={(e) => handleNumericInput('brandRealPrice', e.target.value)}
            className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
            Brand Misc <span className="text-red-500">*</span>
          </label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={listing.brandMiscellaneous}
            onChange={(e) => handleNumericInput('brandMiscellaneous', e.target.value)}
            className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
            MSRP <span className="text-red-500">*</span>
          </label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={listing.msrp}
            onChange={(e) => handleNumericInput('msrp', e.target.value)}
            className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
            Shipping Price <span className="text-red-500">*</span>
          </label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={listing.shippingPrice}
            onChange={(e) => handleNumericInput('shippingPrice', e.target.value)}
            className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
            Commission Price <span className="text-red-500">*</span>
          </label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={listing.commissionPrice}
            onChange={(e) => handleNumericInput('commissionPrice', e.target.value)}
            className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
            Profit Margin <span className="text-red-500">*</span>
          </label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={listing.profitMarginPrice}
            onChange={(e) => handleNumericInput('profitMarginPrice', e.target.value)}
            className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
            Ecommerce Misc <span className="text-red-500">*</span>
          </label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={listing.ecommerceMiscellaneous}
            onChange={(e) => handleNumericInput('ecommerceMiscellaneous', e.target.value)}
            className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
            required
          />
        </div>
      </div>
      
      {/* Shipping & Item Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
            Single/Set Item
          </label>
          <Select
            value={listing.singleSetItem}
            onValueChange={(value) => updateListingData(listingIndex, 'singleSetItem', value)}
          >
            <SelectTrigger className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Single Item">Single Item</SelectItem>
              <SelectItem value="Set">Set</SelectItem>
              <SelectItem value="Part">Part</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Attributes */}
      <div className="border-t dark:border-slate-700 pt-4">
        <h4 className="text-md font-semibold text-gray-900 dark:text-slate-100 mb-4">
          Product Attributes
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Sub Category
            </label>
            <Input
              type="text"
              value={listing.attributes.subCategory}
              onChange={(e) => updateListingData(listingIndex, 'attributes.subCategory', e.target.value)}
              className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Color <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={listing.attributes.color}
              onChange={(e) => updateListingData(listingIndex, 'attributes.color', e.target.value)}
              className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Style <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={listing.attributes.style}
              onChange={(e) => updateListingData(listingIndex, 'attributes.style', e.target.value)}
              className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Material <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={listing.attributes.material}
              onChange={(e) => updateListingData(listingIndex, 'attributes.material', e.target.value)}
              className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Origin <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={listing.attributes.origin}
              onChange={(e) => updateListingData(listingIndex, 'attributes.origin', e.target.value)}
              className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Weight (lb) <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={listing.attributes.weight}
              onChange={(e) => handleNumericInput('attributes.weight', e.target.value)}
              className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Volume (cu ft) <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={listing.attributes.volume}
              onChange={(e) => handleNumericInput('attributes.volume', e.target.value)}
              className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
              required
            />
          </div>
          
          <DimensionCalculator
            listing={listing}
            listingIndex={listingIndex}
            updateListingData={updateListingData}
          />
          
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Product Dimension (Auto-calculated) <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={listing.attributes.productDimension}
              onChange={(e) => updateListingData(listingIndex, 'attributes.productDimension', e.target.value)}
              className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
              placeholder="Will auto-calculate when length, width, and height are filled"
              required
            />
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
              Auto-calculated from length × width × height above
            </p>
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Short Description <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={listing.attributes.shortDescription}
              onChange={(e) => updateListingData(listingIndex, 'attributes.shortDescription', e.target.value)}
              className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
              required
              placeholder="Enter a brief description"
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Full Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={listing.attributes.fullDescription || ''}
              onChange={(e) => updateListingData(listingIndex, 'attributes.fullDescription', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-slate-100"
              placeholder="Enter detailed product description..."
              required
            />
          </div>
        </div>
      </div>
      
      {/* Image Edit Modal */}
      <ImageEditModal
        isOpen={showImageEditModal}
        onClose={() => setShowImageEditModal(false)}
        imageUrl={getCurrentImageUrl()}
        onSave={handleSaveImage}
        title={editingImageType === 'main' ? 'Main Image' : 
               editingImageIndex !== null ? `Gallery Image ${editingImageIndex + 1}` : 'Gallery Image'}
      />
    </div>
  )
})

// Main ListingsModal component
const ListingsModal = memo(({
  isOpen,
  onClose,
  listingsData,
  setListingsData,
  combinationSuggestions,
  selectedCombination,
  onSelectCombination,
  error,
  isSubmitting,
  onSubmit,
  getProxiedImageUrl,
  setPreviewImageUrl,
  setPreviewImageTitle,
  setShowImagePreview
}: {
  isOpen: boolean
  onClose: () => void
  listingsData: any[]
  setListingsData: (data: any[]) => void
  combinationSuggestions: any[]
  selectedCombination: number | null
  onSelectCombination: (id: number) => void
  error: string | null
  isSubmitting: boolean
  onSubmit: () => void
  getProxiedImageUrl: (url: string | null) => string | null
  setPreviewImageUrl: (url: string) => void
  setPreviewImageTitle: (title: string) => void
  setShowImagePreview: (show: boolean) => void
}) => {
  const { validationErrors, isValid } = useFormValidation(listingsData)
  
  const handleImagePreview = useCallback((url: string, title: string) => {
    setPreviewImageUrl(url)
    setPreviewImageTitle(title)
    setShowImagePreview(true)
  }, [setPreviewImageUrl, setPreviewImageTitle, setShowImagePreview])

  const handleSubmit = useCallback(async () => {
    if (!isValid) return
    
    try {
      await onSubmit()
    } catch (error) {
      console.error('Submission failed:', error)
    }
  }, [isValid, onSubmit])

  const updateListingData = useCallback((index: number, field: string, value: any) => {
    const newData = [...listingsData]
    if (field.startsWith('attributes.')) {
      const attrField = field.replace('attributes.', '')
      newData[index].attributes = {
        ...newData[index].attributes,
        [attrField]: value
      }
    } else if (field === 'subSkus') {
      newData[index].subSkus = value
    } else {
      newData[index][field] = value
    }
    setListingsData(newData)
  }, [listingsData, setListingsData])

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-800 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto my-4 sm:my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b dark:border-slate-700 p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between z-10 gap-4">
          <div className="flex-1">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-slate-100">
              Add to Listings
            </h2>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 mt-1">
              <p className="text-sm text-gray-600 dark:text-slate-400">
                Configure {listingsData.length} product{listingsData.length !== 1 ? 's' : ''} for listing
              </p>
            </div>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Content */}
        <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg">
              {error}
            </div>
          )}
          
          {/* Combination Suggestions */}
          {combinationSuggestions.length > 0 && (
            <div className="bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20 border border-violet-200 dark:border-violet-800 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <Package2 className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                  Suggested Combinations
                </h3>
                <Badge className="bg-violet-600 text-white">
                  {combinationSuggestions.length} combinations
                </Badge>
              </div>
              <p className="text-sm text-gray-600 dark:text-slate-400 mb-4">
                Select a combination to create a bundled listing, or keep individual listings below
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                {combinationSuggestions.map((combo) => (
                  <CombinationCard
                    key={combo.id}
                    combo={combo}
                    isSelected={selectedCombination === combo.id}
                    onSelect={onSelectCombination}
                  />
                ))}
              </div>
              
              {selectedCombination !== null && (
                <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    ✓ Combination selected. The form below shows the combined listing details.
                  </p>
                </div>
              )}
            </div>
          )}
          
          {/* Listing Forms */}
          {listingsData.map((listing, listingIndex) => (
            <ListingForm
              key={listingIndex}
              listing={listing}
              listingIndex={listingIndex}
              updateListingData={updateListingData}
              getProxiedImageUrl={getProxiedImageUrl}
              onImagePreview={handleImagePreview}
              validationErrors={validationErrors}
            />
          ))}
        </div>
        
        {/* Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-slate-800 border-t dark:border-slate-700 px-4 sm:px-6 py-3 flex flex-col sm:flex-row justify-end gap-3">
          <Button
            onClick={onClose}
            variant="outline"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white"
            disabled={isSubmitting || !isValid}
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Submitting...</span>
              </div>
            ) : (
              `Submit ${listingsData.length} Listing${listingsData.length !== 1 ? 's' : ''}`
            )}
          </Button>
        </div>
          <div className='flex justify-end p-3'>
          {!isValid && (
            <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
              <AlertCircle className="h-4 w-4" />
              <span>Must fill all required fields.</span>
            </div>
          )}
          </div>
      </div>
    </div>
  )
})

ListingsModal.displayName = 'ListingsModal'
CombinationCard.displayName = 'CombinationCard'
ProductImage.displayName = 'ProductImage'
SubSkuManager.displayName = 'SubSkuManager'
DimensionCalculator.displayName = 'DimensionCalculator'
ListingForm.displayName = 'ListingForm'
ImageEditModal.displayName = 'ImageEditModal'
GalleryImageManager.displayName = 'GalleryImageManager'

export default ListingsModal
