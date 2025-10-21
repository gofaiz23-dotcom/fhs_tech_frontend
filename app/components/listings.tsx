"use client"

/**
 * Listings Component
 * 
 * API Communication Policy:
 * ========================
 * ALL listing data supports both FormData (for file uploads) and JSON (for URLs)
 * 
 * - Create Listing: FormData with file uploads OR JSON with URLs
 * - Update Listing: FormData with file uploads OR JSON with URLs  
 * - Bulk Create: JSON array or File upload (CSV/Excel)
 * 
 * Image Handling:
 * - If user provides URL: Send URL as-is
 * - If user uploads file: Send file as File object in FormData
 * - Preview uses object URLs for better performance
 */

import React, { useState, useEffect, useMemo, useRef } from 'react'
import { Search, Download, Plus, Info, X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Image as ImageIcon, Images, Building2, Package2, Filter, Edit, Trash2, Globe, FileText, Upload, Warehouse, Maximize2, Minimize2, Minus } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Badge } from './ui/badge'
import { Skeleton } from './ui/skeleton'
import UnifiedAddNew from './UnifiedAddNew'
import './table-scroll.css'

// Types
interface Listing {
  id: number
  brandId: number
  brandName?: string
  title: string
  sku: string
  subSku: string | null
  category: string | null
  collectionName: string | null
  shipTypes: string | null
  singleSetItem: string | null
  brandRealPrice: number
  brandMiscellaneous: number
  brandPrice: number
  msrp: number
  shippingPrice: number
  commissionPrice: number
  profitMarginPrice: number
  ecommerceMiscellaneous: number
  ecommercePrice: number
  mainImageUrl: string | null
  galleryImages: string[] | null
  productCounts: number | null
  attributes: Record<string, any>
  quantity?: number
  status?: string
  inventoryArray?: number[]
  brand?: string  // Custom brand name from settings (already mapped by backend)
  createdAt: string
  updatedAt: string
}

interface Brand {
  id: number
  name: string
  description?: string | null
}

interface Pagination {
  totalCount: number
  totalPages: number
  currentPage: number
  itemsPerPage: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

const Listings = () => {
  const { state } = useAuth()
  
  // Helper function to proxy backend images through Next.js API
  const getProxiedImageUrl = (imageUrl: string | null | undefined): string | null => {
    if (!imageUrl) return null
    
    // Normalize the IP address to current backend IP
    let normalizedUrl = imageUrl
    if (imageUrl.includes('192.168.0.22:5000')) {
      normalizedUrl = imageUrl.replace('192.168.0.22:5000', '192.168.0.22:5000')
    }
    
    // If it's a backend URL, proxy it
    if (normalizedUrl.startsWith('http://192.168.0.22:5000/uploads/')) {
      return `/api/image-proxy?url=${encodeURIComponent(normalizedUrl)}`
    }
    
    // Otherwise return as-is (for external URLs)
    return normalizedUrl
  }
  
  // Helper function to safely format prices
  const formatPrice = (price: any): string => {
    if (typeof price === 'number') {
      return price.toFixed(2)
    }
    const parsed = parseFloat(String(price || 0))
    return isNaN(parsed) ? '0.00' : parsed.toFixed(2)
  }
  
  // State management
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedListingInfo, setSelectedListingInfo] = useState<Listing | null>(null)
  const [showInfoModal, setShowInfoModal] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [showAddListingModal, setShowAddListingModal] = useState(false)
  const [showEditListingModal, setShowEditListingModal] = useState(false)
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false)
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [brands, setBrands] = useState<Brand[]>([])
  
  // Pagination
  const [pagination, setPagination] = useState<Pagination>({
    totalCount: 0,
    totalPages: 0,
    currentPage: 1,
    itemsPerPage: 20,
    hasNextPage: false,
    hasPrevPage: false
  })
  
  // Filters
  const [filters, setFilters] = useState({
    search: '',
    brandId: '',
    category: '',
    minPrice: '',
    maxPrice: ''
  })
  
  // Image upload state
  const [mainImageFile, setMainImageFile] = useState<File | null>(null)
  const [galleryImageFiles, setGalleryImageFiles] = useState<File[]>([])
  
  // Listing form state
  const [listingFormData, setListingFormData] = useState<{
    brandId: string
    title: string
    sku: string
    subSku: string
    category: string
    collectionName: string
    shipTypes: string
    singleSetItem: string
    brandRealPrice: string
    brandMiscellaneous: string
    msrp: string
    shippingPrice: string
    commissionPrice: string
    profitMarginPrice: string
    ecommerceMiscellaneous: string
    productCounts: string
    mainImageUrl: string
    galleryImages: string[]
    attributes: Record<string, any>
  }>({
    brandId: '',
    title: '',
    sku: '',
    subSku: '',
    category: '',
    collectionName: '',
    shipTypes: 'Standard Shipping',
    singleSetItem: 'Single Item',
    brandRealPrice: '',
    brandMiscellaneous: '',
    msrp: '',
    shippingPrice: '',
    commissionPrice: '',
    profitMarginPrice: '',
    ecommerceMiscellaneous: '',
    productCounts: '',
    mainImageUrl: '',
    galleryImages: [''],
    attributes: {
      origin: '',
      weight_lb: '',
      sub_category: '',
      volume_cuft: '',
      short_description: '',
      shipping_width_in: '',
      shipping_height_in: '',
      shipping_length_in: '',
      color: '',
      style: '',
      material: '',
      feature_1: '',
      feature_2: '',
      feature_3: '',
      feature_4: '',
      feature_5: '',
      feature_6: '',
      feature_7: '',
      product_dimension_inch: ''
    }
  })
  
  const [subSkus, setSubSkus] = useState<{ sku: string, quantity: string }[]>([{ sku: '', quantity: '0' }])
  const [listingFeatures, setListingFeatures] = useState<string[]>([''])
  const [customTypes, setCustomTypes] = useState<{ key: string, value: string }[]>([])
  
  // Fullscreen image modal
  const [showFullscreenImage, setShowFullscreenImage] = useState(false)
  const [fullscreenImageUrl, setFullscreenImageUrl] = useState('')
  const [fullscreenImageTitle, setFullscreenImageTitle] = useState('')
  
  // Gallery carousel modal
  const [showGalleryModal, setShowGalleryModal] = useState(false)
  const [galleryImages, setGalleryImages] = useState<string[]>([])
  const [currentGalleryIndex, setCurrentGalleryIndex] = useState(0)
  const [galleryTitle, setGalleryTitle] = useState('')
  
  // Selected rows state
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set())
  
  // Column resize state
  const [columnWidths, setColumnWidths] = useState<{ [key: string]: number }>({})
  const [resizingColumn, setResizingColumn] = useState<string | null>(null)
  const [resizeStartX, setResizeStartX] = useState(0)
  const [resizeStartWidth, setResizeStartWidth] = useState(0)
  
  // Expanded cells state
  const [expandedCells, setExpandedCells] = useState<{ [key: string]: boolean }>({})
  
  // Drag and scroll functionality with smooth momentum
  const tableRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const dragStartPos = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 })
  const velocity = useRef({ x: 0, y: 0 })
  const lastPos = useRef({ x: 0, y: 0, time: 0 })
  const momentumAnimation = useRef<number | null>(null)
  
  // Column definitions with default widths
  const columns = [
    { key: 'mainImage', label: 'Image', width: 100 },
    { key: 'title', label: 'Title', width: 200 },
    { key: 'sku', label: 'SKU', width: 150 },
    { key: 'subSku', label: 'Sub SKU', width: 150 },
    { key: 'brand', label: 'Brand', width: 130 },
    { key: 'category', label: 'Category', width: 130 },
    { key: 'brandPrice', label: 'Brand Price', width: 120 },
    { key: 'msrp', label: 'MSRP', width: 100 },
    { key: 'ecommercePrice', label: 'Ecom Price', width: 120 },
    { key: 'productCounts', label: 'Item Count', width: 130 },
    { key: 'inventoryArray', label: 'Inventory Count', width: 150 },
    { key: 'galleryImages', label: 'Gallery Images', width: 120 },
    { key: 'status', label: 'Status', width: 100 },
    { key: 'quantity', label: 'Inventory', width: 100 },
    { key: 'actions', label: 'Actions', width: 120 }
  ]
  
  // Load brands
  const loadBrands = async () => {
    try {
      const response = await fetch('http://192.168.0.22:5000/api/brands', {
        headers: {
          'Authorization': `Bearer ${state.accessToken}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setBrands(data.brands || [])
      }
    } catch (err) {
      console.error('Failed to load brands:', err)
    }
  }
  
  // Load listings
  const loadListings = async (page: number = 1) => {
    if (!state.accessToken) {
      console.log('⚠️ No access token, skipping listings load')
      return
    }
    
    try {
      setLoading(true)
      setError(null)
      
      // Build query params
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.itemsPerPage.toString()
      })
      
      if (filters.search) params.append('search', filters.search)
      if (filters.brandId) params.append('brandId', filters.brandId)
      if (filters.category) params.append('category', filters.category)
      if (filters.minPrice) params.append('minPrice', filters.minPrice)
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice)
      
      const url = `http://192.168.0.22:5000/api/listings?${params}`
      console.log('📡 Loading listings from:', url)
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${state.accessToken}`
        }
      })
      
      console.log('📥 Response status:', response.status)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('❌ API Error:', errorData)
        throw new Error(errorData.message || errorData.error || 'Failed to load listings')
      }
      
      const data = await response.json()
      console.log('✅ Listings loaded:', data.listings?.length || 0, 'items')
      console.log('📄 Pagination:', data.pagination)
      
      setListings(data.listings || [])
      setPagination(data.pagination)
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load listings'
      setError(errorMessage)
      console.error('❌ Failed to load listings:', err)
    } finally {
      setLoading(false)
    }
  }
  
  // Test API connectivity on mount
  useEffect(() => {
    const testConnection = async () => {
      const { default: HttpClient } = await import('../lib/auth/httpClient');
      const result = await HttpClient.testConnectivity();
      console.log('🔌 API Connection Test (Listings):', result);
      
      if (!result.isReachable) {
        console.error('⚠️ WARNING: API server is not reachable!');
        setError(`API server is not reachable: ${result.error}`);
      }
    };
    
    testConnection();
  }, []);
  
  useEffect(() => {
    if (state.accessToken) {
      loadBrands()
      loadListings()
    }
  }, [state.accessToken])
  
  // Handle filter changes
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }
  
  const handleApplyFilters = () => {
    setPagination(prev => ({ ...prev, currentPage: 1 }))
    loadListings(1)
  }
  
  const handleResetFilters = () => {
    setFilters({
      search: '',
      brandId: '',
      category: '',
      minPrice: '',
      maxPrice: ''
    })
    setPagination(prev => ({ ...prev, currentPage: 1 }))
    loadListings(1)
  }
  
  // Pagination handlers
  const goToPage = (page: number) => {
    loadListings(page)
  }
  
  const goToFirstPage = () => goToPage(1)
  const goToLastPage = () => goToPage(pagination.totalPages)
  const goToNextPage = () => pagination.hasNextPage && goToPage(pagination.currentPage + 1)
  const goToPrevPage = () => pagination.hasPrevPage && goToPage(pagination.currentPage - 1)
  
  // Open/Close modals
  
  // Gallery modal handlers
  const openGalleryModal = (images: string[], title: string) => {
    setGalleryImages(images)
    setGalleryTitle(title)
    setCurrentGalleryIndex(0)
    setShowGalleryModal(true)
  }
  
  const closeGalleryModal = () => {
    setShowGalleryModal(false)
    setGalleryImages([])
    setCurrentGalleryIndex(0)
    setGalleryTitle('')
  }
  
  const nextGalleryImage = () => {
    setCurrentGalleryIndex((prev) => (prev + 1) % galleryImages.length)
  }
  
  const prevGalleryImage = () => {
    setCurrentGalleryIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length)
  }
  
  // Momentum scrolling animation
  const applyMomentum = () => {
    const container = tableRef.current
    if (!container) return
    
    // Apply velocity with medium friction for smooth deceleration
    const friction = 0.92
    velocity.current.x *= friction
    velocity.current.y *= friction
    
    // Stop if velocity is very small
    if (Math.abs(velocity.current.x) < 0.3 && Math.abs(velocity.current.y) < 0.3) {
      velocity.current = { x: 0, y: 0 }
      if (momentumAnimation.current) {
        cancelAnimationFrame(momentumAnimation.current)
        momentumAnimation.current = null
      }
      return
    }
    
    // Apply scroll smoothly
    container.scrollLeft -= velocity.current.x
    container.scrollTop -= velocity.current.y
    
    // Continue animation
    momentumAnimation.current = requestAnimationFrame(applyMomentum)
  }
  
  // Custom drag to scroll implementation with smooth momentum
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = tableRef.current
    if (!container) return
    
    // Don't drag if clicking on interactive elements
    const target = e.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'BUTTON' || target.tagName === 'A' || 
        target.closest('button') || target.closest('a') || target.closest('input')) {
      return
    }
    
    // Cancel any ongoing momentum
    if (momentumAnimation.current) {
      cancelAnimationFrame(momentumAnimation.current)
      momentumAnimation.current = null
    }
    
    setIsDragging(true)
    dragStartPos.current = {
      x: e.pageX,
      y: e.pageY,
      scrollLeft: container.scrollLeft || 0,
      scrollTop: container.scrollTop || 0
    }
    lastPos.current = {
      x: e.pageX,
      y: e.pageY,
      time: Date.now()
    }
    velocity.current = { x: 0, y: 0 }
    
    container.style.cursor = 'grabbing'
    container.style.userSelect = 'none'
    e.preventDefault()
  }
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return
    const container = tableRef.current
    if (!container) return
    
    const currentTime = Date.now()
    const timeDiff = currentTime - lastPos.current.time
    
    const dx = e.pageX - dragStartPos.current.x
    const dy = e.pageY - dragStartPos.current.y
    
    // Calculate velocity for momentum with smoothing
    if (timeDiff > 0) {
      const velocityX = (e.pageX - lastPos.current.x) / timeDiff * 16
      const velocityY = (e.pageY - lastPos.current.y) / timeDiff * 16
      
      // Smooth velocity with exponential moving average
      velocity.current.x = velocity.current.x * 0.7 + velocityX * 0.3
      velocity.current.y = velocity.current.y * 0.7 + velocityY * 0.3
    }
    
    lastPos.current = {
      x: e.pageX,
      y: e.pageY,
      time: currentTime
    }
    
    // Medium smooth scroll - not too sensitive, not too slow
    const scrollMultiplier = 1.0
    container.scrollLeft = dragStartPos.current.scrollLeft - (dx * scrollMultiplier)
    container.scrollTop = dragStartPos.current.scrollTop - (dy * scrollMultiplier)
    
    e.preventDefault()
  }
  
  const handleMouseUp = () => {
    setIsDragging(false)
    const container = tableRef.current
    if (container) {
      container.style.cursor = 'grab'
      container.style.userSelect = ''
      
      // Start momentum scrolling with medium sensitivity
      if (Math.abs(velocity.current.x) > 0.5 || Math.abs(velocity.current.y) > 0.5) {
        // Scale down velocity for medium smooth momentum
        velocity.current.x *= 0.8
        velocity.current.y *= 0.8
        momentumAnimation.current = requestAnimationFrame(applyMomentum)
      }
    }
  }
  
  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false)
      const container = tableRef.current
      if (container) {
        container.style.cursor = 'grab'
        container.style.userSelect = ''
        
        // Start momentum scrolling with medium sensitivity
        if (Math.abs(velocity.current.x) > 0.5 || Math.abs(velocity.current.y) > 0.5) {
          // Scale down velocity for medium smooth momentum
          velocity.current.x *= 0.8
          velocity.current.y *= 0.8
          momentumAnimation.current = requestAnimationFrame(applyMomentum)
        }
      }
    }
  }
  
  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (momentumAnimation.current) {
        cancelAnimationFrame(momentumAnimation.current)
      }
    }
  }, [])
  
  const events = {
    onMouseDown: handleMouseDown,
    onMouseMove: handleMouseMove,
    onMouseUp: handleMouseUp,
    onMouseLeave: handleMouseLeave,
  }
  
  // Column resize handlers
  const handleResizeStart = (e: React.MouseEvent, columnKey: string, currentWidth: number) => {
    e.preventDefault()
    e.stopPropagation()
    setResizingColumn(columnKey)
    setResizeStartX(e.clientX)
    setResizeStartWidth(currentWidth)
  }
  
  const handleResizeMove = (e: MouseEvent) => {
    if (!resizingColumn) return
    
    const diff = e.clientX - resizeStartX
    const newWidth = Math.max(50, resizeStartWidth + diff) // Minimum 50px
    
    setColumnWidths(prev => ({
      ...prev,
      [resizingColumn]: newWidth
    }))
  }
  
  const handleResizeEnd = () => {
    setResizingColumn(null)
  }
  
  // Add/remove resize event listeners
  useEffect(() => {
    if (resizingColumn) {
      document.addEventListener('mousemove', handleResizeMove)
      document.addEventListener('mouseup', handleResizeEnd)
      document.body.classList.add('resizing-column')
      
      return () => {
        document.removeEventListener('mousemove', handleResizeMove)
        document.removeEventListener('mouseup', handleResizeEnd)
        document.body.classList.remove('resizing-column')
      }
    }
  }, [resizingColumn, resizeStartX, resizeStartWidth])
  
  // Toggle expanded cell
  const toggleExpandCell = (rowId: number, columnKey: string) => {
    const cellKey = `${rowId}-${columnKey}`
    setExpandedCells(prev => ({
      ...prev,
      [cellKey]: !prev[cellKey]
    }))
  }
  
  // Check if cell is expanded
  const isCellExpanded = (rowId: number, columnKey: string) => {
    const cellKey = `${rowId}-${columnKey}`
    return expandedCells[cellKey] || false
  }
  
  // Get column width
  const getColumnWidth = (columnKey: string, defaultWidth: number = 150) => {
    return columnWidths[columnKey] || defaultWidth
  }
  
  // Render expandable cell - content automatically adjusts to column width
  const renderExpandableCell = (content: string, rowId: number, columnKey: string, defaultWidth: number = 150) => {
    const isExpanded = isCellExpanded(rowId, columnKey)
    const width = getColumnWidth(columnKey, defaultWidth)
    
    return (
      <div 
        className={`relative ${isExpanded ? 'z-10' : ''}`}
        style={{ width: `${width}px` }}
      >
        <div 
          className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-1 rounded transition-colors ${
            isExpanded ? 'bg-gray-50 dark:bg-gray-800' : ''
          }`}
          onClick={() => toggleExpandCell(rowId, columnKey)}
          title={isExpanded ? 'Click to collapse' : 'Click to expand'}
        >
          <div className={`${isExpanded ? '' : 'truncate'}`}>
            {content}
          </div>
        </div>
        
        {/* Expanded overlay */}
        {isExpanded && (
          <div 
            className="absolute top-0 left-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 z-20"
            style={{ 
              width: `${Math.max(width, 300)}px`,
              maxWidth: '500px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-2">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                {columnKey.replace(/([A-Z])/g, ' $1').trim()}
              </span>
              <button
                onClick={() => toggleExpandCell(rowId, columnKey)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            <div className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words">
              {content}
            </div>
          </div>
        )}
      </div>
    )
  }
  
  const handleOpenAddListing = () => {
    resetListingForm()
    setShowAddListingModal(true)
  }
  
  const handleCloseAddListing = () => {
    setShowAddListingModal(false)
    resetListingForm()
  }
  
  const handleOpenEditListing = (listing: Listing) => {
    setSelectedListing(listing)
    
    // Populate form with listing data
    setListingFormData({
      brandId: listing.brandId.toString(),
      title: listing.title,
      sku: listing.sku,
      subSku: listing.subSku || '',
      category: listing.category || '',
      collectionName: listing.collectionName || '',
      shipTypes: listing.shipTypes || 'Standard Shipping',
      singleSetItem: listing.singleSetItem || 'Single Item',
      brandRealPrice: listing.brandRealPrice?.toString() || '',
      brandMiscellaneous: listing.brandMiscellaneous?.toString() || '',
      msrp: listing.msrp?.toString() || '',
      shippingPrice: listing.shippingPrice?.toString() || '',
      commissionPrice: listing.commissionPrice?.toString() || '',
      profitMarginPrice: listing.profitMarginPrice?.toString() || '',
      ecommerceMiscellaneous: listing.ecommerceMiscellaneous?.toString() || '',
      productCounts: listing.productCounts?.toString() || '',
      mainImageUrl: listing.mainImageUrl || '',
      galleryImages: listing.galleryImages || [''],
      attributes: listing.attributes || {}
    })
    
    // Parse subSkus
    if (listing.subSku) {
      setSubSkus(listing.subSku.split(',').map(s => ({ sku: s.trim(), quantity: '0' })))
    } else {
      setSubSkus([{ sku: '', quantity: '0' }])
    }
    
    // Parse features from attributes
    if (listing.attributes?.features) {
      setListingFeatures(listing.attributes.features)
    }
    
    setShowEditListingModal(true)
  }
  
  const handleCloseEditListing = () => {
    setShowEditListingModal(false)
    setSelectedListing(null)
    resetListingForm()
  }
  
  const handleOpenDeleteConfirm = (listing: Listing) => {
    setSelectedListing(listing)
    setDeleteConfirmText('')
    setShowDeleteConfirmModal(true)
  }
  
  const handleCloseDeleteConfirm = () => {
    setShowDeleteConfirmModal(false)
    setSelectedListing(null)
    setDeleteConfirmText('')
  }
  
  // Reset listing form
  const resetListingForm = () => {
    setSubSkus([{ sku: '', quantity: '0' }])
    setListingFeatures([''])
    setCustomTypes([])
    setListingFormData({
      brandId: '',
      title: '',
      sku: '',
      subSku: '',
      category: '',
      collectionName: '',
      shipTypes: 'Standard Shipping',
      singleSetItem: 'Single Item',
      brandRealPrice: '',
      brandMiscellaneous: '',
      msrp: '',
      shippingPrice: '',
      commissionPrice: '',
      profitMarginPrice: '',
      ecommerceMiscellaneous: '',
      productCounts: '',
      mainImageUrl: '',
      galleryImages: [''],
      attributes: {
        origin: '',
        weight_lb: '',
        sub_category: '',
        volume_cuft: '',
        short_description: '',
        shipping_width_in: '',
        shipping_height_in: '',
        shipping_length_in: '',
        color: '',
        style: '',
        material: '',
        feature_1: '',
        feature_2: '',
        feature_3: '',
        feature_4: '',
        feature_5: '',
        feature_6: '',
        feature_7: '',
        product_dimension_inch: ''
      }
    })
    setMainImageFile(null)
    setGalleryImageFiles([])
  }
  
  // Submit listing form (Create)
  const handleSubmitListing = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('🚀 LISTING FORM SUBMISSION STARTED')
    
    if (!state.accessToken) {
      setError('No access token available')
      return
    }
    
    // Validate required fields
    if (!listingFormData.title.trim()) {
      setError('Listing title is required')
      return
    }
    if (!listingFormData.sku.trim()) {
      setError('SKU is required')
      return
    }
    if (!listingFormData.brandId) {
      setError('Brand is required')
      return
    }
    
    try {
      setIsSubmitting(true)
      setError(null)
      
      // Get brand name
      const selectedBrand = brands.find(b => b.id.toString() === listingFormData.brandId)
      const brandName = selectedBrand?.name || ''
      
      if (!brandName) {
        setError('Invalid brand selected')
        setIsSubmitting(false)
        return
      }
      
      // Prepare Sub SKUs (comma-separated)
      const filteredSubSkus = subSkus.filter(item => item.sku.trim() !== '')
      const subSkuString = filteredSubSkus.map(item => item.sku.trim()).join(', ')
      
      // Prepare listing features
      const filteredFeatures = listingFeatures.filter(f => f.trim() !== '')
      
      // Prepare attributes
      const attributesTemp: Record<string, any> = {}
      
      // Add string attributes
      if (listingFormData.attributes.sub_category) attributesTemp.subCategory = listingFormData.attributes.sub_category
      if (listingFormData.attributes.short_description) attributesTemp.shortDescription = listingFormData.attributes.short_description
      if (listingFormData.attributes.origin) attributesTemp.origin = listingFormData.attributes.origin
      if (listingFormData.attributes.product_dimension_inch) attributesTemp.productDimension = listingFormData.attributes.product_dimension_inch
      if (listingFormData.attributes.style) attributesTemp.style = listingFormData.attributes.style
      if (listingFormData.attributes.material) attributesTemp.material = listingFormData.attributes.material
      if (listingFormData.attributes.color) attributesTemp.color = listingFormData.attributes.color
      
      // Add numeric attributes
      const shippingLength = parseFloat(listingFormData.attributes.shipping_length_in)
      if (shippingLength > 0) attributesTemp.shippingLength = shippingLength
      
      const shippingWidth = parseFloat(listingFormData.attributes.shipping_width_in)
      if (shippingWidth > 0) attributesTemp.shippingWidth = shippingWidth
      
      const shippingHeight = parseFloat(listingFormData.attributes.shipping_height_in)
      if (shippingHeight > 0) attributesTemp.shippingHeight = shippingHeight
      
      const volume = parseFloat(listingFormData.attributes.volume_cuft)
      if (volume > 0) attributesTemp.volume = volume
      
      const weight = parseFloat(listingFormData.attributes.weight_lb)
      if (weight > 0) attributesTemp.weight = weight
      
      // Add features
      if (filteredFeatures.length > 0) {
        attributesTemp.features = filteredFeatures
      }
      
      // Add custom types
      customTypes.forEach((type) => {
        if (type.key.trim() && type.value.trim()) {
          attributesTemp[type.key] = type.value
        }
      })
      
      const attributesPayload = JSON.parse(JSON.stringify(attributesTemp))
      
      // Check if we have files to upload
      const hasMainImageFile = mainImageFile !== null
      const hasGalleryFiles = galleryImageFiles.length > 0
      const useFormData = hasMainImageFile || hasGalleryFiles
      
      let response: Response
      
      if (useFormData) {
        // ========= FormData Method (for file uploads) =========
        const formData = new FormData()
        
        // Add all core fields
        formData.append('title', listingFormData.title)
        formData.append('sku', listingFormData.sku)
        formData.append('subSku', subSkuString)
        formData.append('brandId', listingFormData.brandId)
        formData.append('brandName', brandName)
        formData.append('category', listingFormData.category || '')
        formData.append('collectionName', listingFormData.collectionName || '')
        formData.append('shipTypes', listingFormData.shipTypes || 'Standard Shipping')
        formData.append('singleSetItem', listingFormData.singleSetItem || 'Single Item')
        formData.append('brandRealPrice', listingFormData.brandRealPrice || '0')
        formData.append('brandMiscellaneous', listingFormData.brandMiscellaneous || '0')
        formData.append('msrp', listingFormData.msrp || '0')
        formData.append('shippingPrice', listingFormData.shippingPrice || '0')
        formData.append('commissionPrice', listingFormData.commissionPrice || '0')
        formData.append('profitMarginPrice', listingFormData.profitMarginPrice || '0')
        formData.append('ecommerceMiscellaneous', listingFormData.ecommerceMiscellaneous || '0')
        formData.append('productCounts', listingFormData.productCounts || '1')
        
        // Add main image file
        if (hasMainImageFile) {
          formData.append('mainImageUrl', mainImageFile!)
        } else if (listingFormData.mainImageUrl && listingFormData.mainImageUrl.trim() !== '') {
          formData.append('mainImageUrl', listingFormData.mainImageUrl)
        }
        
        // Add gallery image files
        if (hasGalleryFiles) {
          galleryImageFiles.forEach((file) => {
            formData.append('galleryImages', file)
          })
        } else {
          const filteredGalleryImages = listingFormData.galleryImages.filter(url => url.trim() !== '')
          if (filteredGalleryImages.length > 0) {
            filteredGalleryImages.forEach((url, index) => {
              formData.append(`galleryImages[${index}]`, url)
            })
          }
        }
        
        // Add attributes as nested fields
        Object.keys(attributesPayload).forEach((key) => {
          const value = attributesPayload[key]
          if (Array.isArray(value)) {
            value.forEach((item, index) => {
              formData.append(`attributes[${key}][${index}]`, String(item))
            })
          } else {
            formData.append(`attributes[${key}]`, String(value))
          }
        })
        
        response = await fetch('http://192.168.0.22:5000/api/listings', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${state.accessToken}`
          },
          body: formData
        })
      } else {
        // ========= JSON Method (for URL-only submission) =========
        const filteredGalleryImages = listingFormData.galleryImages.filter(url => url.trim() !== '')
        
        const payload = {
          sku: listingFormData.sku,
          subSku: subSkuString,
          brandName: brandName,
          title: listingFormData.title,
          category: listingFormData.category,
          collectionName: listingFormData.collectionName || '',
          shipTypes: listingFormData.shipTypes || 'Standard Shipping',
          singleSetItem: listingFormData.singleSetItem || 'Single Item',
          brandRealPrice: parseFloat(listingFormData.brandRealPrice) || 0,
          brandMiscellaneous: parseFloat(listingFormData.brandMiscellaneous) || 0,
          msrp: parseFloat(listingFormData.msrp) || 0,
          shippingPrice: parseFloat(listingFormData.shippingPrice) || 0,
          commissionPrice: parseFloat(listingFormData.commissionPrice) || 0,
          profitMarginPrice: parseFloat(listingFormData.profitMarginPrice) || 0,
          ecommerceMiscellaneous: parseFloat(listingFormData.ecommerceMiscellaneous) || 0,
          productCounts: parseInt(listingFormData.productCounts) || 1,
          mainImageUrl: listingFormData.mainImageUrl || '',
          galleryImages: filteredGalleryImages,
          attributes: attributesPayload
        }
        
        response = await fetch('http://192.168.0.22:5000/api/listings', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${state.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        })
      }
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || errorData.message || 'Failed to create listing')
      }
      
      const data = await response.json()
      console.log('Listing created successfully:', data)
      
      // Close modal and refresh listings
      handleCloseAddListing()
      loadListings()
      
    } catch (err: any) {
      console.error('Failed to create listing:', err)
      setError(err.message || 'Failed to create listing')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Handle main image file selection
  const handleMainImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file')
        return
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB')
        return
      }
      
      setMainImageFile(file)
      setListingFormData({...listingFormData, mainImageUrl: ''})
      setError(null)
    }
  }
  
  // Handle gallery images selection
  const handleGalleryImagesSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    if (files.length === 0) return
    
    // Validate each file
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        setError('Please select only image files')
        return
      }
      
      if (file.size > 5 * 1024 * 1024) {
        setError(`Image "${file.name}" is too large. Each image must be less than 5MB`)
        return
      }
    }
    
    setGalleryImageFiles(files)
    setListingFormData({...listingFormData, galleryImages: ['']})
    setError(null)
  }
  
  // Update listing
  const handleUpdateListing = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedListing || !state.accessToken) return
    
    try {
      setIsSubmitting(true)
      setError(null)
      
      // Prepare Sub SKUs
      const filteredSubSkus = subSkus.filter(item => item.sku.trim() !== '')
      const subSkuString = filteredSubSkus.map(item => item.sku.trim()).join(', ')
      
      // Prepare attributes
      const filteredFeatures = listingFeatures.filter(f => f.trim() !== '')
      const attributesTemp: Record<string, any> = {}
      
      if (listingFormData.attributes.sub_category) attributesTemp.subCategory = listingFormData.attributes.sub_category
      if (listingFormData.attributes.short_description) attributesTemp.shortDescription = listingFormData.attributes.short_description
      if (listingFormData.attributes.origin) attributesTemp.origin = listingFormData.attributes.origin
      if (listingFormData.attributes.product_dimension_inch) attributesTemp.productDimension = listingFormData.attributes.product_dimension_inch
      if (listingFormData.attributes.style) attributesTemp.style = listingFormData.attributes.style
      if (listingFormData.attributes.material) attributesTemp.material = listingFormData.attributes.material
      if (listingFormData.attributes.color) attributesTemp.color = listingFormData.attributes.color
      
      if (filteredFeatures.length > 0) {
        attributesTemp.features = filteredFeatures
      }
      
      customTypes.forEach((type) => {
        if (type.key.trim() && type.value.trim()) {
          attributesTemp[type.key] = type.value
        }
      })
      
      const attributesPayload = JSON.parse(JSON.stringify(attributesTemp))
      
      const payload = {
        title: listingFormData.title,
        sku: listingFormData.sku,
        subSku: subSkuString,
        category: listingFormData.category,
        collectionName: listingFormData.collectionName,
        shipTypes: listingFormData.shipTypes,
        singleSetItem: listingFormData.singleSetItem,
        attributes: attributesPayload
      }
      
      const response = await fetch(`http://192.168.0.22:5000/api/listings/${selectedListing.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${state.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update listing')
      }
      
      // Close modal and refresh
      handleCloseEditListing()
      loadListings(pagination.currentPage)
      
    } catch (err: any) {
      setError(err.message || 'Failed to update listing')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Delete listing
  const handleDeleteListing = async () => {
    if (!selectedListing || !state.accessToken) return
    
    if (deleteConfirmText !== 'DELETE') {
      setError('Please type DELETE to confirm')
      return
    }
    
    try {
      setIsDeleting(true)
      setError(null)
      
      const response = await fetch(`http://192.168.0.22:5000/api/listings/${selectedListing.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${state.accessToken}`
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete listing')
      }
      
      // Close modal and refresh
      handleCloseDeleteConfirm()
      loadListings(pagination.currentPage)
      
    } catch (err: any) {
      setError(err.message || 'Failed to delete listing')
    } finally {
      setIsDeleting(false)
    }
  }
  
  // View listing info
  const handleViewInfo = (listing: Listing) => {
    setSelectedListingInfo(listing)
    setShowInfoModal(true)
  }
  
  // Checkbox handlers
  const handleSelectRow = (id: number) => {
    const newSelected = new Set(selectedRows)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedRows(newSelected)
  }
  
  const handleSelectAll = () => {
    if (selectedRows.size === listings.length) {
      setSelectedRows(new Set())
    } else {
      setSelectedRows(new Set(listings.map(l => l.id)))
    }
  }
  
  const isRowSelected = (id: number) => selectedRows.has(id)
  const isAllSelected = () => listings.length > 0 && selectedRows.size === listings.length
  const isSomeSelected = () => selectedRows.size > 0 && selectedRows.size < listings.length

  return (
    <div className="space-y-4">
      {/* Main Container Card */}
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Listings</h1>
            <div className="flex gap-2">
              <Button 
                onClick={() => {/* TODO: Add export handler */}} 
                size="sm"
                variant="outline"
                className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <UnifiedAddNew
                platformType="listings"
                onAddListing={() => handleOpenAddListing()}
                onBulkAddListing={() => {/* TODO: Add bulk add functionality */}}
                onImportListing={() => {/* TODO: Add import file functionality */}}
              />
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search products..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleApplyFilters()
                  }
                }}
                className="pl-10 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
              size="sm"
              className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
              <ChevronRight className="w-3 h-3 ml-1 rotate-90" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters Panel */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Search</label>
                <Input
                  placeholder="Search by title, SKU..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Brand</label>
                <Select value={filters.brandId} onValueChange={(value) => handleFilterChange('brandId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Brands" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Brands</SelectItem>
                    {brands.map((brand) => (
                      <SelectItem key={brand.id} value={brand.id.toString()}>
                        {brand.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <Input
                  placeholder="Filter by category"
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={handleApplyFilters} size="sm">
                Apply Filters
              </Button>
              <Button onClick={handleResetFilters} variant="outline" size="sm">
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Listings Table */}
      <Card>
        <CardContent className="p-0">
          <div 
            ref={tableRef}
            className="overflow-auto max-h-[70vh] cursor-grab active:cursor-grabbing"
            style={{ 
              scrollbarWidth: 'thin',
              scrollbarColor: '#cbd5e1 #f1f5f9'
            }}
            {...events}
          >
            <Table>
              <TableHeader className="sticky top-0 bg-white dark:bg-slate-800 z-10">
                <TableRow>
                  <TableHead className="w-12 sticky left-0 bg-white dark:bg-slate-800 z-20 border-r">
                    <input
                      type="checkbox"
                      checked={isAllSelected()}
                      ref={(el) => {
                        if (el) el.indeterminate = isSomeSelected()
                      }}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </TableHead>
                  {columns.map((col) => (
                    <TableHead
                      key={col.key}
                      className="relative bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 text-center"
                      style={{ width: `${getColumnWidth(col.key, col.width)}px`, minWidth: `${getColumnWidth(col.key, col.width)}px` }}
                    >
                      <div className="flex items-center justify-center pr-2">
                        <span>{col.label}</span>
                        <div
                          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize bg-gray-400 dark:bg-gray-600 hover:bg-blue-400 dark:hover:bg-blue-500 transition-colors border-r-2 border-transparent hover:border-blue-500"
                          onMouseDown={(e) => handleResizeStart(e, col.key, getColumnWidth(col.key, col.width))}
                          title="Drag to resize column"
                        />
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="w-12 sticky left-0 bg-white dark:bg-slate-800 z-10 border-r">
                        <Skeleton className="h-4 w-4" />
                      </TableCell>
                      {columns.map((_, cellIdx) => (
                        <TableCell key={cellIdx}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : listings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columns.length + 1} className="text-center py-8 text-gray-500">
                      No listings found
                    </TableCell>
                  </TableRow>
                ) : (
                  listings.map((listing) => (
                    <TableRow key={listing.id} className={isRowSelected(listing.id) ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}>
                      <TableCell className="w-12 sticky left-0 bg-white dark:bg-slate-800 z-10 border-r">
                        <input
                          type="checkbox"
                          checked={isRowSelected(listing.id)}
                          onChange={() => handleSelectRow(listing.id)}
                          className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </TableCell>
                      
                      {/* Image Column */}
                      <TableCell className="text-center" style={{ width: `${getColumnWidth('mainImage', 100)}px`, minWidth: `${getColumnWidth('mainImage', 100)}px` }}>
                        <div className="flex items-center justify-center">
                          {listing.mainImageUrl ? (
                            <button
                              onClick={() => {
                                // Collect all images (main + gallery)
                                const allImages = [listing.mainImageUrl!]
                                if (listing.galleryImages && listing.galleryImages.length > 0) {
                                  allImages.push(...listing.galleryImages)
                                }
                                openGalleryModal(allImages, listing.title)
                              }}
                              className="hover:scale-105 transition-transform cursor-pointer rounded-full overflow-hidden border-2 border-emerald-500 dark:border-emerald-400"
                              title={`Click to view all images`}
                            >
                              <img
                                src={getProxiedImageUrl(listing.mainImageUrl) || ''}
                                alt={listing.title}
                                className="w-10 h-10 rounded-full object-cover"
                                referrerPolicy="no-referrer"
                                loading="lazy"
                                onError={(e) => {
                                  console.error('❌ Image failed to load:', listing.mainImageUrl)
                                  console.error('Proxied URL:', getProxiedImageUrl(listing.mainImageUrl))
                                  const target = e.currentTarget as HTMLImageElement
                                  target.style.display = 'none'
                                  const parent = target.parentElement
                                  if (parent) {
                                    parent.innerHTML = '<div class="w-10 h-10 rounded-full flex items-center justify-center bg-red-100 dark:bg-red-900/20 rounded" title="Image failed to load - check console"><svg class="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg></div>'
                                  }
                                }}
                              />
                            </button>
                          ) : (
                            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded">
                              <ImageIcon className="h-5 w-5 text-gray-400" />
                            </div>
                          )}
                        </div>
                      </TableCell>
                      
                      {/* Title Column */}
                      <TableCell className="text-center" style={{ width: `${getColumnWidth('title', 430)}px`, minWidth: `${getColumnWidth('title', 430)}px` }}>
                        {renderExpandableCell(listing.title, listing.id, 'title', 430)}
                      </TableCell>
                      
                      {/* SKU Column */}
                      <TableCell className="text-center" style={{ width: `${getColumnWidth('sku', 190)}px`, minWidth: `${getColumnWidth('sku', 190)}px` }}>
                        {renderExpandableCell(listing.sku, listing.id, 'sku', 190)}
                      </TableCell>
                      
                      {/* Sub SKU Column */}
                      <TableCell className="text-center" style={{ width: `${getColumnWidth('subSku', 170)}px`, minWidth: `${getColumnWidth('subSku', 170)}px` }}>
                        {renderExpandableCell(listing.subSku || '-', listing.id, 'subSku', 170)}
                      </TableCell>
                      
                      {/* Brand Column - Shows custom brand name from settings */}
                      <TableCell className="text-center" style={{ width: `${getColumnWidth('brand', 200)}px`, minWidth: `${getColumnWidth('brand', 200)}px` }}>
                        <Badge variant="outline" className="bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300 border-teal-300 dark:border-teal-700">
                          {listing.brand || listing.brandName || '-'}
                        </Badge>
                      </TableCell>
                      
                      {/* Category Column */}
                      <TableCell className="text-center" style={{ width: `${getColumnWidth('category', 130)}px`, minWidth: `${getColumnWidth('category', 130)}px` }}>
                        <Badge variant="outline" className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-300 dark:border-purple-700">
                          {listing.category || '-'}
                        </Badge>
                      </TableCell>
                      
                      {/* Brand Price Column */}
                      <TableCell className="text-center" style={{ width: `${getColumnWidth('brandPrice', 120)}px`, minWidth: `${getColumnWidth('brandPrice', 120)}px` }}>
                        <span className="text-green-600 dark:text-green-400 font-semibold">${formatPrice(listing.brandPrice)}</span>
                      </TableCell>
                      
                      {/* MSRP Column */}
                      <TableCell className="text-center" style={{ width: `${getColumnWidth('msrp', 100)}px`, minWidth: `${getColumnWidth('msrp', 100)}px` }}>
                        <span className="text-blue-600 dark:text-blue-400 font-semibold">${formatPrice(listing.msrp)}</span>
                      </TableCell>
                      
                      {/* Ecom Price Column */}
                      <TableCell className="text-center" style={{ width: `${getColumnWidth('ecommercePrice', 120)}px`, minWidth: `${getColumnWidth('ecommercePrice', 120)}px` }}>
                        <span className="text-indigo-600 dark:text-indigo-400 font-semibold">${formatPrice(listing.ecommercePrice)}</span>
                      </TableCell>
                      
                      {/* Product Count Column */}
                      <TableCell className="text-center" style={{ width: `${getColumnWidth('productCounts', 130)}px`, minWidth: `${getColumnWidth('productCounts', 130)}px` }}>
                        <div className="flex flex-wrap gap-1 justify-center">
                          {listing.productCounts 
                            ? (typeof listing.productCounts === 'object' 
                                ? Object.values(listing.productCounts).map((count, idx) => (
                                    <Badge 
                                      key={idx}
                                      variant="outline" 
                                      className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-300 dark:border-purple-700"
                                    >
                                      {String(count)}
                                    </Badge>
                                  ))
                                : (
                                    <Badge variant="outline" className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-300 dark:border-purple-700">
                                      {listing.productCounts}
                                    </Badge>
                                  ))
                            : (
                                <Badge variant="outline" className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-300 dark:border-purple-700">
                                  0
                                </Badge>
                              )}
                        </div>
                      </TableCell>
                      
                      {/* Inventory Array Column */}
                      <TableCell className="text-center" style={{ width: `${getColumnWidth('inventoryArray', 150)}px`, minWidth: `${getColumnWidth('inventoryArray', 150)}px` }}>
                        {listing.inventoryArray && listing.inventoryArray.length > 0 ? (
                          <div className="flex flex-wrap gap-1 justify-center">
                            {listing.inventoryArray.map((qty, idx) => (
                              <Badge 
                                key={idx} 
                                variant="outline" 
                                className="bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300 border-cyan-300 dark:border-cyan-700 text-xs"
                              >
                                {qty}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      
                      {/* Gallery Images Column */}
                      <TableCell className="text-center" style={{ width: `${getColumnWidth('galleryImages', 120)}px`, minWidth: `${getColumnWidth('galleryImages', 120)}px` }}>
                        {listing.galleryImages && listing.galleryImages.length > 0 ? (
                          <div className="flex flex-wrap gap-1 justify-center">
                            {listing.galleryImages.slice(0, 3).map((img, idx) => (
                              <img
                                key={idx}
                                src={getProxiedImageUrl(img) || ''}
                                alt={`Gallery ${idx + 1}`}
                                className="w-8 h-8 object-cover rounded-full border border-gray-300 dark:border-gray-600 cursor-pointer hover:scale-110 transition-transform"
                                onClick={() => {
                                  const allImages = [listing.mainImageUrl!]
                                  if (listing.galleryImages && listing.galleryImages.length > 0) {
                                    allImages.push(...listing.galleryImages)
                                  }
                                  openGalleryModal(allImages, listing.title)
                                }}
                              />
                            ))}
                            {listing.galleryImages.length > 3 && (
                              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 flex items-center justify-center text-xs font-semibold text-gray-600 dark:text-gray-300">
                                +{listing.galleryImages.length - 3}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-center block">-</span>
                        )}
                      </TableCell>
                      
                      {/* Status Column */}
                      <TableCell className="text-center" style={{ width: `${getColumnWidth('status', 150)}px`, minWidth: `${getColumnWidth('status', 130)}px` }}>
                        {listing.status === 'In Stock' && (
                          <Badge variant="default" className="bg-green-500">In Stock</Badge>
                        )}
                        {listing.status === 'Warning' && (
                          <Badge variant="default" className="bg-yellow-500">Low Stock</Badge>
                        )}
                        {listing.status === 'Out of Stock' && (
                          <Badge variant="destructive">Out of Stock</Badge>
                        )}
                        {!listing.status && <Badge variant="outline">Unknown</Badge>}
                      </TableCell>
                      
                      {/* Quantity Column */}
                      <TableCell className="text-center" style={{ width: `${getColumnWidth('quantity', 100)}px`, minWidth: `${getColumnWidth('quantity', 100)}px` }}>
                        {listing.quantity ?? 0}
                      </TableCell>
                      
                      {/* Actions Column */}
                      <TableCell className="text-center" style={{ width: `${getColumnWidth('actions', 120)}px`, minWidth: `${getColumnWidth('actions', 120)}px` }}>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            onClick={() => handleViewInfo(listing)}
                            variant="ghost"
                            size="sm"
                          >
                            <Info className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => handleOpenEditListing(listing)}
                            variant="ghost"
                            size="sm"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => handleOpenDeleteConfirm(listing)}
                            variant="ghost"
                            size="sm"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Showing {listings.length > 0 ? ((pagination.currentPage - 1) * pagination.itemsPerPage) + 1 : 0} to{' '}
          {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalCount)} of{' '}
          {pagination.totalCount} listings
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={goToFirstPage}
            disabled={!pagination.hasPrevPage}
            variant="outline"
            size="sm"
          >
            <ChevronsLeft className="w-4 h-4" />
          </Button>
          <Button
            onClick={goToPrevPage}
            disabled={!pagination.hasPrevPage}
            variant="outline"
            size="sm"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          <Button
            onClick={goToNextPage}
            disabled={!pagination.hasNextPage}
            variant="outline"
            size="sm"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button
            onClick={goToLastPage}
            disabled={!pagination.hasNextPage}
            variant="outline"
            size="sm"
          >
            <ChevronsRight className="w-4 h-4" />
          </Button>
        </div>
      </div>


      {/* Add Listing Modal */}
      {showAddListingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Add New Listing</h2>
              <button onClick={handleCloseAddListing} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmitListing} className="p-6 space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Title *</label>
                    <Input
                      value={listingFormData.title}
                      onChange={(e) => setListingFormData({...listingFormData, title: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Brand *</label>
                    <Select
                      value={listingFormData.brandId}
                      onValueChange={(value) => setListingFormData({...listingFormData, brandId: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Brand" />
                      </SelectTrigger>
                      <SelectContent>
                        {brands.map((brand) => (
                          <SelectItem key={brand.id} value={brand.id.toString()}>
                            {brand.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">SKU *</label>
                    <Input
                      value={listingFormData.sku}
                      onChange={(e) => setListingFormData({...listingFormData, sku: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Category</label>
                    <Input
                      value={listingFormData.category}
                      onChange={(e) => setListingFormData({...listingFormData, category: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Collection Name</label>
                    <Input
                      value={listingFormData.collectionName}
                      onChange={(e) => setListingFormData({...listingFormData, collectionName: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Ship Types</label>
                    <Select
                      value={listingFormData.shipTypes}
                      onValueChange={(value) => setListingFormData({...listingFormData, shipTypes: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Standard Shipping">Standard Shipping</SelectItem>
                        <SelectItem value="Express Shipping">Express Shipping</SelectItem>
                        <SelectItem value="Freight Shipping">Freight Shipping</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Single/Set Item</label>
                    <Select
                      value={listingFormData.singleSetItem}
                      onValueChange={(value) => setListingFormData({...listingFormData, singleSetItem: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Single Item">Single Item</SelectItem>
                        <SelectItem value="Set Item">Set Item</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {/* <div>
                    <label className="block text-sm font-medium mb-1">Item Count</label>
                    <Input
                      type="number"
                      value={listingFormData.productCounts}
                      onChange={(e) => setListingFormData({...listingFormData, productCounts: e.target.value})}
                    />
                  </div> */}
                </div>
              </div>

              {/* Sub SKUs */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Sub SKUs</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Add sub SKUs with their respective quantities</p>
                <div className="flex gap-2 mb-2">
                  <div className="flex-1">
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Sub SKU</label>
                  </div>
                  <div className="w-32">
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Quantity</label>
                  </div>
                  <div className="w-20"></div>
                </div>
                {subSkus.map((item, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <div className="flex-1">
                      <Input
                        value={item.sku}
                        onChange={(e) => {
                          const newSkus = [...subSkus]
                          newSkus[index].sku = e.target.value
                          setSubSkus(newSkus)
                        }}
                        placeholder={`Sub SKU ${index + 1}`}
                      />
                    </div>
                    <div className="w-32 flex items-center gap-1">
                      <Button
                        type="button"
                        onClick={() => {
                          const newSkus = [...subSkus]
                          const currentQty = parseInt(newSkus[index].quantity) || 0
                          newSkus[index].quantity = Math.max(0, currentQty - 1).toString()
                          setSubSkus(newSkus)
                        }}
                        variant="outline"
                        size="sm"
                        className="h-9 w-9 p-0"
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <div className="flex-1 text-center font-semibold text-sm py-2 px-2 border rounded bg-gray-50 dark:bg-gray-700">
                        {item.quantity || '0'}
                      </div>
                      <Button
                        type="button"
                        onClick={() => {
                          const newSkus = [...subSkus]
                          const currentQty = parseInt(newSkus[index].quantity) || 0
                          newSkus[index].quantity = (currentQty + 1).toString()
                          setSubSkus(newSkus)
                        }}
                        variant="outline"
                        size="sm"
                        className="h-9 w-9 p-0"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="w-20">
                      {subSkus.length > 1 && (
                        <Button
                          type="button"
                          onClick={() => setSubSkus(subSkus.filter((_, i) => i !== index))}
                          variant="outline"
                          size="sm"
                          className="w-full"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  onClick={() => setSubSkus([...subSkus, { sku: '', quantity: '0' }])}
                  variant="outline"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Sub SKU
                </Button>
              </div>

              {/* Pricing */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Pricing</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Brand Real Price</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={listingFormData.brandRealPrice}
                      onChange={(e) => setListingFormData({...listingFormData, brandRealPrice: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Brand Miscellaneous</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={listingFormData.brandMiscellaneous}
                      onChange={(e) => setListingFormData({...listingFormData, brandMiscellaneous: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">MSRP *</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={listingFormData.msrp}
                      onChange={(e) => setListingFormData({...listingFormData, msrp: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Shipping Price</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={listingFormData.shippingPrice}
                      onChange={(e) => setListingFormData({...listingFormData, shippingPrice: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Commission Price</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={listingFormData.commissionPrice}
                      onChange={(e) => setListingFormData({...listingFormData, commissionPrice: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Profit Margin Price</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={listingFormData.profitMarginPrice}
                      onChange={(e) => setListingFormData({...listingFormData, profitMarginPrice: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Ecommerce Miscellaneous</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={listingFormData.ecommerceMiscellaneous}
                      onChange={(e) => setListingFormData({...listingFormData, ecommerceMiscellaneous: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              {/* Images */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Images</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Main Image</label>
                    <div className="flex gap-2">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleMainImageSelect}
                        className="flex-1"
                      />
                      <span className="text-sm text-gray-500">OR</span>
                      <Input
                        placeholder="Enter image URL"
                        value={listingFormData.mainImageUrl}
                        onChange={(e) => setListingFormData({...listingFormData, mainImageUrl: e.target.value})}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Gallery Images</label>
                    <Input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleGalleryImagesSelect}
                      className="mb-2"
                    />
                    <div className="text-sm text-gray-500 mb-2">OR enter URLs:</div>
                    {listingFormData.galleryImages.map((url, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <Input
                          placeholder={`Gallery Image URL ${index + 1}`}
                          value={url}
                          onChange={(e) => {
                            const newImages = [...listingFormData.galleryImages]
                            newImages[index] = e.target.value
                            setListingFormData({...listingFormData, galleryImages: newImages})
                          }}
                        />
                        {listingFormData.galleryImages.length > 1 && (
                          <Button
                            type="button"
                            onClick={() => {
                              const newImages = listingFormData.galleryImages.filter((_, i) => i !== index)
                              setListingFormData({...listingFormData, galleryImages: newImages})
                            }}
                            variant="outline"
                            size="sm"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      onClick={() => setListingFormData({
                        ...listingFormData,
                        galleryImages: [...listingFormData.galleryImages, '']
                      })}
                      variant="outline"
                      size="sm"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add URL
                    </Button>
                  </div>
                </div>
              </div>

              {/* Attributes */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Attributes</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Origin</label>
                    <Input
                      value={listingFormData.attributes.origin}
                      onChange={(e) => setListingFormData({
                        ...listingFormData,
                        attributes: {...listingFormData.attributes, origin: e.target.value}
                      })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Sub Category</label>
                    <Input
                      value={listingFormData.attributes.sub_category}
                      onChange={(e) => setListingFormData({
                        ...listingFormData,
                        attributes: {...listingFormData.attributes, sub_category: e.target.value}
                      })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Color</label>
                    <Input
                      value={listingFormData.attributes.color}
                      onChange={(e) => setListingFormData({
                        ...listingFormData,
                        attributes: {...listingFormData.attributes, color: e.target.value}
                      })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Style</label>
                    <Input
                      value={listingFormData.attributes.style}
                      onChange={(e) => setListingFormData({
                        ...listingFormData,
                        attributes: {...listingFormData.attributes, style: e.target.value}
                      })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Material</label>
                    <Input
                      value={listingFormData.attributes.material}
                      onChange={(e) => setListingFormData({
                        ...listingFormData,
                        attributes: {...listingFormData.attributes, material: e.target.value}
                      })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Weight (lb)</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={listingFormData.attributes.weight_lb}
                      onChange={(e) => setListingFormData({
                        ...listingFormData,
                        attributes: {...listingFormData.attributes, weight_lb: e.target.value}
                      })}
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-md">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="button" onClick={handleCloseAddListing} variant="outline">
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create Listing'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Listing Modal */}
      {showEditListingModal && selectedListing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Edit Listing</h2>
              <button onClick={handleCloseEditListing} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateListing} className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Title</label>
                    <Input
                      value={listingFormData.title}
                      onChange={(e) => setListingFormData({...listingFormData, title: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">SKU</label>
                    <Input
                      value={listingFormData.sku}
                      onChange={(e) => setListingFormData({...listingFormData, sku: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Category</label>
                    <Input
                      value={listingFormData.category}
                      onChange={(e) => setListingFormData({...listingFormData, category: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Collection Name</label>
                    <Input
                      value={listingFormData.collectionName}
                      onChange={(e) => setListingFormData({...listingFormData, collectionName: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              {/* Sub SKUs */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Sub SKUs</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Edit sub SKUs with their respective quantities</p>
                <div className="flex gap-2 mb-2">
                  <div className="flex-1">
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Sub SKU</label>
                  </div>
                  <div className="w-32">
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Quantity</label>
                  </div>
                  <div className="w-20"></div>
                </div>
                {subSkus.map((item, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <div className="flex-1">
                      <Input
                        value={item.sku}
                        onChange={(e) => {
                          const newSkus = [...subSkus]
                          newSkus[index].sku = e.target.value
                          setSubSkus(newSkus)
                        }}
                        placeholder={`Sub SKU ${index + 1}`}
                      />
                    </div>
                    <div className="w-32 flex items-center gap-1">
                      <Button
                        type="button"
                        onClick={() => {
                          const newSkus = [...subSkus]
                          const currentQty = parseInt(newSkus[index].quantity) || 0
                          newSkus[index].quantity = Math.max(0, currentQty - 1).toString()
                          setSubSkus(newSkus)
                        }}
                        variant="outline"
                        size="sm"
                        className="h-9 w-9 p-0"
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <div className="flex-1 text-center font-semibold text-sm py-2 px-2 border rounded bg-gray-50 dark:bg-gray-700">
                        {item.quantity || '0'}
                      </div>
                      <Button
                        type="button"
                        onClick={() => {
                          const newSkus = [...subSkus]
                          const currentQty = parseInt(newSkus[index].quantity) || 0
                          newSkus[index].quantity = (currentQty + 1).toString()
                          setSubSkus(newSkus)
                        }}
                        variant="outline"
                        size="sm"
                        className="h-9 w-9 p-0"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="w-20">
                      {subSkus.length > 1 && (
                        <Button
                          type="button"
                          onClick={() => setSubSkus(subSkus.filter((_, i) => i !== index))}
                          variant="outline"
                          size="sm"
                          className="w-full"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  onClick={() => setSubSkus([...subSkus, { sku: '', quantity: '0' }])}
                  variant="outline"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Sub SKU
                </Button>
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-md">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="button" onClick={handleCloseEditListing} variant="outline">
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Updating...' : 'Update Listing'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmModal && selectedListing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full mx-4 p-6">
            <h2 className="text-xl font-bold mb-4">Delete Listing</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Are you sure you want to delete this listing?
            </p>
            <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded mb-4">
              <p className="font-semibold">{selectedListing.title}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">SKU: {selectedListing.sku}</p>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Type <span className="font-bold">DELETE</span> to confirm:
            </p>
            <Input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE"
              className="mb-4"
            />
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-md mb-4">
                {error}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button onClick={handleCloseDeleteConfirm} variant="outline">
                Cancel
              </Button>
              <Button
                onClick={handleDeleteListing}
                variant="destructive"
                disabled={isDeleting || deleteConfirmText !== 'DELETE'}
              >
                {isDeleting ? 'Deleting...' : 'Delete Listing'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Info Modal */}
      {showInfoModal && selectedListingInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Listing Details</h2>
              <Button
                onClick={() => setShowInfoModal(false)}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-slate-700"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Images Section */}
              {(selectedListingInfo.mainImageUrl || (selectedListingInfo.galleryImages && selectedListingInfo.galleryImages.length > 0)) && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-700/50 dark:to-slate-800/50 rounded-lg p-6 border border-blue-200 dark:border-slate-600">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    Listing Images
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {selectedListingInfo.mainImageUrl && (
                      <div>
                        <p className="text-xs font-medium text-gray-600 dark:text-slate-400 mb-2">Main Image</p>
                        <img
                          src={getProxiedImageUrl(selectedListingInfo.mainImageUrl) || ''}
                          alt="Main"
                          onClick={() => {
                            // Collect all images (main + gallery)
                            const allImages = [selectedListingInfo.mainImageUrl!]
                            if (selectedListingInfo.galleryImages && selectedListingInfo.galleryImages.length > 0) {
                              allImages.push(...selectedListingInfo.galleryImages)
                            }
                            openGalleryModal(allImages, selectedListingInfo.title)
                          }}
                          className="w-full h-40 object-cover rounded-lg border-2 border-emerald-500 dark:border-emerald-400 shadow-md cursor-pointer hover:scale-105 transition-transform"
                        />
                      </div>
                    )}
                    {selectedListingInfo.galleryImages && selectedListingInfo.galleryImages.map((img, idx) => (
                      <div key={idx}>
                        <p className="text-xs font-medium text-gray-600 dark:text-slate-400 mb-2">Gallery {idx + 1}</p>
                        <img
                          src={getProxiedImageUrl(img) || ''}
                          alt={`Gallery ${idx + 1}`}
                          onClick={() => {
                            // Collect all images (main + gallery)
                            const allImages = [selectedListingInfo.mainImageUrl!]
                            if (selectedListingInfo.galleryImages && selectedListingInfo.galleryImages.length > 0) {
                              allImages.push(...selectedListingInfo.galleryImages)
                            }
                            openGalleryModal(allImages, selectedListingInfo.title)
                          }}
                          className="w-full h-40 object-cover rounded-lg border-2 border-cyan-500 dark:border-cyan-400 shadow-md cursor-pointer hover:scale-105 transition-transform"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Description Section */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-slate-700/50 dark:to-slate-800/50 rounded-lg p-6 border border-purple-200 dark:border-slate-600">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Description</h4>
                <div className="overflow-x-auto">
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-semibold bg-gray-50 dark:bg-slate-700/50 w-48">Title</TableCell>
                        <TableCell className="font-medium">{selectedListingInfo.title}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-semibold bg-gray-50 dark:bg-slate-700/50">Brand</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300 border-teal-300 dark:border-teal-700">
                            {selectedListingInfo.brand || '-'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-semibold bg-gray-50 dark:bg-slate-700/50">SKU</TableCell>
                        <TableCell className="font-mono text-sm">{selectedListingInfo.sku}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-semibold bg-gray-50 dark:bg-slate-700/50">Sub SKU</TableCell>
                        <TableCell className="font-mono text-sm">{selectedListingInfo.subSku || '-'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-semibold bg-gray-50 dark:bg-slate-700/50">Category</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-300 dark:border-purple-700">
                            {selectedListingInfo.category || '-'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-semibold bg-gray-50 dark:bg-slate-700/50">Collection Name</TableCell>
                        <TableCell>{selectedListingInfo.collectionName || '-'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-semibold bg-gray-50 dark:bg-slate-700/50">Single/Set Item</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-300 dark:border-blue-700">
                            {selectedListingInfo.singleSetItem || '-'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-semibold bg-gray-50 dark:bg-slate-700/50">Ship Types</TableCell>
                        <TableCell>{selectedListingInfo.shipTypes || '-'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-semibold bg-gray-50 dark:bg-slate-700/50">Product Counts</TableCell>
                        <TableCell>
                          {selectedListingInfo.productCounts 
                            ? (typeof selectedListingInfo.productCounts === 'object' 
                                ? JSON.stringify(selectedListingInfo.productCounts) 
                                : selectedListingInfo.productCounts)
                            : '-'}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Pricing Information */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-slate-700/50 dark:to-slate-800/50 rounded-lg p-6 border border-green-200 dark:border-slate-600">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Pricing Information</h4>
                <div className="overflow-x-auto">
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-semibold bg-gray-50 dark:bg-slate-700/50 w-48">Brand Real Price</TableCell>
                        <TableCell className="text-green-600 dark:text-green-400 font-semibold">${formatPrice(selectedListingInfo.brandRealPrice)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-semibold bg-gray-50 dark:bg-slate-700/50">Brand Miscellaneous</TableCell>
                        <TableCell>${formatPrice(selectedListingInfo.brandMiscellaneous)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-semibold bg-gray-50 dark:bg-slate-700/50">Brand Price</TableCell>
                        <TableCell className="text-green-600 dark:text-green-400 font-semibold">${formatPrice(selectedListingInfo.brandPrice)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-semibold bg-gray-50 dark:bg-slate-700/50">MSRP</TableCell>
                        <TableCell className="text-blue-600 dark:text-blue-400 font-semibold">${formatPrice(selectedListingInfo.msrp)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-semibold bg-gray-50 dark:bg-slate-700/50">Shipping Price</TableCell>
                        <TableCell>${formatPrice(selectedListingInfo.shippingPrice)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-semibold bg-gray-50 dark:bg-slate-700/50">Commission Price</TableCell>
                        <TableCell>${formatPrice(selectedListingInfo.commissionPrice)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-semibold bg-gray-50 dark:bg-slate-700/50">Profit Margin Price</TableCell>
                        <TableCell className="text-orange-600 dark:text-orange-400 font-semibold">${formatPrice(selectedListingInfo.profitMarginPrice)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-semibold bg-gray-50 dark:bg-slate-700/50">Ecommerce Miscellaneous</TableCell>
                        <TableCell>${formatPrice(selectedListingInfo.ecommerceMiscellaneous)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-semibold bg-gray-50 dark:bg-slate-700/50">Ecommerce Price</TableCell>
                        <TableCell className="text-indigo-600 dark:text-indigo-400 font-semibold text-lg">${formatPrice(selectedListingInfo.ecommercePrice)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Inventory Status */}
              <div className="bg-gradient-to-br from-cyan-50 to-sky-50 dark:from-slate-700/50 dark:to-slate-800/50 rounded-lg p-6 border border-cyan-200 dark:border-slate-600">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Inventory Status</h4>
                <div className="overflow-x-auto">
                  <Table>
                    <TableBody>
                      {selectedListingInfo.status && (
                        <TableRow>
                          <TableCell className="font-semibold bg-gray-50 dark:bg-slate-700/50 w-48">Status</TableCell>
                          <TableCell>
                            <Badge
                              variant={selectedListingInfo.status === 'In Stock' ? 'default' : selectedListingInfo.status === 'Warning' ? 'default' : 'destructive'}
                              className={selectedListingInfo.status === 'In Stock' ? 'bg-green-500' : selectedListingInfo.status === 'Warning' ? 'bg-yellow-500' : ''}
                            >
                              {selectedListingInfo.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      )}
                      <TableRow>
                        <TableCell className="font-semibold bg-gray-50 dark:bg-slate-700/50 w-48">Inventory</TableCell>
                        <TableCell className="font-semibold text-lg">{selectedListingInfo.quantity ?? 0}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-semibold bg-gray-50 dark:bg-slate-700/50">Inventory Count</TableCell>
                        <TableCell>
                          {selectedListingInfo.inventoryArray && selectedListingInfo.inventoryArray.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {selectedListingInfo.inventoryArray.map((qty, idx) => (
                                <Badge 
                                  key={idx} 
                                  variant="outline" 
                                  className="bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300 border-cyan-300 dark:border-cyan-700"
                                >
                                  {qty}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Attributes */}
              {selectedListingInfo.attributes && Object.keys(selectedListingInfo.attributes).length > 0 && (
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-slate-700/50 dark:to-slate-800/50 rounded-lg p-6 border border-amber-200 dark:border-slate-600">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Listing Attributes</h4>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableBody>
                        {Object.entries(selectedListingInfo.attributes).map(([key, value]) => {
                          const formattedKey = key
                            .replace(/_/g, ' ')
                            .replace(/([A-Z])/g, ' $1')
                            .replace(/^./, str => str.toUpperCase())
                            .trim()
                          
                          let displayValue = '-'
                          if (value !== null && value !== undefined) {
                            if (Array.isArray(value)) {
                              displayValue = value.join(', ')
                            } else if (typeof value === 'object') {
                              displayValue = JSON.stringify(value)
                            } else {
                              displayValue = value.toString()
                            }
                          }
                          
                          return (
                            <TableRow key={key}>
                              <TableCell className="font-semibold bg-gray-50 dark:bg-slate-700/50 w-48 capitalize">{formattedKey}</TableCell>
                              <TableCell className="break-words">{displayValue}</TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Fullscreen Image Modal */}
      {showFullscreenImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-[60] p-4"
          onClick={() => setShowFullscreenImage(false)}
        >
          <div className="relative max-w-7xl w-full h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 px-4">
              <h3 className="text-xl font-semibold text-white">{fullscreenImageTitle}</h3>
              <Button
                onClick={() => setShowFullscreenImage(false)}
                variant="ghost"
                size="sm"
                className="h-10 w-10 p-0 text-white hover:bg-white/20"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
            
            {/* Image */}
            <div className="flex-1 flex items-center justify-center">
              <img
                src={getProxiedImageUrl(fullscreenImageUrl) || ''}
                alt={fullscreenImageTitle}
                className="max-w-full max-h-full object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            
            {/* Instructions */}
            <div className="text-center text-white/70 text-sm mt-4">
              Click anywhere outside the image to close
            </div>
          </div>
        </div>
      )}

      {/* Gallery Carousel Modal */}
      {showGalleryModal && (
        <div 
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-[70] p-4"
          onClick={closeGalleryModal}
        >
          <div className="relative max-w-6xl w-full">
            {/* Close Button */}
            <Button
              onClick={closeGalleryModal}
              variant="ghost"
              size="sm"
              className="absolute top-4 right-4 z-10 bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              <X className="w-4 h-4" />
            </Button>
            
            <div className="bg-white dark:bg-slate-800 rounded-lg overflow-hidden shadow-2xl">
              {/* Header */}
              <div className="p-4 border-b border-gray-200 dark:border-slate-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-700 dark:to-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                      Gallery Images
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">{galleryTitle}</p>
                  </div>
                  <div className="text-white bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                    {currentGalleryIndex + 1} / {galleryImages.length}
                  </div>
                </div>
              </div>
              
              {/* Image Display */}
              <div className="relative bg-gray-50 dark:bg-slate-900">
                <div className="p-8 flex justify-center items-center min-h-[60vh]">
                  <img
                    src={getProxiedImageUrl(galleryImages[currentGalleryIndex]) || ''}
                    alt={`${galleryTitle} - Image ${currentGalleryIndex + 1}`}
                    className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                    referrerPolicy="no-referrer"
                  />
                </div>
                
                {/* Navigation Buttons */}
                {galleryImages.length > 1 && (
                  <>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation()
                        prevGalleryImage()
                      }}
                      variant="ghost"
                      size="sm"
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white border-white/30"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation()
                        nextGalleryImage()
                      }}
                      variant="ghost"
                      size="sm"
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white border-white/30"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
              
              {/* Thumbnail Strip */}
              {galleryImages.length > 1 && (
                <div className="p-4 border-t dark:border-slate-700 bg-white dark:bg-slate-800">
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {galleryImages.map((img, index) => (
                      <button
                        key={index}
                        onClick={(e) => {
                          e.stopPropagation()
                          setCurrentGalleryIndex(index)
                        }}
                        className={`flex-shrink-0 rounded overflow-hidden border-2 transition-all ${
                          index === currentGalleryIndex
                            ? 'border-cyan-500 ring-2 ring-cyan-500 ring-offset-2 dark:ring-offset-slate-800'
                            : 'border-gray-300 dark:border-gray-600 hover:border-cyan-400'
                        }`}
                      >
                        <img
                          src={getProxiedImageUrl(img) || ''}
                          alt={`Thumbnail ${index + 1}`}
                          className="w-20 h-20 object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Listings

